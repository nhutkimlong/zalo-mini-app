import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header, Page } from "../components/WebPrimitives";
import { Bot, Send, AlertCircle, UserCircle, Trash2, ChevronDown, Clock } from "lucide-react";
import api, { ChatResponse, supabase, UserProfile } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import logoImageUrl from "../assets/logo.png";
import { useDragScroll } from "../hooks/useDragScroll";
import cx from "../utils/cx";
import styles from "../app.module.css";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sources?: ChatResponse["sources"];
  isLoading?: boolean;
  animate?: boolean;
  timestamp?: number;
}

// TypewriterText — animates assistant responses word by word
const TypewriterText: React.FC<{ text: string; onType?: () => void; onComplete: () => void }> = ({
  text, onType, onComplete,
}) => {
  const tokens = React.useMemo(() => text.match(/\s+|\S+/g) || [], [text]);
  const [visibleCount, setVisibleCount] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const onTypeRef = useRef(onType);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onTypeRef.current = onType; }, [onType]);

  useEffect(() => {
    let active = true;
    const total = tokens.length;
    if (total === 0) { onCompleteRef.current(); return; }

    const animate = () => {
      if (!active) return;
      if (visibleCount < total) {
        const delay = total > 150 ? 14 : total > 80 ? 22 : 32;
        setTimeout(() => {
          if (active) {
            setVisibleCount((prev) => prev + 1);
            onTypeRef.current?.();
          }
        }, delay);
      } else {
        onCompleteRef.current();
      }
    };
    animate();
    return () => { active = false; };
  }, [visibleCount, tokens]);

  return (
    <span className={cx(styles, "chat-pre-wrap")}>
      {tokens.slice(0, visibleCount).map((token, index) => (
        <span
          key={index}
          className={cx(styles, token.match(/^\s+$/) ? "chat-token-span-space" : "chat-token-span")}
        >
          {token}
        </span>
      ))}
    </span>
  );
};

const CHAT_HISTORY_STORAGE_KEY = "nui_ba_den_chat_history";

