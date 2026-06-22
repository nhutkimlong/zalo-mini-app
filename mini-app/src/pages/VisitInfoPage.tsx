import React, { useState, useEffect } from "react";
import { Header, Page } from "../components/WebPrimitives";
import { Clock, Ticket, Navigation, ShieldCheck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import api, { KnowledgeArticle } from "../services/api";
import { useDragScroll } from "../hooks/useDragScroll";

type TabType = "tickets" | "travel" | "rules";

export interface TicketItem {
  name: string;
  price: string;
  priceOneway?: string;
}

export interface TicketSection {
  title: string;
  items: TicketItem[];
}

export interface OperatingScheduleItem {
  label: string;
  hours: string;
  note?: string;
}

export interface OperatingScheduleSection {
  title: string;
  items: OperatingScheduleItem[];
}

// 0. Parse Dynamic Tickets and Sections - NO HARDCODED DEFAULTS, data must come from DB
const parseTickets = (articles: any[], lang: string): TicketSection[] => {
  if (!articles || articles.length === 0) return [];

  // 1. Prioritize article with "giá vé" / "ticket" / "price" / "សំបុត្រ" in the title
  let priceArticle = articles.find(art => {
    const title = (art.title || "").toLowerCase();
    const titleKm = (art.title_km || "").toLowerCase();
    return (
      title.includes("giá vé") || title.includes("gia ve") ||
      title.includes("ticket") || title.includes("price") ||
      titleKm.includes("សំបុត្រ") || titleKm.includes("តម្លៃ")
    );
  });

  // 2. Fallback to content matching if no title matches
  if (!priceArticle) {
    priceArticle = articles.find(art => {
      const content = (art.content || "").toLowerCase();
      const contentKm = (art.content_km || "").toLowerCase();
      return content.includes("tuyến cáp") || content.includes("giá vé") || content.includes("gia ve") || contentKm.includes("កាប៊ីន") || contentKm.includes("សំបុត្រ");
    });
  }

  if (!priceArticle) return [];
  const content = (lang === "km" && priceArticle.content_km) 
    ? priceArticle.content_km.trim() 
    : (lang === "en" && priceArticle.content_en) 
      ? priceArticle.content_en.trim() 
      : priceArticle.content ? priceArticle.content.trim() : "";

  if (!content) return [];

  // Primary path: JSON format (set by Admin visual builder)
  if (content.startsWith("[") || content.startsWith("{")) {
    try {
      const parsed = JSON.parse(content);
      const ticketSections = Array.isArray(parsed) ? parsed : parsed.tickets;

      if (Array.isArray(ticketSections) && ticketSections.length > 0) {
        return ticketSections.map(section => ({
          title: (lang === "km" && section.titleKm) ? section.titleKm : (lang === "en" && section.titleEn) ? section.titleEn : (section.title || ""),
          items: (section.items || []).map((item: any) => ({
            name: (lang === "km" && item.nameKm) ? item.nameKm : (lang === "en" && item.nameEn) ? item.nameEn : (item.name || ""),
            price: (() => {
              const p = (lang === "km" && item.priceKm) ? item.priceKm : (lang === "en" && item.priceEn) ? item.priceEn : (item.price || "");
              if (lang === "km" && p.toLowerCase().includes("miễn phí")) return "ឥតគិតថ្លៃ";
              if (lang === "en" && p.toLowerCase().includes("miễn phí")) return "Free";
              return p;
            })(),
            priceOneway: (lang === "km" && item.priceOnewayKm)
              ? item.priceOnewayKm
              : (lang === "en" && item.priceOnewayEn)
                ? item.priceOnewayEn
                : (item.priceOneway || undefined)
          }))
        }));
      }
    } catch (e) {
      console.warn("[parseTickets] JSON parse failed, trying plain-text fallback", e);
    }
  }

  // Fallback path: plain-text parsing (legacy format)
  const lines = content.split("\n");
  const sections: TicketSection[] = [];
  let currentSection: TicketSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const sectionMatch =
      trimmed.match(/^\[(.*?)\]/) ||
      trimmed.match(/^(?:\d+\.|\*)\s*(.*?)(?::|$)/);

    if (
      sectionMatch &&
      (trimmed.startsWith("[") ||
        trimmed.toLowerCase().includes("tuyến") ||
        trimmed.toLowerCase().includes("combo") ||
        trimmed.toLowerCase().includes("ខ្សែ") ||
        trimmed.toLowerCase().includes("សំបុត្រ"))
    ) {
      let title = sectionMatch[1].trim();
      const lowerTitle = title.toLowerCase();

      if (lowerTitle.includes("vân sơn") || lowerTitle.includes("van son")) {
        title = lang === "km" ? "ខ្សែរថយន្តកាប៊ីន Vân Sơn (ឡើងលើកំពូលភ្នំ)" : lang === "en" ? "Van Son Cable Route (To the Peak)" : "Tuyến cáp Vân Sơn (Lên Đỉnh núi)";
      } else if (lowerTitle.includes("chùa hang") || lowerTitle.includes("chua hang")) {
        title = lang === "km" ? "ខ្សែរថយន្តកាប៊ីន Chùa Hang (ឡើងវត្តលោកយាយ)" : lang === "en" ? "Chua Hang Cable Route (To Ba Temple)" : "Tuyến cáp Chùa Hang (Lên Chùa Bà)";
      } else if (lowerTitle.includes("combo")) {
        title = lang === "km" ? "សំបុត្ររួម Combo" : lang === "en" ? "Combo All Lines" : "Vé Combo Cáp Treo";
      }
      currentSection = { title, items: [] };
      sections.push(currentSection);
      continue;
    }

    if (trimmed.startsWith("-") || trimmed.startsWith("*") || /^\d+\./.test(trimmed)) {
      const cleanLine = trimmed.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "");
      const parts = cleanLine.split(":");

      if (parts.length >= 2) {
        const name = parts[0].trim();
        const pricePart = parts.slice(1).join(":").trim();
        let price = pricePart;
        let priceOneway: string | undefined;

        const onewayRegex = /(?:một chiều|one-way|មួយផ្លូវ)\s*[:\-]?\s*(\d{1,3}(?:\.\d{3})+|\d{5,6})/i;
        const onewayMatch = pricePart.match(onewayRegex);
        if (onewayMatch) {
          priceOneway = onewayMatch[1] + (lang === "km" ? " រៀល" : " VNĐ");
          price = pricePart.split(/một chiều/i)[0].split(/one-way/i)[0].split(/មួយផ្លូវ/i)[0].trim();
        }

        const priceMatch = price.match(/(\d{1,3}(?:\.\d{3})+|\d{5,6})/);
        if (priceMatch) {
          price = priceMatch[0] + (lang === "km" ? " រៀល" : " VNĐ");
        } else if (/miễn phí|free|mien phi|ឥតគិតថ្លៃ/i.test(price)) {
          price = lang === "km" ? "ឥតគិតថ្លៃ" : lang === "en" ? "Free" : "Miễn phí";
        }

        if (name && price) {
          if (!currentSection) {
            currentSection = { title: lang === "km" ? "សំបុត្រកាប៊ីនឡាន" : lang === "en" ? "Cable Car Tickets" : "Vé cáp treo", items: [] };
            sections.push(currentSection);
          }
          currentSection.items.push({ name, price, priceOneway });
        }
      }
    }
  }

  return sections;
};

