import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  MapPin,
  Compass,
  Bell,
  AlertTriangle,
  MessageSquare,
  DollarSign
} from "lucide-react";

interface SidebarProps {
  activeTab: "dashboard" | "articles" | "guides" | "places" | "itineraries" | "announcements" | "feedbacks" | "chats" | "usage";
  setActiveTab: (tab: "dashboard" | "articles" | "guides" | "places" | "itineraries" | "announcements" | "feedbacks" | "chats" | "usage") => void;
  setSearchQuery: (q: string) => void;
  newFeedbacks: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  setSearchQuery,
  newFeedbacks,
  isOpen = false,
  onClose,
}) => {
  const handleNavClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchQuery("");
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`} style={{ position: "relative" }}>
      <button
        className="show-on-mobile btn btn-secondary"
        style={{
          position: "absolute",
          top: "18px",
          right: "16px",
          padding: "4px 8px",
          fontSize: "12px",
          borderColor: "rgba(255,255,255,0.2)",
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "white",
          minWidth: "30px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
        onClick={onClose}
      >
        ✕
      </button>
      <div className="sidebar-header" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <img src="/logo.png" alt="Logo" style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--accent-gold)", objectFit: "cover" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h1 className="sidebar-title" style={{ fontSize: "16px", margin: 0 }}>BÀ ĐEN ADMIN</h1>
          <span className="sidebar-subtitle" style={{ fontSize: "9px" }}>HỆ THỐNG TRỢ LÝ DU LỊCH SỐ</span>
        </div>
      </div>

      <nav>
        <ul className="nav-list">
          <li
            className={`nav-item ${activeTab === "dashboard" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("dashboard")}
          >
            <LayoutDashboard size={18} />
            <span>Bảng Tổng Quan</span>
          </li>
          <li
            className={`nav-item ${activeTab === "articles" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("articles")}
          >
            <BookOpen size={18} />
            <span>Kho Tri Thức RAG</span>
          </li>
          <li
            className={`nav-item ${activeTab === "guides" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("guides")}
          >
            <BookOpen size={18} style={{ color: "var(--accent-gold)" }} />
            <span>Hướng Dẫn Tham Quan</span>
          </li>
          <li
            className={`nav-item ${activeTab === "places" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("places")}
          >
            <MapPin size={18} />
            <span>Điểm Tham Quan</span>
          </li>
          <li
            className={`nav-item ${activeTab === "itineraries" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("itineraries")}
          >
            <Compass size={18} style={{ color: "var(--accent-gold)" }} />
            <span>Lộ Trình AI</span>
          </li>
          <li
            className={`nav-item ${activeTab === "announcements" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("announcements")}
          >
            <Bell size={18} />
            <span>Thông Báo BQL</span>
          </li>
          <li
            className={`nav-item ${activeTab === "feedbacks" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("feedbacks")}
          >
            <AlertTriangle size={18} />
            <span>Phản Ánh Du Khách</span>
            {newFeedbacks > 0 && (
              <span
                style={{
                  backgroundColor: "var(--danger)",
                  color: "white",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: "10px",
                  marginLeft: "auto",
                  fontWeight: 700
                }}
              >
                {newFeedbacks}
              </span>
            )}
          </li>
          <li
            className={`nav-item ${activeTab === "chats" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("chats")}
          >
            <MessageSquare size={18} />
            <span>Giám Sát Chatbot AI</span>
          </li>
          <li
            className={`nav-item ${activeTab === "usage" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("usage")}
          >
            <DollarSign size={18} />
            <span>Chi Phí API</span>
          </li>
        </ul>
      </nav>
    </aside>
  );
};
