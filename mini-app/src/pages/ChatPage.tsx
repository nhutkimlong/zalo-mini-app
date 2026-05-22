import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Send, ArrowLeft, AlertCircle, UserCircle } from "lucide-react";
import { getUserInfo } from "zmp-sdk/apis";
import api, { ChatResponse } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import logoImageUrl from "../assets/logo.png";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sources?: ChatResponse["sources"];
  isLoading?: boolean;
}

export const ChatPage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  
  const getWelcomeText = (name?: string) => {
    if (language === "en") {
      return name
        ? `Welcome, ${name}! I am Hướng dẫn viên 4.0 — your intelligent AI guide for Ba Den Mountain National Tourist Area. Ask me about cable car tickets, opening hours, transport routes, temple etiquette, or the legend of Linh Son Thanh Mau.\n\nHow can I help you today?`
        : `Welcome! I am Hướng dẫn viên 4.0 — your intelligent AI guide for Ba Den Mountain National Tourist Area. Ask me about cable car tickets, opening hours, transport routes, temple etiquette, or the legend of Linh Son Thanh Mau.\n\nHow can I help you today?`;
    } else {
      return name
        ? `Xin kính chào anh/chị ${name}! Tôi là Hướng dẫn viên 4.0 — Trợ lý du lịch AI của Khu di tích quốc gia Núi Bà Đen. Tôi có thể giải đáp thông tin về giá vé cáp treo, giờ mở cửa, di chuyển, quy định tham quan đền chùa hoặc lịch sử sự tích Linh Sơn Thánh Mẫu.\n\nAnh/chị muốn tìm hiểu thông tin gì ạ?`
        : `Xin kính chào quý khách! Tôi là Hướng dẫn viên 4.0 — Trợ lý du lịch AI của Khu di tích quốc gia Núi Bà Đen. Tôi có thể giải đáp thông tin về giá vé cáp treo, giờ mở cửa, di chuyển, quy định tham quan đền chùa hoặc lịch sử sự tích Linh Sơn Thánh Mẫu.\n\nQuý khách muốn tìm hiểu thông tin gì hôm nay ạ?`;
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: getWelcomeText()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getDisplayName = (profile: any) => {
    const name = profile?.name?.trim();
    if (!name || name.toLowerCase() === "user name") return undefined;
    return name;
  };

  const buildConversationHistory = () =>
    messages
      .filter((msg) => msg.id !== "welcome" && msg.text && !msg.isLoading)
      .map((msg) => ({
        role: msg.sender,
        content: msg.text,
      }))
      .slice(-8);

  const hasUserMessage = messages.some((msg) => msg.sender === "user");

  const SUGGESTED_QUESTIONS = language === "en" 
    ? [
        "How much are cable car tickets?",
        "What are the operating hours?",
        "What is the dress code for the temple?",
        "How do I travel from Ho Chi Minh City?",
        "What is the legend of Ba Den?"
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

  // Update welcome message if language changes
  useEffect(() => {
    setMessages(prev => prev.map(m => m.id === "welcome" ? {
      ...m,
      text: getWelcomeText(getDisplayName(userProfile))
    } : m));
  }, [language, userProfile]);

  // Clean up on unmount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { userInfo } = await getUserInfo({
          autoRequestPermission: true,
          avatarType: "normal"
        });
        if (userInfo) {
          setUserProfile(userInfo);
        }
      } catch (error) {
        console.warn("Native getUserInfo failed on ChatPage mount:", error);
      }
    };
    fetchProfile();

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
      const response = await api.askAssistant(text, messageLanguage, abortControllerRef.current.signal, buildConversationHistory());

      // 4. Update typing loader with official answer
      setMessages(prev => 
        prev.map(m => m.id === assistantMessageId ? {
          ...m,
          text: response.answer,
          sources: response.sources,
          isLoading: false
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
          isLoading: false
        } : m)
      );
    }
  };

  return (
    <div className="chat-page-dark">
      {/* App Header */}
      <header className="chat-header-dark">
        <Link to="/" style={{ color: "rgba(255, 255, 255, 0.8)", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={22} style={{ color: "var(--accent-gold)" }} />
        </Link>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <MessageSquare size={20} style={{ color: "var(--accent-gold)" }} />
          <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--cream-white)" }}>
            Hướng dẫn viên 4.0
          </h1>
        </div>
        
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
      </header>

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
                    {language === "vi" ? "HƯỚNG DẪN VIÊN 4.0 — TRỢ LÝ DU LỊCH AI" : "GUIDE 4.0 — AI TRAVEL GUIDE"}
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
                    <MessageSquare size={16} style={{ color: "var(--accent-gold)" }} />
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
                    <div style={{ whiteSpace: "pre-line" }}>
                      {msg.text}
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

    </div>
  );
};

export default ChatPage;
