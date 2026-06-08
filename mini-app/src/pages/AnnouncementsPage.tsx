import React, { useEffect, useState } from "react";
import { Header, Page } from "zmp-ui";
import { Bell, ShieldAlert, CloudLightning, Calendar, Info, Search, ChevronDown, ChevronUp } from "lucide-react";
import api, { Announcement } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnns, setFilteredAnns] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { language, t } = useLanguage();

  useEffect(() => {
    setLoading(true);
    api.getAnnouncements()
      .then((data) => {
        setAnnouncements(data);
        setFilteredAnns(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load announcements:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = announcements;

    if (selectedType !== "all") {
      result = result.filter((ann) => ann.type === selectedType);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter((ann) => {
        const title = (language === "km" && ann.title_km ? ann.title_km : language === "en" && ann.title_en ? ann.title_en : ann.title).toLowerCase();
        const content = (language === "km" && ann.content_km ? ann.content_km : language === "en" && ann.content_en ? ann.content_en : ann.content).toLowerCase();
        return title.includes(query) || content.includes(query);
      });
    }

    setFilteredAnns(result);
  }, [searchQuery, selectedType, announcements, language]);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  const getBadgeStyle = (type: Announcement["type"]) => {
    switch (type) {
      case "emergency":
        return {
          bg: "rgba(217, 83, 79, 0.1)",
          color: "var(--alert-red)",
          border: "1px solid rgba(217, 83, 79, 0.3)",
          text: language === "km" ? "អាសន្ន" : language === "en" ? "Emergency" : "Khẩn cấp",
          icon: <ShieldAlert size={14} className="ann-icon-red" />
        };
      case "weather":
        return {
          bg: "rgba(240, 173, 78, 0.1)",
          color: "var(--alert-orange)",
          border: "1px solid rgba(240, 173, 78, 0.3)",
          text: language === "km" ? "អាកាសធាតុ" : language === "en" ? "Weather" : "Thời tiết",
          icon: <CloudLightning size={14} className="ann-icon-orange" />
        };
      case "festival":
        return {
          bg: "rgba(212, 175, 55, 0.1)",
          color: "var(--accent-gold-dark)",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          text: language === "km" ? "ពិធីបុណ្យ" : language === "en" ? "Festival" : "Lễ hội",
          icon: <Calendar size={14} className="ann-icon-gold" />
        };
      default:
        return {
          bg: "rgba(19, 64, 116, 0.1)",
          color: "var(--secondary-blue)",
          border: "1px solid rgba(19, 64, 116, 0.2)",
          text: language === "km" ? "សេចក្តីជូនដំណឹង" : language === "en" ? "Notice" : "Thông báo",
          icon: <Info size={14} className="ann-icon-blue" />
        };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      const atString = language === "km" ? "នៅម៉ោង" : language === "en" ? "at" : "lúc";
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${d.getFullYear()} ${atString} ${d
        .getHours()
        .toString()
        .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Page>
      {/* Page Header */}
      <Header
        showBackIcon={true}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Bell size={20} style={{ stroke: "var(--accent-gold)" }} aria-hidden="true" />
            <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>
              {t("announcements.title").toUpperCase()}
            </span>
          </div> as any
        }
      />

      {/* Hero Accent */}
      <div 
        style={{ 
          background: "linear-gradient(135deg, var(--primary-navy), var(--secondary-blue))",
          padding: "20px 16px",
          color: "var(--cream-white)",
          borderBottom: "1px solid var(--accent-gold)"
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0", color: "var(--accent-gold)" }}>
          {language === "km" ? "ច្រកទ្វារព័ត៌មានផ្លូវការ" : language === "en" ? "Official Information Portal" : "Cổng thông tin chính thức"}
        </h2>
        <p style={{ fontSize: "12px", opacity: 0.9, margin: 0 }}>
          {language === "km"
            ? "ការធ្វើបច្ចុប្បន្នភាពតាមពេលវេលាជាក់ស្តែងអំពីកាលវិភាគថែទាំកាប៊ីនឡាន ពិធីបុណ្យវប្បធម៌ និងសុវត្ថិភាពអាកាសធាតុពីគណៈគ្រប់គ្រង។"
            : language === "en"
              ? "Real-time updates on cable car maintenance schedules, cultural festivals, and weather safety from the Management Board."
              : "Cập nhật nhanh nhất lịch trình bảo trì, lễ hội tâm linh và thông tin thời tiết an toàn từ Ban Quản lý Khu du lịch."}
        </p>
      </div>

      {/* Filter and Search Section */}
      <div style={{ padding: "16px 16px 8px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Search Bar */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            className="feedback-input"
            placeholder={language === "km" ? "ស្វែងរកសេចក្តីជូនដំណឹង..." : language === "en" ? "Search announcements..." : "Tìm kiếm thông báo..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "40px" }}
          />
          <Search 
            size={18} 
            style={{ 
              position: "absolute", 
              left: "14px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: "var(--light-text)" 
            }} 
          />
        </div>

        {/* Tab Buttons for Types */}
        <div 
          style={{ 
            display: "flex", 
            gap: "6px", 
            overflowX: "auto", 
            paddingBottom: "4px",
            scrollbarWidth: "none"
          }}
        >
          <button 
            onClick={() => setSelectedType("all")}
            className={`tab-btn ${selectedType === "all" ? "tab-btn-active" : ""}`}
            style={{ minWidth: "75px", padding: "8px" }}
          >
            {t("places.all")}
          </button>
          <button 
            onClick={() => setSelectedType("emergency")}
            className={`tab-btn ${selectedType === "emergency" ? "tab-btn-active" : ""}`}
            style={{ minWidth: "90px", padding: "8px" }}
          >
            {language === "km" ? "អាសន្ន" : language === "en" ? "Emergency" : "Khẩn cấp"}
          </button>
          <button 
            onClick={() => setSelectedType("weather")}
            className={`tab-btn ${selectedType === "weather" ? "tab-btn-active" : ""}`}
            style={{ minWidth: "90px", padding: "8px" }}
          >
            {language === "km" ? "អាកាសធាតុ" : language === "en" ? "Weather" : "Thời tiết"}
          </button>
          <button 
            onClick={() => setSelectedType("festival")}
            className={`tab-btn ${selectedType === "festival" ? "tab-btn-active" : ""}`}
            style={{ minWidth: "80px", padding: "8px" }}
          >
            {language === "km" ? "ពិធីបុណ្យ" : language === "en" ? "Festival" : "Lễ hội"}
          </button>
          <button 
            onClick={() => setSelectedType("general")}
            className={`tab-btn ${selectedType === "general" ? "tab-btn-active" : ""}`}
            style={{ minWidth: "85px", padding: "8px" }}
          >
            {language === "km" ? "សេចក្តីជូនដំណឹង" : language === "en" ? "Notice" : "Thông tin"}
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div style={{ padding: "8px 16px 24px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--light-text)" }}>
            <div className="spinner" style={{ margin: "0 auto 12px auto" }}></div>
            <span>{t("common.loading")}</span>
          </div>
        ) : filteredAnns.length === 0 ? (
          <div 
            className="glass-card" 
            style={{ 
              textAlign: "center", 
              padding: "40px 20px", 
              color: "var(--light-text)" 
            }}
          >
            <Bell size={32} style={{ stroke: "rgba(11, 37, 69, 0.2)", marginBottom: "12px" }} />
            <p style={{ margin: 0, fontWeight: 600 }}>
              {language === "km" ? "រកមិនឃើញសេចក្តីជូនដំណឹងដែលត្រូវគ្នាទេ" : language === "en" ? "No matching announcements found" : "Không tìm thấy thông báo nào phù hợp"}
            </p>
          </div>
        ) : (
          filteredAnns.map((ann, index) => {
            const badge = getBadgeStyle(ann.type);
            const isExpanded = expandedId === ann.id;
            const titleText = language === "km" && ann.title_km ? ann.title_km : language === "en" && ann.title_en ? ann.title_en : ann.title;
            const contentText = language === "km" && ann.content_km ? ann.content_km : language === "en" && ann.content_en ? ann.content_en : ann.content;

            return (
              <div 
                key={ann.id} 
                className="glass-card fade-in-up" 
                style={{ 
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  borderLeft: `4px solid ${badge.color}`,
                  cursor: "pointer",
                  animationDelay: `${index * 0.05}s`
                }}
                onClick={() => toggleExpand(ann.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleExpand(ann.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
              >
                {/* Announcement Top Info */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "6px",
                      backgroundColor: badge.bg,
                      color: badge.color,
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      border: badge.border
                    }}
                  >
                    {badge.icon}
                    <span>{badge.text}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--light-text)", fontWeight: 500 }}>
                    {formatDate(ann.published_at)}
                  </span>
                </div>

                {/* Title */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--primary-navy)", lineHeight: 1.4 }}>
                    {titleText}
                  </h3>
                  {isExpanded ? (
                    <ChevronUp size={18} style={{ color: "var(--light-text)", flexShrink: 0 }} />
                  ) : (
                    <ChevronDown size={18} style={{ color: "var(--light-text)", flexShrink: 0 }} />
                  )}
                </div>

                {/* Content */}
                <div 
                  style={{ 
                    fontSize: "13.5px", 
                    color: "var(--dark-text)", 
                    lineHeight: 1.5,
                    overflow: "hidden",
                    maxHeight: isExpanded ? "500px" : "40px",
                    transition: "max-height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    opacity: 0.9,
                    marginTop: "4px"
                  }}
                >
                  {contentText}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Page>
  );
};

export default AnnouncementsPage;