// 2. Extract Operating Hours
const parseOperatingSchedules = (articles: any[], lang: string): OperatingScheduleSection[] => {
  if (!articles || articles.length === 0) return [];

  // 1. Prioritize article with "giờ" / "lịch" / "schedule" / "operating" / "hour" / "ម៉ោង" in the title
  let article = articles.find((art: any) => {
    const title = (art.title || "").toLowerCase();
    const titleKm = (art.title_km || "").toLowerCase();
    const content = (lang === "km" && art.content_km) 
      ? art.content_km.trim() 
      : (lang === "en" && art.content_en) 
        ? art.content_en.trim() 
        : art.content ? art.content.trim() : "";
        
    if (!content.startsWith("{")) return false;
    
    const hasKeywords = 
      title.includes("giờ") || title.includes("gio") || 
      title.includes("lịch") || title.includes("lich") || 
      title.includes("schedule") || title.includes("operating") || title.includes("hour") ||
      titleKm.includes("ម៉ោង") || titleKm.includes("ប្រតិបត្តិការ");
      
    if (!hasKeywords) return false;
    
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed.schedules);
    } catch {
      return false;
    }
  });

  // 2. Fallback to any JSON article with schedules if no title matches
  if (!article) {
    article = articles.find((art: any) => {
      const content = (lang === "km" && art.content_km) 
        ? art.content_km.trim() 
        : (lang === "en" && art.content_en) 
          ? art.content_en.trim() 
          : art.content ? art.content.trim() : "";
      if (!content.startsWith("{")) return false;
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed.schedules);
      } catch {
        return false;
      }
    });
  }

  if (!article) return [];
  const content = (lang === "km" && article.content_km) 
    ? article.content_km.trim() 
    : (lang === "en" && article.content_en) 
      ? article.content_en.trim() 
      : article.content ? article.content.trim() : "";

  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.schedules)) return [];

    return parsed.schedules
      .map((section: any) => ({
        title: (lang === "km" && section.titleKm) ? section.titleKm : (lang === "en" && section.titleEn) ? section.titleEn : (section.title || ""),
        items: (section.items || []).map((item: any) => ({
          label: (lang === "km" && item.labelKm) ? item.labelKm : (lang === "en" && item.labelEn) ? item.labelEn : (item.label || ""),
          hours: (lang === "km" && item.hoursKm) ? item.hoursKm : (lang === "en" && item.hoursEn) ? item.hoursEn : (item.hours || ""),
          note: (lang === "km" && item.noteKm) ? item.noteKm : (lang === "en" && item.noteEn) ? item.noteEn : (item.note || "")
        })).filter((item: OperatingScheduleItem) => item.label || item.hours || item.note)
      }))
      .filter((section: OperatingScheduleSection) => section.title || section.items.length > 0);
  } catch (e) {
    console.warn("[parseOperatingSchedules] JSON parse failed", e);
    return [];
  }
};

