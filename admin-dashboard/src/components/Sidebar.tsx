import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  MapPin,
  Compass,
  Bell,
  AlertTriangle,
  MessageSquare,
  DollarSign,
  Users,
  LogOut,
  Activity
} from "lucide-react";

interface SidebarProps {
  activeTab: "dashboard" | "articles" | "guides" | "places" | "itineraries" | "announcements" | "feedbacks" | "chats" | "usage" | "users" | "realtime";
  setActiveTab: (tab: "dashboard" | "articles" | "guides" | "places" | "itineraries" | "announcements" | "feedbacks" | "chats" | "usage" | "users" | "realtime") => void;
  setSearchQuery: (q: string) => void;
  newFeedbacks: number;
  isOpen?: boolean;
  onClose?: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  setSearchQuery,
  newFeedbacks,
  isOpen = false,
  onClose,
  onLogout,
}) => {
  const handleNavClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchQuery("");
    if (onClose) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent, tab: typeof activeTab) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNavClick(tab);
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
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
          <span className="sidebar-subtitle" style={{ fontSize: "9px" }}>HỆ THỐNG CHINH PHỤC NÚI BÀ ĐEN</span>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", height: "calc(100% - 70px)", justifyContent: "space-between" }}>
        <ul className="nav-list">
          <li
            className={`nav-item ${activeTab === "dashboard" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("dashboard")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, "dashboard")}
          >
            <LayoutDashboard size={18} aria-hidden="true" />
            <span>Bảng Tổng Quan</span>
          </li>
          <li
            className={`nav-item ${activeTab === "articles" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("articles")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, "articles")}
          >
            <BookOpen size={18} aria-hidden="true" />
            <span>Kho Tri Thức RAG</span>
          </li>
          <li
            className={`nav-item ${activeTab === "guides" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("guides")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, "guides")}
          >
            <BookOpen size={18} style={{ color: "var(--accent-gold)" }} aria-hidden="true" />
            <span>Hướng Dẫn Tham Quan</span>
          </li>
          <li
            className={`nav-item ${activeTab === "places" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("places")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, "places")}
          >
            <MapPin size={18} aria-hidden="true" />
            <span>Điểm Tham Quan</span>
          </li>
          <li
            className={`nav-item ${activeTab === "itineraries" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("itineraries")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, "itineraries")}
          >
            <Compass size={18} style={{ color: "var(--accent-gold)" }} aria-hidden="true" />
            <span>Lộ Trình AI</span>
          </li>
          <li
            className={`nav-item ${activeTab === "announcements" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("announcements")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, "announcements")}
          >
            <Bell size={18} aria-hidden="true" />
            <span>Thông Báo BQL</span>
          </li>
          <li
            className={`nav-item ${activeTab === "feedbacks" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("feedbacks")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, "feedbacks")}
          >
            <AlertTriangle size={18} aria-hidden="true" />
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
            className={`nav-item ${activeTab === "realtime" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("realtime")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, "realtime")}
          >
            <Activity size={18} style={{ color: "var(--accent-gold)" }} aria-hidden="true" />
            <span>Thông Tin Thực Địa</span>
          </li>
          <li
            className={`nav-item ${activeTab === "chats" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("chats")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, "chats")}
          >
            <MessageSquare size={18} aria-hidden="true" />
            <span>Giám Sát Chatbot AI</span>
          </li>
          <li
            className={`nav-item ${activeTab === "usage" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("usage")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, "usage")}
          >
            <DollarSign size={18} aria-hidden="true" />
            <span>Chi Phí API</span>
          </li>
          <li
            className={`nav-item ${activeTab === "users" ? "nav-item-active" : ""}`}
            onClick={() => handleNavClick("users")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, "users")}
            style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)", marginTop: "8px", paddingTop: "12px" }}
          >
            <Users size={18} aria-hidden="true" />
            <span>Quản Lý Thành Viên</span>
          </li>
        </ul>

        <ul className="nav-list" style={{ marginTop: "auto", marginBottom: "20px" }}>
          <li
            className="nav-item nav-item-logout"
            onClick={onLogout}
            style={{ 
              color: "#ff6b6b", 
              backgroundColor: "rgba(217, 83, 79, 0.05)",
              border: "1px solid rgba(217, 83, 79, 0.1)"
            }}
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </li>
        </ul>
      </nav>
    </aside>
  );
};