export const ChatPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const chipsRef = useDragScroll();

  const getWelcomeText = (name?: string) => {
    if (language === "km") {
      const g = name ? `សួស្តីបង ${name}!` : "សួស្តី!";
      return `${g} ខ្ញុំជាជំនួយការទេសចរណ៍ AI ភ្នំបាដេន តើខ្ញុំអាចជួយអ្វីបានខ្លះ?`;
    } else if (language === "en") {
      const g = name ? `Hello ${name}!` : "Hello!";
      return `${g} I'm your AI Travel Assistant for Black Lady Mountain, how can I help you today?`;
    } else {
      const g = name ? `Xin chào ${name}!` : "Xin chào!";
      return `${g} Tôi là Trợ lý du lịch AI của Núi Bà Đen, tôi có thể giúp gì cho bạn?`;
    }
  };

  const createWelcomeMessage = (userName?: string): Message => ({
    id: "welcome",
    sender: "assistant",
    text: getWelcomeText(userName),
    timestamp: Date.now(),
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (!saved) return [createWelcomeMessage()];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [createWelcomeMessage()];
      const restored = parsed
        .filter((msg: Partial<Message>) =>
          typeof msg?.id === "string" &&
          (msg.sender === "user" || msg.sender === "assistant") &&
          typeof msg.text === "string"
        )
        .map((msg: Message) => ({ ...msg, isLoading: false }));
      return restored.length > 0 ? restored : [createWelcomeMessage()];
    } catch {
      return [createWelcomeMessage()];
    }
  });

  const [inputValue, setInputValue] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastScrollTimeRef = useRef(0);

  const buildConversationHistory = () =>
    messages
      .filter((msg) => msg.id !== "welcome" && msg.text && !msg.isLoading)
      .map((msg) => ({ role: msg.sender, content: msg.text }))
      .slice(-8);

  const hasUserMessage = messages.some((msg) => msg.sender === "user");

  const clearChatHistory = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
    setMessages([createWelcomeMessage(profile?.name)]);
    setInputValue("");
  };

  const SUGGESTED_QUESTIONS = language === "km"
    ? [
        "តើសំបុត្រឡានកាបមានតម្លៃប៉ុន្មាន?",
        "តើម៉ោងបើកដំណើរការម៉ោងប៉ុន្មាន?",
        "តើមានបទប្បញ្ញត្តិសម្លៀកបំពាក់ចូលវត្ត?",
        "តើធ្វើដំណើរពីទីក្រុងហូជីមិញដោយរបៀបណា?",
        "រឿងព្រេងរបស់លោកយាយ Bà Đen?",
      ]
    : language === "en"
      ? [
          "How much are cable car tickets?",
          "What are the operating hours?",
          "Dress code for the temple?",
          "Travel from Ho Chi Minh City?",
          "Legend of the Black Lady?",
        ]
      : [
          "Giá vé cáp treo hiện nay thế nào?",
          "Giờ hoạt động của khu du lịch?",
          "Quy định trang phục vào chùa?",
          "Di chuyển từ TP.HCM bằng cách nào?",
          "Sự tích Bà Đen (Linh Sơn Thánh Mẫu)?",
        ];

  const isNearBottom = () => {
    const c = chatContainerRef.current;
    if (!c) return true;
    return c.scrollHeight - c.scrollTop - c.clientHeight <= 150;
  };

  const scrollToBottom = (force = false) => {
    const now = Date.now();
    if (force || now - lastScrollTimeRef.current > 120) {
      if (force || isNearBottom()) {
        const c = chatContainerRef.current;
        if (c) c.scrollTop = c.scrollHeight;
        lastScrollTimeRef.current = now;
        setShowScrollBtn(false);
      }
    }
  };

  useEffect(() => { scrollToBottom(true); }, [messages.length]);

  // Show scroll-to-bottom button when not near bottom
  const handleScroll = () => {
    setShowScrollBtn(!isNearBottom());
  };

  // Persist messages to localStorage
  useEffect(() => {
    const stableMessages = messages.filter((msg) => !msg.isLoading).slice(-40);
    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(stableMessages));
  }, [messages]);

  // Fetch profile for personalization
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        api.getMyProfile()
          .then((prof) => {
            if (prof) {
              setProfile(prof);
              setMessages((prev) => {
                const hasUserMsgs = prev.some((m) => m.sender === "user");
                if (!hasUserMsgs) {
                  return prev.map((m) =>
                    m.id === "welcome" ? createWelcomeMessage(prof.name) : m
                  );
                }
                return prev;
              });
            }
          })
          .catch((err) => console.warn("[ChatPage] Profile lookup failed:", err));
      }
    });
  }, []);

  // Update welcome message on language change
  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === "welcome" ? { ...m, text: getWelcomeText(profile?.name) } : m
      )
    );
  }, [language, profile]);

  // Automatically scroll to bottom when virtual keyboard opens or layout resizes
  useEffect(() => {
    const handleViewportResize = () => {
      // Small timeout to wait for the DOM layout adjustments
      setTimeout(() => {
        scrollToBottom(true);
      }, 80);
    };

    const vv = window.visualViewport;
    vv?.addEventListener("resize", handleViewportResize);
    return () => {
      vv?.removeEventListener("resize", handleViewportResize);
    };
  }, []);

  // Handle preloaded question
  useEffect(() => {
    const preloaded = localStorage.getItem("preloaded_question");
    const preloadedLang = localStorage.getItem("preloaded_question_language");
    if (preloaded) {
      localStorage.removeItem("preloaded_question");
      localStorage.removeItem("preloaded_question_language");
      setTimeout(() => {
        handleSendMessage(
          preloaded,
          (preloadedLang === "en" || preloadedLang === "vi" || preloadedLang === "km"
            ? preloadedLang
            : language) as any
        );
      }, 400);
    }
    return () => { abortControllerRef.current?.abort(); };
  }, [profile]);

  const handleSendMessage = async (text: string, messageLanguage = language) => {
    if (!text.trim()) return;

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const userMessageId = `msg-${Date.now()}`;
    const assistantMessageId = `msg-reply-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, sender: "user", text, timestamp: Date.now() },
    ]);
    setInputValue("");
    setMessages((prev) => [
      ...prev,
      { id: assistantMessageId, sender: "assistant", text: "", isLoading: true, timestamp: Date.now() },
    ]);

    try {
      const response = await api.askAssistant(
        text,
        messageLanguage,
        abortControllerRef.current.signal,
        buildConversationHistory()
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, text: response.answer, sources: response.sources, isLoading: false, animate: true }
            : m
        )
      );
    } catch (error: any) {
      if (error.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                text:
                  messageLanguage === "km"
                    ? "ជំនួយការ AI បច្ចុប្បន្នមិនទាន់ដំណើរការ។ សូមព្យាយាមម្តងទៀត។"
                    : messageLanguage === "en"
                      ? "AI Assistant is temporarily unavailable. Please try again later."
                      : "Trợ lý AI tạm thời không khả dụng. Quý khách vui lòng thử lại sau.",
                isLoading: false,
                animate: true,
              }
            : m
        )
      );
    }
  };

  const formatTime = (ts?: number) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Page className={cx(styles, "chat-page-dark")}>
      {/* Header */}
      <Header
        showBackIcon={true}
        title={
          <div className={cx(styles, "chat-header-title-container")}>
            <Bot size={20} className={cx(styles, "gold-text-icon")} />
            <span className={cx(styles, "chat-header-title")}>
              {language === "vi" ? "Trợ lý AI" : language === "en" ? "AI Assistant" : "ជំនួយការ AI"}
            </span>
          </div> as any
        }
      />

      {/* Responsive wrapper: desktop shows sidebar */}
      <div className={cx(styles, "chat-layout-desktop")}>
        {/* Sidebar (desktop only) */}
        <div className={cx(styles, "chat-sidebar")}>
          {/* Profile */}
          <div className={cx(styles, "chat-sidebar-profile")}>
            <img
              src={logoImageUrl}
              alt="Logo"
              className={cx(styles, "chat-sidebar-logo")}
            />
            <div>
              <div className={cx(styles, "chat-sidebar-title")}>
                {language === "vi" ? "Trợ Lý Du Lịch AI" : language === "en" ? "AI Travel Assistant" : "ជំនួយការ AI"}
              </div>
              <div className={cx(styles, "chat-sidebar-subtitle")}>
                Núi Bà Đen · Tây Ninh
              </div>
            </div>
          </div>

          {/* Suggested Questions */}
          <div className={cx(styles, "chat-sidebar-questions-section")}>
            <div className={cx(styles, "chat-sidebar-section-heading")}>
              {language === "en" ? "QUICK QUESTIONS" : language === "km" ? "សំណួររហ័ស" : "CÂU HỎI NHANH"}
            </div>
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className={cx(styles, "chat-sidebar-question-btn")}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Clear history */}
          <div className={cx(styles, "chat-sidebar-footer")}>
            <button
              onClick={clearChatHistory}
              className={cx(styles, "chat-sidebar-clear-btn")}
            >
              <Trash2 size={14} />
              {language === "en" ? "Clear chat history" : language === "km" ? "លុបប្រវត្តិ" : "Xóa lịch sử"}
            </button>
          </div>
        </div>

        {/* Main chat panel */}
        <div className={cx(styles, "chat-main-panel")}>
          {/* Messages scroll area — fills all space between header and input */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className={cx(styles, "chat-messages-scroll")}
          >
            <div className={cx(styles, "chat-messages-container")}>
              {messages.map((msg) => {
                const isUser = msg.sender === "user";

                // Welcome card (shown before first user message)
                if (msg.id === "welcome") {
                  if (hasUserMessage) return null;
                  return (
                    <div key={msg.id} className={cx(styles, "welcome-guide-card")}>
                      <div className={cx(styles, "welcome-logo-wrapper")}>
                        <img
                          src={logoImageUrl}
                          alt="Logo"
                          width={64}
                          height={64}
                          className={cx(styles, "welcome-logo")}
                        />
                      </div>
                      <h2 className={cx(styles, "welcome-title")}>
                        {language === "vi" ? "TRỢ LÝ DU LỊCH AI" : language === "en" ? "AI TRAVEL ASSISTANT" : "ជំនួយការទេសចរណ៍ AI"}
                      </h2>
                      <div className={cx(styles, "welcome-desc")}>
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={cx(styles, `chat-message-row ${isUser ? "chat-message-row-user" : "chat-message-row-assistant"}`)}
                  >
                    {!isUser && (
                      <div className={cx(styles, "chat-avatar-assistant")}>
                        <Bot size={16} className={cx(styles, "gold-text-icon")} />
                      </div>
                    )}

                    <div className={cx(styles, `chat-bubble-container ${isUser ? "chat-bubble-container-user" : "chat-bubble-container-assistant"}`)}>
                      <div className={cx(styles, isUser ? "message-user-premium" : "message-assistant-premium")}>
                        <div>
                          {msg.isLoading ? (
                            <div className={cx(styles, "chat-loading-dots")}>
                              <span /><span /><span />
                            </div>
                          ) : (
                            <div className={cx(styles, "chat-message-content")}>
                              {msg.animate ? (
                                <TypewriterText
                                  text={msg.text}
                                  onType={() => scrollToBottom(false)}
                                  onComplete={() => {
                                    setMessages((prev) =>
                                      prev.map((m) => m.id === msg.id ? { ...m, animate: false } : m)
                                    );
                                    scrollToBottom(true);
                                  }}
                                />
                              ) : (
                                msg.text
                              )}
                            </div>
                          )}
                        </div>

                        {/* Feedback link under assistant messages */}
                        {!msg.isLoading && msg.sender === "assistant" && msg.id !== "welcome" && (
                          <div className={cx(styles, "chat-message-footer")}>
                            <span className={cx(styles, "chat-message-time")}>
                              <Clock size={10} />
                              {formatTime(msg.timestamp)}
                            </span>
                            <Link
                              to="/feedback"
                              className={cx(styles, "chat-report-link")}
                            >
                              <AlertCircle size={11} strokeWidth={2.5} />
                              <span>{language === "en" ? "Report" : language === "km" ? "រាយការណ៍" : "Phản ánh"}</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {isUser && (
                      <div className={cx(styles, "flex-shrink-0")}>
                        <div className={cx(styles, "chat-avatar-user")}>
                          <UserCircle size={20} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button
              onClick={() => scrollToBottom(true)}
              id="scroll-to-bottom-btn"
              className={cx(styles, "chat-scroll-btn")}
              aria-label="Scroll to bottom"
            >
              <ChevronDown size={18} />
            </button>
          )}

          {/* Suggested Quick Chips (mobile only, shown before first message) */}
          {!hasUserMessage && (
            <div className={cx(styles, "chips-slider-wrapper")}>
              <div className={cx(styles, "chips-slider-container")} ref={chipsRef}>
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    className={cx(styles, "chips-slider-item")}
                    onClick={() => handleSendMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className={cx(styles, "floating-input-bar-dark")}>
            <button
              type="button"
              onClick={clearChatHistory}
              id="clear-chat-btn"
              aria-label={language === "km" ? "លុបប្រវត្តិជជែក" : language === "en" ? "Clear chat history" : "Xóa lịch sử chat"}
              title={language === "km" ? "លុបប្រវត្តិជជែក" : language === "en" ? "Clear chat history" : "Xóa lịch sử chat"}
              className={cx(styles, "chat-input-clear-btn")}
            >
              <Trash2 size={16} />
            </button>

            <textarea
              ref={inputRef}
              id="chat-input"
              rows={1}
              className={cx(styles, "input-box-dark")}
              placeholder={t("chat.placeholder")}
              value={inputValue}
              aria-label={
                language === "km" ? "វាយសារ" : language === "en" ? "Type your message" : "Nhập tin nhắn"
              }
              onChange={(e) => {
                setInputValue(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                  if (inputRef.current) inputRef.current.style.height = "auto";
                }
              }}
              onFocus={() => {
                setTimeout(() => {
                  scrollToBottom(true);
                }, 150);
              }}
              autoComplete="off"
              enterKeyHint="send"
            />

            <button
              id="send-message-btn"
              onClick={() => handleSendMessage(inputValue)}
              className={cx(styles, "send-btn-dark")}
              disabled={!inputValue.trim()}
              aria-label={language === "km" ? "ផ្ញើសារ" : language === "en" ? "Send message" : "Gửi tin nhắn"}
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default ChatPage;
