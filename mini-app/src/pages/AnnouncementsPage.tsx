import React, { useEffect, useState } from "react";
import { Header, Page } from "../components/WebPrimitives";
import { Bell, ShieldAlert, CloudLightning, Calendar, Info, Search, ChevronDown, ChevronUp } from "lucide-react";
import api, { Announcement } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { useDragScroll } from "../hooks/useDragScroll";
import cx from "../utils/cx";
import styles from "../app.module.css";

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnns, setFilteredAnns] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const tabsRef = useDragScroll();

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
          className: "ann-badge-emergency",
          text: language === "km" ? "អាសន្ន" : language === "en" ? "Emergency" : "Khẩn cấp",
          icon: <ShieldAlert size={14} />
        };
      case "weather":
        return {
          className: "ann-badge-weather",
          text: language === "km" ? "អាកាសធាតុ" : language === "en" ? "Weather" : "Thời tiết",
          icon: <CloudLightning size={14} />
        };
      case "festival":
        return {
          className: "ann-badge-festival",
          text: language === "km" ? "ពិធីបុណ្យ" : language === "en" ? "Festival" : "Lễ hội",
          icon: <Calendar size={14} />
        };
      default:
        return {
          className: "ann-badge-general",
          text: language === "km" ? "សេចក្តីជូនដំណឹង" : language === "en" ? "Notice" : "Thông tin",
          icon: <Info size={14} />
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
        title={t("announcements.title")}
      />

      {/* Hero Accent */}
      <div className={cx(styles, "ann-hero-accent")}>
        <h2 className={cx(styles, "ann-hero-title")}>
          {language === "km" ? "ច្រកទ្វារព័ត៌មានផ្លូវការ" : language === "en" ? "Official Information Portal" : "Cổng thông tin chính thức"}
        </h2>
        <p className={cx(styles, "ann-hero-desc")}>
          {language === "km"
            ? "ការធ្វើបច្ចុប្បន្នភាពតាមពេលវេលាជាក់ស្តែងអំពីកាលវិភាគថែទាំកាប៊ីនឡាន ពិធីបុណ្យវប្បធម៌ និងសុវត្ថិភាពអាកាសធាតុពីគណៈគ្រប់គ្រង។"
            : language === "en"
              ? "Real-time updates on cable car maintenance schedules, cultural festivals, and weather safety from the Management Board."
              : "Cập nhật nhanh nhất lịch trình bảo trì, lễ hội tâm linh và thông tin thời tiết an toàn từ Ban Quản lý Khu du lịch."}
        </p>
      </div>

      {/* Filter and Search Section */}
      <div className={cx(styles, "ann-filter-section")}>
        {/* Search Bar */}
        <div className={cx(styles, "ann-search-wrapper")}>
          <input
            type="text"
            className={cx(styles, "feedback-input ann-search-input")}
            placeholder={language === "km" ? "ស្វែងរកសេចក្តីជូនដំណឹង..." : language === "en" ? "Search announcements..." : "Tìm kiếm thông báo..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            enterKeyHint="search"
            autoComplete="off"
          />
          <Search size={18} className={cx(styles, "ann-search-icon")} />
        </div>

        {/* Tab Buttons for Types */}
        <div className={cx(styles, "ann-tabs-scroll")} ref={tabsRef}>
          <button 
            onClick={() => setSelectedType("all")}
            className={cx(styles, `tab-btn ann-tab-btn-override ${selectedType === "all" ? "tab-btn-active" : ""}`)}
          >
            {t("places.all")}
          </button>
          <button 
            onClick={() => setSelectedType("emergency")}
            className={cx(styles, `tab-btn ann-tab-btn-override ${selectedType === "emergency" ? "tab-btn-active" : ""}`)}
          >
            {language === "km" ? "អាសន្ន" : language === "en" ? "Emergency" : "Khẩn cấp"}
          </button>
          <button 
            onClick={() => setSelectedType("weather")}
            className={cx(styles, `tab-btn ann-tab-btn-override ${selectedType === "weather" ? "tab-btn-active" : ""}`)}
          >
            {language === "km" ? "អាកាសធាតុ" : language === "en" ? "Weather" : "Thời tiết"}
          </button>
          <button 
            onClick={() => setSelectedType("festival")}
            className={cx(styles, `tab-btn ann-tab-btn-override ${selectedType === "festival" ? "tab-btn-active" : ""}`)}
          >
            {language === "km" ? "ពិធីបុណ្យ" : language === "en" ? "Festival" : "Lễ hội"}
          </button>
          <button 
            onClick={() => setSelectedType("general")}
            className={cx(styles, `tab-btn ann-tab-btn-override ${selectedType === "general" ? "tab-btn-active" : ""}`)}
          >
            {language === "km" ? "សេចក្តីជូនដំណឹង" : language === "en" ? "Notice" : "Thông tin"}
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className={cx(styles, "ann-list-container")}>
        {loading ? (
          <div className={cx(styles, "ann-loading-box")}>
            <div className={cx(styles, "spinner ann-loading-spinner")}></div>
            <span>{t("common.loading")}</span>
          </div>
        ) : filteredAnns.length === 0 ? (
          <div className={cx(styles, "glass-card ann-empty-card")}>
            <Bell size={32} className={cx(styles, "ann-empty-icon")} />
            <p className={cx(styles, "ann-empty-text")}>
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
                className={cx(styles, `glass-card fade-in-up ann-card ann-card-${ann.type}`)} 
                style={{ 
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
                <div className={cx(styles, "ann-card-header")}>
                  <div className={cx(styles, `ann-card-badge ${badge.className}`)}>
                    {badge.icon}
                    <span>{badge.text}</span>
                  </div>
                  <span className={cx(styles, "ann-card-date")}>
                    {formatDate(ann.published_at)}
                  </span>
                </div>

                {/* Title */}
                <div className={cx(styles, "ann-card-title-row")}>
                  <h3 className={cx(styles, "ann-card-title")}>
                    {titleText}
                  </h3>
                  {isExpanded ? (
                    <ChevronUp size={18} className={cx(styles, "ann-card-arrow")} />
                  ) : (
                    <ChevronDown size={18} className={cx(styles, "ann-card-arrow")} />
                  )}
                </div>

                {/* Content */}
                <div 
                  className={cx(styles, "ann-card-content")}
                  style={{ 
                    maxHeight: isExpanded ? "500px" : "40px",
                    transition: "max-height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
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
