import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Ticket, Navigation, ShieldCheck } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import api from "../services/api";

type TabType = "tickets" | "travel" | "rules";

// --- Extraction Utilities for Dynamic Premium Content ---

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

// 0. Parse Dynamic Tickets and Sections — NO HARDCODED DEFAULTS, data must come from DB
const parseTickets = (articles: any[], lang: string): TicketSection[] => {
  // No fallback: return empty array if no articles loaded yet
  if (!articles || articles.length === 0) return [];

  const priceArticle = articles.find(art => {
    const title = (art.title || "").toLowerCase();
    const content = (art.content || "").toLowerCase();
    return (
      title.includes("giá vé") || title.includes("gia ve") ||
      title.includes("ticket") || title.includes("price") ||
      content.includes("tuyến cáp") || content.includes("giá vé")
    );
  });

  if (!priceArticle || !priceArticle.content) return [];

  const content = priceArticle.content.trim();

  // Primary path: JSON format (set by Admin visual builder)
  if (content.startsWith("[") || content.startsWith("{")) {
    try {
      const parsed = JSON.parse(content);
      const ticketSections = Array.isArray(parsed) ? parsed : parsed.tickets;
      if (Array.isArray(ticketSections) && ticketSections.length > 0) {
        return ticketSections.map(section => ({
          title: (lang === "en" && section.titleEn) ? section.titleEn : (section.title || ""),
          items: (section.items || []).map((item: any) => ({
            name: (lang === "en" && item.nameEn) ? item.nameEn : (item.name || ""),
            price: (() => {
              const p = (lang === "en" && item.priceEn) ? item.priceEn : (item.price || "");
              if (lang === "en" && p.toLowerCase().includes("miễn phí")) return "Free";
              return p;
            })(),
            priceOneway: (lang === "en" && item.priceOnewayEn)
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
        trimmed.toLowerCase().includes("combo"))
    ) {
      let title = sectionMatch[1].trim();
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("vân sơn") || lowerTitle.includes("van son")) {
        title = lang === "en" ? "Van Son Cable Route (To the Peak)" : "Tuyến cáp Vân Sơn (Lên đỉnh núi)";
      } else if (lowerTitle.includes("chùa hang") || lowerTitle.includes("chua hang")) {
        title = lang === "en" ? "Chua Hang Cable Route (To Ba Temple)" : "Tuyến cáp Chùa Hang (Lên Chùa Bà)";
      } else if (lowerTitle.includes("combo")) {
        title = lang === "en" ? "Combo All Lines" : "Vé Combo Cáp Treo";
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

        const onewayRegex = /(?:một chiều|one-way)\s*[:\-]?\s*(\d{1,3}(?:\.\d{3})+|\d{5,6})/i;
        const onewayMatch = pricePart.match(onewayRegex);
        if (onewayMatch) {
          priceOneway = onewayMatch[1] + " VNĐ";
          price = pricePart.split(/một chiều/i)[0].split(/one-way/i)[0].trim();
        }

        const priceMatch = price.match(/(\d{1,3}(?:\.\d{3})+|\d{5,6})/);
        if (priceMatch) {
          price = priceMatch[0] + " VNĐ";
        } else if (/miễn phí|free|mien phi/i.test(price)) {
          price = lang === "en" ? "Free" : "Miễn phí";
        }

        if (name && price) {
          if (!currentSection) {
            currentSection = { title: lang === "en" ? "Cable Car Tickets" : "Vé cáp treo", items: [] };
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

  const article = articles.find((art: any) => {
    const content = (art.content || "").trim();
    if (!content.startsWith("{")) return false;
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed.schedules);
    } catch {
      return false;
    }
  });

  if (!article?.content) return [];

  try {
    const parsed = JSON.parse(article.content);
    if (!Array.isArray(parsed.schedules)) return [];
    return parsed.schedules
      .map((section: any) => ({
        title: (lang === "en" && section.titleEn) ? section.titleEn : (section.title || ""),
        items: (section.items || []).map((item: any) => ({
          label: (lang === "en" && item.labelEn) ? item.labelEn : (item.label || ""),
          hours: (lang === "en" && item.hoursEn) ? item.hoursEn : (item.hours || ""),
          note: (lang === "en" && item.noteEn) ? item.noteEn : (item.note || "")
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

  const [ticketArticles, setTicketArticles] = useState<any[]>([]);
  const [travelArticles, setTravelArticles] = useState<any[]>([]);
  const [rulesArticles, setRulesArticles] = useState<any[]>([]);
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
    <div>
      {/* Header */}
      <header className="app-header">
        <Link to="/" style={{ color: "var(--cream-white)" }}>
          <ArrowLeft size={22} style={{ color: "var(--accent-gold)" }} />
        </Link>
        <h1 style={{ margin: 0, fontSize: "16px" }}>{t("info.title")}</h1>
      </header>

      {/* Tabs Switcher */}
      <div className="custom-tabs">
        <button 
          className={`tab-btn ${activeTab === "tickets" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("tickets")}
        >
          {language === "en" ? "Tickets & Hours" : "Vé & Lịch hoạt động"}
        </button>
        <button 
          className={`tab-btn ${activeTab === "travel" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("travel")}
        >
          {language === "en" ? "Transport & Parking" : "Di chuyển & Bãi xe"}
        </button>
        <button 
          className={`tab-btn ${activeTab === "rules" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("rules")}
        >
          {language === "en" ? "Rules & Etiquette" : "Nội quy & Ứng xử"}
        </button>
      </div>

      {/* Tab 1 Content: Tickets & Hours */}
      {activeTab === "tickets" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
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
            <div className="glass-card" style={{ textAlign: "center", padding: "32px 16px" }}>
              <Ticket size={36} style={{ color: "var(--accent-gold)", opacity: 0.5, marginBottom: "12px" }} />
              <p style={{ color: "var(--light-text)", fontSize: "14px", margin: 0 }}>
                {language === "en" ? "Ticket information is being updated. Please check back soon." : "Thông tin vé đang được cập nhật. Vui lòng quay lại sau."}
              </p>
            </div>
          ) : (
            parsedSections.map((section, sIdx) => {
              const hasOneway = section.items.some(item => !!item.priceOneway);
              return (
                <div className="glass-card" key={sIdx}>
                  <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-navy)", fontSize: "15px", marginBottom: "12px", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "6px" }}>
                    <Ticket size={18} style={{ color: "var(--accent-gold)" }} />
                    <span>{section.title}</span>
                  </h3>
                  <table style={{ width: "100%", fontSize: "13.5px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.1)", textAlign: "left", color: "var(--light-text)" }}>
                        <th style={{ padding: "6px 0" }}>{language === "en" ? "Visitor Category" : "Đối tượng"}</th>
                        <th style={{ padding: "6px 0" }}>{hasOneway ? (language === "en" ? "Round-trip" : "Giá khứ hồi") : (language === "en" ? "Round-trip Price" : "Giá vé khứ hồi")}</th>
                        {hasOneway && (
                          <th style={{ padding: "6px 0" }}>{language === "en" ? "One-way" : "Một chiều"}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((item, iIdx) => {
                        const isFree = item.price.toLowerCase().includes("miễn phí") || item.price.toLowerCase().includes("free") || item.price.toLowerCase().includes("mien phi");
                        return (
                          <tr key={iIdx} style={iIdx > 0 ? { borderTop: "1px solid rgba(0,0,0,0.05)" } : {}}>
                            <td style={{ padding: "8px 0", fontWeight: 600 }}>{item.name}</td>
                            <td style={{ padding: "8px 0", color: isFree ? "green" : "var(--alert-red)", fontWeight: 700 }}>
                              {item.price}
                            </td>
                            {hasOneway && (
                              <td style={{ padding: "8px 0", fontWeight: 600 }}>
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
          <div className="glass-card" style={{ background: "rgba(11, 37, 69, 0.02)" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-navy)", fontSize: "15px", marginBottom: "10px" }}>
              <Clock size={18} style={{ color: "var(--accent-gold)" }} />
              <span>{language === "en" ? "Latest Cable Car Operating Hours" : "Lịch vận hành cáp treo mới nhất"}</span>
            </h3>
                        {scheduleSections.length === 0 ? (
              <p style={{ color: "var(--light-text)", fontSize: "13px", margin: 0 }}>
                {language === "en" ? "Operating hours are being updated. Please check back soon." : "Lich hoat dong dang duoc cap nhat. Vui long quay lai sau."}
              </p>
            ) : (
              <ul style={{ paddingLeft: "18px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {scheduleSections.map((section, sIdx) => (
                  <li key={sIdx}>
                    <strong>{section.title}</strong>
                    <div style={{ paddingLeft: "8px", marginTop: "2px", display: "flex", flexDirection: "column", gap: "2px" }}>
                      {section.items.map((item, iIdx) => (
                        <span key={iIdx}>
                          � {item.label}{item.label && item.hours ? ": " : ""}<b>{item.hours}</b>{item.note ? ` ${item.note}` : ""}
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

      {/* Tab 2 Content: Travel Guides — rendered from DB */}
      {activeTab === "travel" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {ticketsLoading ? (
            [1, 2].map(i => (
              <div key={i} className="glass-card" style={{ opacity: 0.5 }}>
                <div style={{ height: "18px", width: "55%", background: "rgba(0,0,0,0.08)", borderRadius: "6px", marginBottom: "14px" }} />
                {[1,2,3].map(j => <div key={j} style={{ height: "11px", width: `${90 - j*10}%`, background: "rgba(0,0,0,0.06)", borderRadius: "4px", marginBottom: "7px" }} />)}
              </div>
            ))
          ) : travelArticles.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "32px 16px" }}>
              <Navigation size={36} style={{ color: "var(--accent-gold)", opacity: 0.5, marginBottom: "12px" }} />
              <p style={{ color: "var(--light-text)", fontSize: "14px", margin: 0 }}>
                {language === "en" ? "Travel guide is being updated. Please check back soon." : "Hướng dẫn di chuyển đang được cập nhật. Vui lòng quay lại sau."}
              </p>
            </div>
          ) : (
            travelArticles.map((art, aIdx) => {
              const items = parseArticleContent(art.content || "");
              return (
                <div className="glass-card" key={art.id || aIdx}>
                  <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-navy)", fontSize: "15px", marginBottom: "12px", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "6px" }}>
                    <Navigation size={18} style={{ color: "var(--accent-gold)" }} />
                    <span>{language === "en" ? (art.title_en || art.title) : art.title}</span>
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13.5px" }}>
                    {items.map((item, idx) => (
                      item.isHeading ? (
                        <div key={idx} style={{ fontWeight: 700, color: "var(--primary-navy)", marginTop: idx > 0 ? "8px" : "0", borderLeft: "3px solid var(--accent-gold)", paddingLeft: "8px" }}>
                          {item.text}
                        </div>
                      ) : (
                        <div key={idx} style={{ display: "flex", gap: "6px", paddingLeft: item.level > 0 ? "14px" : "0", color: "var(--dark-text)" }}>
                          <span style={{ color: "var(--accent-gold)", flexShrink: 0, marginTop: "1px" }}>{item.level > 0 ? "•" : "›"}</span>
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

      {/* Tab 3 Content: Rules & Etiquette — rendered from DB */}
      {activeTab === "rules" && (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {ticketsLoading ? (
            [1, 2].map(i => (
              <div key={i} className="glass-card" style={{ opacity: 0.5 }}>
                <div style={{ height: "18px", width: "55%", background: "rgba(0,0,0,0.08)", borderRadius: "6px", marginBottom: "14px" }} />
                {[1,2,3,4].map(j => <div key={j} style={{ height: "11px", width: `${95 - j*8}%`, background: "rgba(0,0,0,0.06)", borderRadius: "4px", marginBottom: "7px" }} />)}
              </div>
            ))
          ) : rulesArticles.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "32px 16px" }}>
              <ShieldCheck size={36} style={{ color: "var(--accent-gold)", opacity: 0.5, marginBottom: "12px" }} />
              <p style={{ color: "var(--light-text)", fontSize: "14px", margin: 0 }}>
                {language === "en" ? "Rules & etiquette information is being updated." : "Thông tin nội quy đang được cập nhật. Vui lòng quay lại sau."}
              </p>
            </div>
          ) : (
            rulesArticles.map((art, aIdx) => {
              const items = parseArticleContent(art.content || "");
              return (
                <div className="glass-card" key={art.id || aIdx} style={{ borderLeft: "4px solid var(--accent-gold)" }}>
                  <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-navy)", fontSize: "15px", marginBottom: "12px", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "6px" }}>
                    <ShieldCheck size={18} style={{ color: "var(--accent-gold)" }} />
                    <span>{language === "en" ? (art.title_en || art.title) : art.title}</span>
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13.5px" }}>
                    {items.map((item, idx) => (
                      item.isHeading ? (
                        <div key={idx} style={{ fontWeight: 700, color: "var(--primary-navy)", marginTop: idx > 0 ? "10px" : "0", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--accent-gold)", display: "inline-block", flexShrink: 0 }} />
                          {item.text}
                        </div>
                      ) : (
                        <div key={idx} style={{ display: "flex", gap: "8px", paddingLeft: item.level > 0 ? "12px" : "4px", color: "var(--dark-text)", lineHeight: 1.5 }}>
                          <span style={{ color: item.level > 0 ? "var(--accent-gold)" : "var(--primary-navy)", flexShrink: 0, fontWeight: 600, marginTop: "1px" }}>{item.level > 0 ? "•" : "›"}</span>
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
    </div>
  );
};

export default VisitInfoPage;
