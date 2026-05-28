import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header, Page } from "zmp-ui";
import { Bot, Send, AlertCircle, UserCircle, Trash2 } from "lucide-react";
import api, { ChatResponse } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import logoImageUrl from "../assets/logo.png";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sources?: ChatResponse["sources"];
  isLoading?: boolean;
  animate?: boolean;
}

const TypewriterText: React.FC<{ text: string; onType?: () => void; onComplete: () => void }> = ({ text, onType, onComplete }) => {
  const tokens = React.useMemo(() => text.match(/\s+|\S+/g) || [], [text]);
  const [visibleCount, setVisibleCount] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const onTypeRef = useRef(onType);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onTypeRef.current = onType;
  }, [onType]);

  useEffect(() => {
    let active = true;
    const total = tokens.length;
    
    if (total === 0) {
      onCompleteRef.current();
      return;
    }

    const animate = () => {
      if (!active) return;
      if (visibleCount < total) {
        const delay = total > 150 ? 15 : total > 80 ? 25 : 35;
        setTimeout(() => {
          if (active) {
            setVisibleCount(prev => prev + 1);
            if (onTypeRef.current) {
              onTypeRef.current();
            }
          }
        }, delay);
      } else {
        onCompleteRef.current();
      }
    };

    animate();

    return () => {
      active = false;
    };
  }, [visibleCount, tokens]);

  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {tokens.map((token, index) => {
        const isVisible = index < visibleCount;
        return (
          <span
            key={index}
            style={{
              opacity: isVisible ? 1 : 0,
              transition: isVisible ? "opacity 0.15s ease-out" : "none",
              display: token.match(/^\s+$/) ? "inline" : "inline-block",
            }}
          >
            {token}
          </span>
        );
      })}
    </span>
  );
};

const CHAT_HISTORY_STORAGE_KEY = "nui_ba_den_chat_history";