// 2. Parse plain-text content from DB into structured list items
const parseArticleContent = (content: string): Array<{ text: string; level: number; isHeading: boolean }> => {
  if (!content) return [];

  const lines = content.split("\n");
  const result: Array<{ text: string; level: number; isHeading: boolean }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isNumberedSection = /^\d+\.\s+/.test(trimmed) && trimmed.endsWith(":");
    const isNumberedItem = /^\d+\.\s+/.test(trimmed) && !trimmed.endsWith(":");
    const isBullet = /^[-*•]\s+/.test(trimmed);
    const isHeadingLine = trimmed.endsWith(":") && !isBullet;

    if (isNumberedSection || isHeadingLine) {
      result.push({ text: trimmed, level: 0, isHeading: true });
    } else if (isNumberedItem) {
      result.push({ text: trimmed.replace(/^\d+\.\s+/, ""), level: 0, isHeading: false });
    } else if (isBullet) {
      result.push({ text: trimmed.replace(/^[-*•]\s+/, ""), level: 1, isHeading: false });
    } else if (trimmed.length > 3) {
      result.push({ text: trimmed, level: 0, isHeading: false });
    }
  }

  return result;
};

export const VisitInfoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("tickets");
  const { language, t } = useLanguage();
  const tabsRef = useDragScroll();

  const [ticketArticles, setTicketArticles] = useState<KnowledgeArticle[]>([]);
  const [travelArticles, setTravelArticles] = useState<KnowledgeArticle[]>([]);
  const [rulesArticles, setRulesArticles] = useState<KnowledgeArticle[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const parsedSections = parseTickets(ticketArticles, language);
  const scheduleSections = parseOperatingSchedules(ticketArticles, language);

  useEffect(() => {
    const fetchArticles = async () => {
      setTicketsLoading(true);
      try {
        const [tickets, travel, rules] = await Promise.all([
          api.getArticlesByCategory("ve_va_gio_mo_cua"),
          api.getArticlesByCategory("di_chuyen"),
          api.getArticlesByCategory("noi_quy")
        ]);
        setTicketArticles(tickets);
        setTravelArticles(travel);
        setRulesArticles(rules);
      } catch (err) {
        console.warn("Failed to fetch dynamic articles:", err);
      } finally {
        setTicketsLoading(false);
      }
    };
    fetchArticles();
  }, []);

  return (
    <Page>
      {/* Header */}
      <Header title={t("info.title")} showBackIcon={true} />

      {/* Tabs Switcher */}
      <div className="custom-tabs" ref={tabsRef}>
        <button 
          className={`tab-btn ${activeTab === "tickets" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("tickets")}
        >
          {language === "km" ? "សំបុត្រ & ម៉ោង" : language === "en" ? "Tickets & Hours" : "Lịch & Vé"}
        </button>

        <button 
          className={`tab-btn ${activeTab === "travel" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("travel")}
        >
          {language === "km" ? "ការធ្វើដំណើរ" : language === "en" ? "Transport" : "Di chuyển"}
        </button>

        <button 
          className={`tab-btn ${activeTab === "rules" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("rules")}
        >
          {language === "km" ? "បទប្បញ្ញត្តិ" : language === "en" ? "Rules" : "Nội quy"}
        </button>
      </div>

      {/* Tab 1 Content: Tickets & Hours */}
      {activeTab === "tickets" && (
        <div className="info-tab-content">
          {ticketsLoading ? (
            /* Loading skeleton */
            [1, 2, 3].map(i => (
              <div key={i} className="glass-card" style={{ opacity: 0.5 }}>
                <div style={{ height: "18px", width: "60%", background: "rgba(0,0,0,0.08)", borderRadius: "6px", marginBottom: "14px" }} />
                <div style={{ height: "12px", width: "100%", background: "rgba(0,0,0,0.06)", borderRadius: "4px", marginBottom: "8px" }} />
                <div style={{ height: "12px", width: "80%", background: "rgba(0,0,0,0.06)", borderRadius: "4px" }} />
              </div>
            ))
          ) : parsedSections.length === 0 ? (
            /* Empty state */
            <div className="glass-card empty-state-text">
              <Ticket size={36} style={{ color: "var(--site-gold)", opacity: 0.5, marginBottom: "12px" }} />
              <p style={{ margin: 0 }}>
                {language === "km" ? "ព័ត៌មានសំបុត្រកំពុងត្រូវបានធ្វើបច្ចុប្បន្នភាព។ សូមត្រលប់មកវិញឆាប់ៗនេះ។" : language === "en" ? "Ticket information is being updated. Please check back soon." : "Thông tin vé đang được cập nhật. Vui lòng quay lại sau."}
              </p>
            </div>
          ) : (
            parsedSections.map((section, sIdx) => {
              const hasOneway = section.items.some(item => !!item.priceOneway);
              return (
                <div className="glass-card" key={sIdx}>
                  <h3 className="info-section-header">
                    <Ticket size={18} style={{ color: "var(--site-gold)" }} />
                    <span>{section.title}</span>
                  </h3>

                  <table className="info-ticket-table">
                    <thead>
                      <tr className="info-table-head-row">
                        <th className="info-table-th">{language === "km" ? "ប្រភេទភ្ញៀវទេសចរ" : language === "en" ? "Visitor Category" : "Đối tượng"}</th>
                        <th className="info-table-th">
                          {language === "km" 
                            ? "តម្លៃសំបុត្រទៅមក" 
                            : hasOneway 
                              ? (language === "en" ? "Round-trip" : "Giá khứ hồi") 
                              : (language === "en" ? "Round-trip Price" : "Giá vé khứ hồi")}
                        </th>
                        {hasOneway && (
                          <th className="info-table-th">{language === "km" ? "មួយផ្លូវ" : language === "en" ? "One-way" : "Một chiều"}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((item, iIdx) => {
                        const isFree = item.price.toLowerCase().includes("miễn phí") || item.price.toLowerCase().includes("free") || item.price.toLowerCase().includes("mien phi") || item.price.toLowerCase().includes("ឥតគិតថ្លៃ");
                        return (
                          <tr key={iIdx} className="info-table-tr">
                            <td className="info-table-td-name">{item.name}</td>
                            <td className="info-table-td-price" style={{ color: isFree ? "green" : "var(--alert-red)" }}>
                              {item.price}
                            </td>
                            {hasOneway && (
                              <td className="info-table-td-name">
                                {item.priceOneway || "-"}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}

          {/* Giờ hoạt động */}
          <div className="glass-card info-schedule-card">
            <h3 className="info-section-header">
              <Clock size={18} style={{ color: "var(--site-gold)" }} />
              <span>{language === "km" ? "ម៉ោងដំណើរការខ្សែរថយន្តកាប៊ីនចុងក្រោយបង្អស់" : language === "en" ? "Latest Cable Car Operating Hours" : "Lịch vận hành cáp treo mới nhất"}</span>
            </h3>

            {scheduleSections.length === 0 ? (
              <p style={{ color: "var(--site-muted)", fontSize: "13px", margin: 0 }}>
                {language === "km" ? "ម៉ោងប្រតិបត្តិការកំពុងត្រូវបានធ្វើបច្ចុប្បន្នភាព។ សូមត្រលប់មកវិញឆាប់ៗនេះ។" : language === "en" ? "Operating hours are being updated. Please check back soon." : "Lịch hoạt động đang được cập nhật. Vui lòng quay lại sau."}
              </p>
            ) : (
              <ul className="info-schedule-list">
                {scheduleSections.map((section, sIdx) => (
                  <li key={sIdx}>
                    <strong>{section.title}</strong>
                    <div className="info-schedule-sublist">
                      {section.items.map((item, iIdx) => (
                        <span key={iIdx}>
                          • {item.label}{item.label && item.hours ? ": " : ""}<b>{item.hours}</b>{item.note ? ` ${item.note}` : ""}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      )}

      {/* Tab 2 Content: Travel Guides - rendered from DB */}
      {activeTab === "travel" && (
        <div className="info-tab-content">
          {ticketsLoading ? (
            [1, 2].map(i => (
              <div key={i} className="glass-card" style={{ opacity: 0.5 }}>
                <div style={{ height: "18px", width: "55%", background: "rgba(0,0,0,0.08)", borderRadius: "6px", marginBottom: "14px" }} />
                {[1,2,3].map(j => <div key={j} style={{ height: "11px", width: `${90 - j*10}%`, background: "rgba(0,0,0,0.06)", borderRadius: "4px", marginBottom: "7px" }} />)}
              </div>
            ))
          ) : travelArticles.length === 0 ? (
            <div className="glass-card empty-state-text">
              <Navigation size={36} style={{ color: "var(--site-gold)", opacity: 0.5, marginBottom: "12px" }} />
              <p style={{ margin: 0 }}>
                {language === "km" ? "ការណែនាំអំពីការធ្វើដំណើរកំពុងត្រូវបានធ្វើបច្ចុប្បន្នភាព។ សូមត្រលប់មកវិញឆាប់ៗនេះ។" : language === "en" ? "Travel guide is being updated. Please check back soon." : "Hướng dẫn di chuyển đang được cập nhật. Vui lòng quay lại sau."}
              </p>
            </div>
          ) : (
            travelArticles.map((art, aIdx) => {
              const content = (language === "km" && art.content_km) ? art.content_km : (language === "en" && art.content_en) ? art.content_en : (art.content || "");
              const items = parseArticleContent(content);
              return (
                <div className="glass-card" key={art.id || aIdx}>
                  <h3 className="info-section-header">
                    <Navigation size={18} style={{ color: "var(--site-gold)" }} />
                    <span>{language === "km" ? (art.title_km || art.title) : language === "en" ? (art.title_en || art.title) : art.title}</span>
                  </h3>

                  <div className="info-schedule-list">
                    {items.map((item, idx) => (
                      item.isHeading ? (
                        <div key={idx} className={`info-list-heading ${idx > 0 ? "has-margin" : ""}`}>
                          {item.text}
                        </div>
                      ) : (
                        <div key={idx} className={`info-list-item ${item.level > 0 ? "level-1" : ""}`}>
                          <span style={{ color: "var(--site-gold)", flexShrink: 0, marginTop: "1px" }}>{item.level > 0 ? "•" : "›"}</span>
                          <span>{item.text}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3 Content: Rules & Etiquette - rendered from DB */}
      {activeTab === "rules" && (
        <div className="info-tab-content">
          {ticketsLoading ? (
            [1, 2].map(i => (
              <div key={i} className="glass-card" style={{ opacity: 0.5 }}>
                <div style={{ height: "18px", width: "55%", background: "rgba(0,0,0,0.08)", borderRadius: "6px", marginBottom: "14px" }} />
                {[1,2,3,4].map(j => <div key={j} style={{ height: "11px", width: `${95 - j*8}%`, background: "rgba(0,0,0,0.06)", borderRadius: "4px", marginBottom: "7px" }} />)}
              </div>
            ))
          ) : rulesArticles.length === 0 ? (
            <div className="glass-card empty-state-text">
              <ShieldCheck size={36} style={{ color: "var(--site-gold)", opacity: 0.5, marginBottom: "12px" }} />
              <p style={{ margin: 0 }}>
                {language === "km" ? "ព័ត៌មានបទប្បញ្ញត្តិកំពុងត្រូវបានធ្វើបច្ចុប្បន្នភាព។ សូមត្រលប់មកវិញឆាប់ៗនេះ។" : language === "en" ? "Rules & etiquette information is being updated." : "Thông tin nội quy đang được cập nhật. Vui lòng quay lại sau."}
              </p>
            </div>
          ) : (
            rulesArticles.map((art, aIdx) => {
              const content = (language === "km" && art.content_km) ? art.content_km : (language === "en" && art.content_en) ? art.content_en : (art.content || "");
              const items = parseArticleContent(content);
              return (
                <div className="glass-card info-rules-card" key={art.id || aIdx}>
                  <h3 className="info-section-header">
                    <ShieldCheck size={18} style={{ color: "var(--site-gold)" }} />
                    <span>{language === "km" ? (art.title_km || art.title) : language === "en" ? (art.title_en || art.title) : art.title}</span>
                  </h3>

                  <div className="info-schedule-list">
                    {items.map((item, idx) => (
                      item.isHeading ? (
                        <div key={idx} className={`info-rules-heading ${idx > 0 ? "has-margin" : ""}`}>
                          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--site-gold)", display: "inline-block", flexShrink: 0 }} />
                          {item.text}
                        </div>
                      ) : (
                        <div key={idx} className={`info-rules-item ${item.level > 0 ? "level-1" : ""}`}>
                          <span style={{ color: item.level > 0 ? "var(--site-gold)" : "var(--site-navy)", flexShrink: 0, fontWeight: 600, marginTop: "1px" }}>{item.level > 0 ? "•" : "›"}</span>
                          <span>{item.text}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              );
            })
          )}


        </div>
      )}
    </Page>
  );
};

export default VisitInfoPage;
