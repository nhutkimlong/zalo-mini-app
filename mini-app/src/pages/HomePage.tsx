import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bot, Compass, Info, FileText, Map, Bell, PhoneCall, ChevronRight } from "lucide-react";
import { Header, Page } from "zmp-ui";
import api, { Announcement } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import heroImageUrl from "../assets/hero.webp";
import logoImageUrl from "../assets/logo.png";

export const HomePage: React.FC = () => {
  const [tickerAnns, setTickerAnns] = useState<Announcement[]>([]);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    api.getAnnouncements().then((anns) => {
      if (anns && anns.length > 0) {
        setTickerAnns(anns);
      }
    });
  }, []);

  return (
    <Page>
      {/* Premium Header */}
      <Header
        showBackIcon={false}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={logoImageUrl} alt="Logo" width={36} height={36} style={{ borderRadius: "8px", border: "1px solid var(--accent-gold)", objectFit: "cover" }} />
            <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <h1 style={{ color: "var(--accent-gold)", margin: 0, fontSize: "16px", fontWeight: 800, letterSpacing: "0.5px" }}>
                {language === "en" ? "BLACK LADY MOUNTAIN" : "NÚI BÀ ĐEN"}
              </h1>
              <span style={{ fontSize: "10px", color: "var(--cream-white)", opacity: 0.85, fontWeight: 600 }}>
                {language === "vi" ? "Trợ Lý Du Lịch Số Quốc Gia" : "National Digital Tourism Assistant"}
              </span>
            </div>
          </div> as any
        }
      />

      {/* Control bar: Language Selector & Notifications */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px",
        backgroundColor: "var(--primary-navy)",
        borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
      }}>
        <div style={{ fontSize: "12px", color: "var(--cream-white)", opacity: 0.8 }}>
          {language === "vi" ? "Chọn ngôn ngữ & thông báo:" : "Select language & notifications:"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Bell Icon */}
          <Link
            to="/announcements"
            style={{
              color: "var(--accent-gold)",
              position: "relative",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            aria-label={language === "en" ? "Announcements" : "Thông báo"}
          >
            <Bell size={16} aria-hidden="true" />
            <span style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              backgroundColor: "var(--alert-red)",
              color: "var(--cream-white)",
              fontSize: "8px",
              fontWeight: 800,
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--primary-navy)"
            }}>
              !
            </span>
          </Link>
          
          {/* Language Selector */}
          <div className="language-selector" style={{ display: "flex", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "20px", padding: "2px", border: "1px solid rgba(212, 175, 55, 0.4)" }}>
            <button
              onClick={() => setLanguage("vi")}
              style={{
                padding: "6px 12px",
                borderRadius: "18px",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                backgroundColor: language === "vi" ? "var(--accent-gold)" : "transparent",
                color: language === "vi" ? "var(--primary-navy)" : "var(--cream-white)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minHeight: "36px",
                minWidth: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              VI
            </button>
            <button
              onClick={() => setLanguage("en")}
              style={{
                padding: "6px 12px",
                borderRadius: "18px",
                border: "none",
                fontSize: "12px",
                fontWeight: 700,
                backgroundColor: language === "en" ? "var(--accent-gold)" : "transparent",
                color: language === "en" ? "var(--primary-navy)" : "var(--cream-white)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                minHeight: "36px",
                minWidth: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Hero Scenic Banner */}
      <div className="home-banner" style={{ backgroundImage: `url("${heroImageUrl}")` }}>
        <div className="banner-content">
          <div className="banner-title">{language === "vi" ? "KHU DU LỊCH QUỐC GIA NÚI BÀ ĐEN" : "BLACK LADY MOUNTAIN NATIONAL TOURIST AREA"}</div>
          <div className="banner-sub">{language === "vi" ? "Huyền thoại linh thiêng - Nóc nhà Nam Bộ 986m" : "Sacred Legend - The Roof of Southern Vietnam 986m"}</div>
        </div>
      </div>

      {/* Dynamic Notification Ticker */}
      {tickerAnns.length > 0 && (
        <Link
          to="/announcements"
          className="ticker-container"
          style={{ textDecoration: "none", display: "flex" }}
          aria-label={language === "en" ? "View latest announcements" : "Xem thông báo mới nhất"}
        >
          <Bell size={16} style={{ stroke: "var(--accent-gold)", flexShrink: 0 }} aria-hidden="true" />
          <div className="ticker-text">
            {tickerAnns.map((ann, idx) => (
              <span key={ann.id ?? idx}>
                <span style={{ fontWeight: 700, color: "var(--alert-red)" }}>[HOT]</span>{" "}
                {language === "en" && ann.title_en ? ann.title_en : ann.title}
                {idx < tickerAnns.length - 1 && (
                  <span style={{ margin: "0 16px", opacity: 0.4 }}>·</span>
                )}
              </span>
            ))}
          </div>
        </Link>
      )}

      {/* Interactive AI Chat Call-to-Action Card (WOW Factor!) */}
      <div style={{ padding: "16px 16px 8px 16px" }}>
        <Link
          to="/chat"
          className="glass-card fade-in-up"
          style={{
            background: "linear-gradient(135deg, rgba(11, 37, 69, 0.95), rgba(19, 64, 116, 0.95))",
            color: "var(--cream-white)",
            border: "2px solid var(--accent-gold)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            textDecoration: "none"
          }}
          aria-label={language === "vi" ? "Trò chuyện với Trợ lý Du lịch AI" : "Chat with AI Tour Guide"}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "rgba(212, 175, 55, 0.2)",
                color: "var(--accent-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Bot size={20} aria-hidden="true" />
              </div>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--accent-gold)" }}>{language === "vi" ? "Hỏi Trợ lý Du lịch AI" : "Ask AI Tour Guide"}</h3>
                <p style={{ fontSize: "12px", opacity: 0.85, margin: 0 }}>{language === "vi" ? "Cung cấp thông tin hỗ trợ du khách.❤️" : "Provides visitor support information.❤️"}</p>
              </div>
            </div>
            <ChevronRight size={20} style={{ color: "var(--accent-gold)" }} aria-hidden="true" />
          </div>
        </Link>
      </div>

      {/* Grid Navigation Cards */}
      <div className="menu-grid">
        <Link to="/info" className="menu-card">
          <div className="menu-icon-container">
            <Info size={24} />
          </div>
          <span>{t("nav.info")}</span>
        </Link>

        <Link to="/places" className="menu-card">
          <div className="menu-icon-container">
            <Compass size={24} />
          </div>
          <span>{t("nav.places")}</span>
        </Link>

        <Link to="/digital-guide" className="menu-card">
          <div className="menu-icon-container">
            <FileText size={24} />
          </div>
          <span>{language === "vi" ? "Thuyết minh số" : "Digital Guide"}</span>
        </Link>

        <Link to="/map" className="menu-card">
          <div className="menu-icon-container">
            <Map size={24} />
          </div>
          <span>{language === "vi" ? "Bản đồ số" : "Digital Map"}</span>
        </Link>
      </div>

      {/* Hotline Call Buttons */}
      <div style={{ padding: "0 16px 16px 16px" }}>
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px 0" }}>{language === "vi" ? "Đường dây nóng hỗ trợ du khách" : "Tourist Support Hotlines"}</h4>
            <p style={{ fontSize: "12px", color: "var(--light-text)", margin: 0 }}>{language === "vi" ? "Chạm để gọi nhanh đúng bộ phận hỗ trợ" : "Tap to call the right support team"}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: language === "vi" ? "An ninh, trật tự" : "Security", phone: "02763823378", display: "0276.3823.378" },
              { label: language === "vi" ? "Dịch vụ du lịch" : "Tourism service", phone: "02763823757", display: "0276.3823.757" },
              { label: language === "vi" ? "Cứu nạn, cứu hộ" : "Rescue", phone: "02763875678", display: "0276.387.5678" },
              { label: language === "vi" ? "PCCC" : "Fire safety", phone: "02763822015", display: "0276.3822.015" }
            ].map((hotline) => (
              <a
                key={hotline.phone}
                href={`tel:${hotline.phone}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  backgroundColor: "var(--primary-navy)",
                  color: "var(--accent-gold)",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textDecoration: "none",
                  border: "1px solid var(--accent-gold)",
                  boxShadow: "0 2px 6px rgba(11, 37, 69, 0.12)"
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <PhoneCall size={14} />
                  {hotline.label}
                </span>
                <span style={{ color: "var(--cream-white)", fontSize: "12px" }}>{hotline.display}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </Page>
  );
};

export default HomePage;