export const ChatPage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  
  const getWelcomeText = (name?: string) => {
    if (language === "en") {
      const greeting = name ? `Hello ${name}!` : "Hello!";
      return `${greeting} I am your AI Travel Assistant. How can I help you today?`;
    } else {
      const greeting = name ? `Xin chào anh/chị ${name}!` : "Xin chào quý khách!";
      return `${greeting} Tôi là Trợ lý du lịch AI của Núi Bà Đen. Hôm nay tôi có thể giúp gì cho bạn?`;
    }
  };

  const createWelcomeMessage = (): Message => ({
    id: "welcome",
    sender: "assistant",
    text: getWelcomeText()
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const buildConversationHistory = () =>
    messages
      .filter((msg) => msg.id !== "welcome" && msg.text && !msg.isLoading)
      .map((msg) => ({
        role: msg.sender,
        content: msg.text,
      }))
      .slice(-8);

  const hasUserMessage = messages.some((msg) => msg.sender === "user");

  const clearChatHistory = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
    setMessages([createWelcomeMessage()]);
    setInputValue("");
  };

  const SUGGESTED_QUESTIONS = language === "en" 
    ? [
        "How much are cable car tickets?",
        "What are the operating hours?",
        "What is the dress code for the temple?",
        "How do I travel from Ho Chi Minh City?",
        "What is the legend of Black Lady?"
      ]
    : [
        "Giá vé cáp treo hiện nay thế nào?",
        "Giờ hoạt động của khu du lịch?",
        "Quy định trang phục vào chùa?",
        "Di chuyển từ TP.HCM bằng cách nào?",
        "Sự tích Bà Đen (Linh Sơn Thánh Mẫu)?"
      ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const stableMessages = messages
      .filter((msg) => !msg.isLoading)
      .slice(-40);
    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(stableMessages));
  }, [messages]);

  // Update welcome message if language changes
  useEffect(() => {
    setMessages(prev => prev.map(m => m.id === "welcome" ? {
      ...m,
      text: getWelcomeText()
    } : m));
  }, [language]);

  // Clean up on unmount
  useEffect(() => {
    const preloaded = localStorage.getItem("preloaded_question");
    const preloadedLanguage = localStorage.getItem("preloaded_question_language");
    if (preloaded) {
      localStorage.removeItem("preloaded_question");
      localStorage.removeItem("preloaded_question_language");
      setTimeout(() => {
        handleSendMessage(preloaded, preloadedLanguage === "en" || preloadedLanguage === "vi" ? preloadedLanguage : language);
      }, 400);
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSendMessage = async (text: string, messageLanguage = language) => {
    if (!text.trim()) return;

    // Abort active request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessageId = `msg-${Date.now()}`;
    const assistantMessageId = `msg-reply-${Date.now()}`;

    // 1. Add user message
    setMessages(prev => [...prev, { id: userMessageId, sender: "user", text }]);
    setInputValue("");

    // 2. Add temporary typing loader
    setMessages(prev => [...prev, { id: assistantMessageId, sender: "assistant", text: "", isLoading: true }]);

    try {
      // 3. Make RAG search with the message language
      const response = await api.askAssistant(
        text, 
        messageLanguage, 
        abortControllerRef.current.signal, 
        buildConversationHistory()
      );

      // 4. Update typing loader with official answer
      setMessages(prev => 
        prev.map(m => m.id === assistantMessageId ? {
          ...m,
          text: response.answer,
          sources: response.sources,
          isLoading: false,
          animate: true
        } : m)
      );
    } catch (error: any) {
      if (error.name === "AbortError") return;

      setMessages(prev =>
        prev.map(m => m.id === assistantMessageId ? {
          ...m,
          text: messageLanguage === "en"
            ? "Hướng dẫn viên 4.0 is temporarily unavailable. Please try again later or contact the Management Board for support."
            : "Hướng dẫn viên 4.0 tạm thời không khả dụng. Quý khách vui lòng thử lại sau hoặc liên hệ Ban Quản lý qua số điện thoại (0276) 3823.378 để được hỗ trợ.",
          isLoading: false,
          animate: true
        } : m)
      );
    }
  };

  return (
    <Page className="chat-page-dark">
      {/* App Header */}
      <Header
        showBackIcon={true}
        title={
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Bot size={20} style={{ color: "var(--accent-gold)" }} />
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--cream-white)" }}>
              {language === "vi" ? "Trợ lý AI" : "AI Assistant"}
            </span>
          </div> as any
        }
      />
        
      {/* Control bar: Language Selector & Trash */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px",
        backgroundColor: "var(--primary-navy)",
        borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
      }}>
        <div style={{ fontSize: "12px", color: "var(--cream-white)", opacity: 0.8 }}>
          {language === "vi" ? "Công cụ hỗ trợ:" : "Assistant tools:"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={clearChatHistory}
            aria-label={language === "en" ? "Clear chat history" : "Xóa lịch sử chat"}
            title={language === "en" ? "Clear chat history" : "Xóa lịch sử chat"}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1px solid rgba(212, 175, 55, 0.4)",
              background: "rgba(255, 255, 255, 0.08)",
              color: "var(--accent-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0
            }}
          >
            <Trash2 size={15} />
          </button>

          {/* Bilingual Selector Pill (Zero-Emoji Mandate!) */}
          <div className="lang-toggle-pill">
            <button 
              onClick={() => setLanguage("vi")}
              className={`lang-toggle-btn ${language === "vi" ? "active" : ""}`}
            >
              VI
            </button>
            <button 
              onClick={() => setLanguage("en")}
              className={`lang-toggle-btn ${language === "en" ? "active" : ""}`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Main Conversation Window */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            
            // Custom render for Welcome Message
            if (msg.id === "welcome") {
              if (hasUserMessage) return null;

              return (
                <div key={msg.id} className="welcome-guide-card">
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                    <img 
                      src={logoImageUrl} 
                      alt="Logo" 
                      width={64}
                      height={64}
                      style={{ 
                        width: "64px", 
                        height: "64px", 
                        borderRadius: "14px", 
                        border: "2px solid var(--accent-gold)", 
                        boxShadow: "0 4px 15px rgba(212, 175, 55, 0.3)", 
                        objectFit: "cover" 
                      }} 
                    />
                  </div>
                  <h2 style={{ fontSize: "16px", color: "var(--accent-gold)", fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "0.5px" }}>
                    {language === "vi" ? "TRỢ LÝ DU LỊCH AI" : "AI TRAVEL ASSISTANT"}
                  </h2>
                  <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.6, whiteSpace: "pre-line", textAlign: "left", padding: "0 4px" }}>
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={msg.id} 
                style={{ 
                  display: "flex", 
                  alignItems: "flex-start", 
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  gap: "10px",
                  width: "100%",
                  contentVisibility: "auto",
                  containIntrinsicSize: "0 80px"
                }}
              >
                {!isUser && (
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(212, 175, 55, 0.15)",
                    border: "1px solid var(--accent-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                  }}>
                    <Bot size={16} style={{ color: "var(--accent-gold)" }} />
                  </div>
                )}

                <div 
                  className={isUser ? "message-user-premium" : "message-assistant-premium"}
                  style={{ margin: 0, maxWidth: "75%" }}
                >
                  {msg.isLoading ? (
                    <div style={{ display: "flex", gap: "6px", padding: "6px 8px", alignItems: "center" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-gold)" }}></div>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-gold)" }}></div>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-gold)" }}></div>
                    </div>
                  ) : (
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {msg.animate ? (
                        <TypewriterText
                          text={msg.text}
                          onType={scrollToBottom}
                          onComplete={() => {
                            // Turn off animation flag once typed
                            setMessages(prev =>
                              prev.map(m => m.id === msg.id ? { ...m, animate: false } : m)
                            );
                            scrollToBottom();
                          }}
                        />
                      ) : (
                        msg.text
                      )}
                    </div>
                  )}

                  {/* Message Action Footer: Incorrect Feedback report */}
                  {!msg.isLoading && msg.sender === "assistant" && (
                    <div style={{ 
                      marginTop: "12px", 
                      fontSize: "11px", 
                      color: "rgba(255, 255, 255, 0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: "8px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                      paddingTop: "8px"
                    }}>
                      <Link 
                        to="/feedback" 
                        style={{ 
                          color: "rgba(217, 83, 79, 0.85)", 
                          fontWeight: 700, 
                          textDecoration: "none", 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "4px",
                          padding: "4px 6px"
                        }}
                      >
                        <AlertCircle size={12} style={{ strokeWidth: 2.5 }} />
                        <span>{language === "en" ? "Report" : "Phản ánh"}</span>
                      </Link>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div style={{ flexShrink: 0 }}>
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "var(--primary-navy)",
                      border: "1px solid var(--accent-gold)",
                      color: "var(--accent-gold)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                    }}>
                      <UserCircle size={22} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Quick Prompt Chips slider - Kinetic slider sticky above bottom bar */}
      <div style={{ zIndex: 98, backgroundColor: "rgba(6, 21, 42, 0.65)" }}>
        {!hasUserMessage && (
          <div className="chips-slider-container">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button 
                key={idx} 
                className="chips-slider-item"
                onClick={() => handleSendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Input Message Bar */}
      <div className="floating-input-bar-dark">
        <input 
          type="text" 
          className="input-box-dark" 
          placeholder={t("chat.placeholder")} 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage(inputValue);
          }}
        />
        <button 
          onClick={() => handleSendMessage(inputValue)}
          className="send-btn-dark"
        >
          <Send size={18} />
        </button>
      </div>

    </Page>
  );
};

export default ChatPage;
