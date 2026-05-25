import React, { useState, useEffect } from "react";
import adminApi, { AdminKnowledgeArticle } from "../../services/adminApi";

const DEFAULT_VISUAL_TICKETS = [
  {
    title: "1. Tuyến cáp Vân Sơn (Lên đỉnh núi)",
    titleEn: "1. Van Son Cable Route (To the Peak)",
    items: [
      { name: "Vé khứ hồi người lớn", nameEn: "Adult Round-trip", price: "400.000 VNĐ", priceEn: "400,000 VND" },
      { name: "Vé khứ hồi trẻ em (1m - 1m4)", nameEn: "Child Round-trip (1m - 1m4)", price: "300.000 VNĐ", priceEn: "300,000 VND" },
      { name: "Trẻ em dưới 1m", nameEn: "Child under 1m", price: "Miễn phí", priceEn: "Free" }
    ]
  },
  {
    title: "2. Tuyến cáp Chùa Hang (Lên Chùa Bà)",
    titleEn: "2. Chua Hang Cable Route (To Ba Temple)",
    items: [
      { name: "Vé khứ hồi người lớn", nameEn: "Adult Round-trip", price: "250.000 VNĐ", priceEn: "250,000 VND", priceOneway: "150.000 VNĐ", priceOnewayEn: "150,000 VND" },
      { name: "Vé khứ hồi trẻ em (1m - 1m4)", nameEn: "Child Round-trip (1m - 1m4)", price: "150.000 VNĐ", priceEn: "150,000 VND", priceOneway: "100.000 VNĐ", priceOnewayEn: "100,000 VND" }
    ]
  },
  {
    title: "3. Combo Vé Đỉnh + Vé Chùa (Tất cả các tuyến)",
    titleEn: "3. Peak + Temple Combo Ticket (All Lines)",
    items: [
      { name: "Người lớn", nameEn: "Adult", price: "600.000 VNĐ", priceEn: "600,000 VND" },
      { name: "Trẻ em (1m - 1m4)", nameEn: "Child (1m - 1m4)", price: "400.000 VNĐ", priceEn: "400,000 VND" }
    ]
  },
  {
    title: "4. Combo Vé Đỉnh + Vé Chùa + Buffet (Tất cả các tuyến)",
    titleEn: "4. Peak + Temple + Buffet Combo Ticket (All Lines)",
    items: [
      { name: "Người lớn", nameEn: "Adult", price: "800.000 VNĐ", priceEn: "800,000 VND" },
      { name: "Trẻ em (1m - 1m4)", nameEn: "Child (1m - 1m4)", price: "600.000 VNĐ", priceEn: "600,000 VND" }
    ]
  }
];

const DEFAULT_VISUAL_SCHEDULES = [
  {
    title: "Tuyến đỉnh Vân Sơn",
    titleEn: "Van Son Peak Route",
    items: [
      { label: "Thứ 2 - Thứ 6", labelEn: "Monday - Friday", hours: "07:00 - 18:00", hoursEn: "07:00 - 18:00", note: "", noteEn: "" },
      { label: "Thứ 7 - Chủ Nhật", labelEn: "Saturday - Sunday", hours: "06:00 - 21:00", hoursEn: "06:00 - 21:00", note: "(ngắm đèn LED đỉnh núi ban đêm)", noteEn: "(night LED light show)" }
    ]
  },
  {
    title: "Tuyến Chùa Hang",
    titleEn: "Chua Hang Route",
    items: [
      { label: "Thứ 2 - Thứ 6", labelEn: "Monday - Friday", hours: "06:00 - 18:00", hoursEn: "06:00 - 18:00", note: "", noteEn: "" },
      { label: "Thứ 7 - Chủ Nhật", labelEn: "Saturday - Sunday", hours: "05:30 - 22:00", hoursEn: "05:30 - 22:00", note: "", noteEn: "" }
    ]
  },
  {
    title: "Khu vực đền Chùa Bà",
    titleEn: "Ba Temple Area",
    items: [
      { label: "Hằng ngày", labelEn: "Daily", hours: "06:00 - 22:00", hoursEn: "06:00 - 22:00", note: "", noteEn: "" }
    ]
  }
];

interface ArticleModalProps {
  onClose: () => void;
  onSave: (data: { title: string; category: string; content: string; is_published: boolean }) => void;
  selectedItem: AdminKnowledgeArticle | null;
  modalType: "add" | "edit" | null;
  defaultCategory?: string;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  onClose,
  onSave,
  selectedItem,
  modalType,
  defaultCategory,
}) => {
  const [artTitle, setArtTitle] = useState("");
  const [artCategory, setArtCategory] = useState("lich_su");
  const [artContent, setArtContent] = useState("");
  const [artPublished, setArtPublished] = useState(true);

  const [visualTickets, setVisualTickets] = useState<any[]>(DEFAULT_VISUAL_TICKETS);
  const [visualSchedules, setVisualSchedules] = useState<any[]>(DEFAULT_VISUAL_SCHEDULES);
  const [translatingTicketField, setTranslatingTicketField] = useState<string | null>(null);

  // Initialize form fields
  useEffect(() => {
    if (selectedItem) {
      setArtTitle(selectedItem.title || "");
      setArtCategory(selectedItem.category || defaultCategory || "lich_su");
      setArtContent(selectedItem.content || "");
      setArtPublished(selectedItem.is_published !== undefined ? selectedItem.is_published : true);
      
      if (selectedItem.category === "ve_va_gio_mo_cua") {
        try {
          const c = selectedItem.content?.trim();
          if (c && (c.startsWith("[") || c.startsWith("{"))) {
            const parsed = JSON.parse(c);
            const parsedTickets = Array.isArray(parsed) ? parsed : parsed.tickets;
            const parsedSchedules = Array.isArray(parsed) ? DEFAULT_VISUAL_SCHEDULES : parsed.schedules;
            if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
              setVisualTickets(parsedTickets);
              setVisualSchedules(Array.isArray(parsedSchedules) ? parsedSchedules : JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
            } else {
              setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
              setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
            }
          } else {
            setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
            setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
          }
        } catch {
          setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
          setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
        }
      }
    } else {
      const cat = defaultCategory || "lich_su";
      setArtTitle("");
      setArtCategory(cat);
      setArtContent("");
      setArtPublished(true);
      
      if (cat === "ve_va_gio_mo_cua") {
        setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
        setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
        setArtContent(JSON.stringify({
          tickets: DEFAULT_VISUAL_TICKETS,
          schedules: DEFAULT_VISUAL_SCHEDULES
        }, null, 2));
      }
    }
  }, [modalType, selectedItem, defaultCategory]);

  const syncTicketsToContent = (tickets: any[], schedules = visualSchedules) => {
    setArtContent(JSON.stringify({ tickets, schedules }, null, 2));
  };

  const updateVisualTickets = (updated: any[]) => {
    setVisualTickets(updated);
    syncTicketsToContent(updated);
  };

  const updateVisualSchedules = (updated: any[]) => {
    setVisualSchedules(updated);
    syncTicketsToContent(visualTickets, updated);
  };

  const handleTranslateTicketField = async (sIdx: number, field: "titleEn" | "nameEn" | "priceEn" | "priceOnewayEn", iIdx?: number) => {
    const key = `${sIdx}-${field}-${iIdx ?? ""}`;
    setTranslatingTicketField(key);
    try {
      let sourceText = "";
      if (field === "titleEn") sourceText = visualTickets[sIdx]?.title || "";
      else if (field === "nameEn") sourceText = visualTickets[sIdx]?.items[iIdx!]?.name || "";
      else if (field === "priceEn") sourceText = visualTickets[sIdx]?.items[iIdx!]?.price || "";
      else if (field === "priceOnewayEn") sourceText = visualTickets[sIdx]?.items[iIdx!]?.priceOneway || "";
      
      if (!sourceText) return;
      const res = await adminApi.translateText(sourceText, "en");
      const updated = JSON.parse(JSON.stringify(visualTickets));
      if (field === "titleEn") updated[sIdx].titleEn = res.translated_text;
      else if (iIdx !== undefined) updated[sIdx].items[iIdx][field] = res.translated_text;
      updateVisualTickets(updated);
    } catch (e: any) {
      alert(e?.message || "Lỗi khi dịch tự động.");
    } finally {
      setTranslatingTicketField(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: artTitle,
      category: artCategory,
      content: artContent,
      is_published: artPublished
    });
  };

  return (
    <div className="modal-content" style={{ maxWidth: artCategory === "ve_va_gio_mo_cua" ? "860px" : "560px", width: "95vw" }}>
      <header className="modal-header">
        <h3>
          {artCategory === "ve_va_gio_mo_cua"
            ? (modalType === "add" ? "🎫 Thêm bảng giá vé mới" : "🎫 Chỉnh sửa bảng giá vé")
            : (modalType === "add" ? "📝 Thêm bài viết tri thức RAG" : "📝 Chỉnh sửa bài viết tri thức RAG")}
        </h3>
        <button type="button" className="btn btn-secondary btn-xs" onClick={onClose}>✕</button>
      </header>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Tiêu đề bài viết</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={artTitle} 
              onChange={e => setArtTitle(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phân mục tri thức</label>
            <select 
              className="form-select" 
              value={artCategory} 
              onChange={e => {
                const cat = e.target.value;
                setArtCategory(cat);
                if (cat === "ve_va_gio_mo_cua") {
                  setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
                  setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
                  syncTicketsToContent(DEFAULT_VISUAL_TICKETS, DEFAULT_VISUAL_SCHEDULES);
                }
              }}
            >
              <option value="ve_va_gio_mo_cua">🎫 Giá vé & Lịch hoạt động (Visual Builder)</option>
              <option value="di_chuyen">📍 Di chuyển & Đỗ xe (RAG Context)</option>
              <option value="noi_quy">🛡️ Nội quy chiêm bái & Trang phục (RAG Context)</option>
              <option value="lich_su">📖 Sự tích & Lịch sử (RAG Context)</option>
            </select>
          </div>

          {/* ===== VISUAL TICKET BUILDER (only for ve_va_gio_mo_cua) ===== */}
          {artCategory === "ve_va_gio_mo_cua" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "rgba(11,37,69,0.06)", borderRadius: "8px", padding: "12px 16px", border: "1px solid rgba(11,37,69,0.12)", fontSize: "12.5px", color: "var(--primary-navy)", fontWeight: 600 }}>
                ✏️ <strong>Trình soạn thảo bảng giá trực quan</strong> — Thay đổi sẽ tự động đồng bộ sang Zalo Mini App ngay lập tức sau khi lưu.
              </div>

              {visualTickets.map((section, sIdx) => (
                <div key={sIdx} style={{ border: "1.5px solid var(--border-slate)", borderRadius: "10px", overflow: "hidden" }}>
                  {/* Section header */}
                  <div style={{ background: "var(--primary-navy)", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--accent-gold)", fontWeight: 700, fontSize: "13px" }}>Tuyến / Loại vé #{sIdx + 1}</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {sIdx > 0 && (
                        <button type="button" style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "12px" }}
                          onClick={() => {
                            const u = JSON.parse(JSON.stringify(visualTickets));
                            [u[sIdx - 1], u[sIdx]] = [u[sIdx], u[sIdx - 1]];
                            updateVisualTickets(u);
                          }}>↑</button>
                      )}
                      {sIdx < visualTickets.length - 1 && (
                        <button type="button" style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "12px" }}
                          onClick={() => {
                            const u = JSON.parse(JSON.stringify(visualTickets));
                            [u[sIdx], u[sIdx + 1]] = [u[sIdx + 1], u[sIdx]];
                            updateVisualTickets(u);
                          }}>↓</button>
                      )}
                      <button type="button" style={{ background: "rgba(220,38,38,0.7)", border: "none", color: "white", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "12px" }}
                        onClick={() => {
                          if (visualTickets.length <= 1) return;
                          const u = visualTickets.filter((_, i) => i !== sIdx);
                          updateVisualTickets(u);
                        }}>Xóa tuyến</button>
                    </div>
                  </div>

                  <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Section title VI */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến (Tiếng Việt)</label>
                        <input type="text" className="form-input" value={section.title || ""}
                          onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].title = e.target.value; updateVisualTickets(u); }} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến (English)</label>
                          <button type="button" className="btn btn-secondary btn-xs" style={{ padding: "1px 6px", fontSize: "10px" }}
                            disabled={translatingTicketField === `${sIdx}-titleEn-`}
                            onClick={() => handleTranslateTicketField(sIdx, "titleEn")}>
                            {translatingTicketField === `${sIdx}-titleEn-` ? "..." : "AI Dịch"}
                          </button>
                        </div>
                        <input type="text" className="form-input" value={section.titleEn || ""}
                          onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].titleEn = e.target.value; updateVisualTickets(u); }} />
                      </div>
                    </div>

                    {/* Items table */}
                    <div style={{ background: "#f8fafc", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-slate)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ background: "rgba(11,37,69,0.05)", borderBottom: "1px solid var(--border-slate)" }}>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Đối tượng (VI)</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Đối tượng (EN)</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Giá KH (VI)</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Price (EN)</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Giá MC</th>
                            <th style={{ padding: "6px 4px", width: "36px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.items.map((item: any, iIdx: number) => (
                            <tr key={iIdx} style={{ borderTop: iIdx > 0 ? "1px solid var(--border-slate)" : "none" }}>
                              <td style={{ padding: "6px 8px" }}>
                                <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }}
                                  value={item.name || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].name = e.target.value; updateVisualTickets(u); }} />
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                                  <input type="text" style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }}
                                    value={item.nameEn || ""}
                                    onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].nameEn = e.target.value; updateVisualTickets(u); }} />
                                  <button type="button" style={{ background: "var(--primary-navy)", color: "white", border: "none", borderRadius: "3px", padding: "2px 5px", cursor: "pointer", fontSize: "9.5px", whiteSpace: "nowrap" }}
                                    disabled={translatingTicketField === `${sIdx}-nameEn-${iIdx}`}
                                    onClick={() => handleTranslateTicketField(sIdx, "nameEn", iIdx)}>
                                    {translatingTicketField === `${sIdx}-nameEn-${iIdx}` ? "..." : "Dịch"}
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }}
                                  value={item.price || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].price = e.target.value; updateVisualTickets(u); }} />
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                                  <input type="text" style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }}
                                    value={item.priceEn || ""}
                                    onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].priceEn = e.target.value; updateVisualTickets(u); }} />
                                  <button type="button" style={{ background: "var(--primary-navy)", color: "white", border: "none", borderRadius: "3px", padding: "2px 5px", cursor: "pointer", fontSize: "9.5px", whiteSpace: "nowrap" }}
                                    disabled={translatingTicketField === `${sIdx}-priceEn-${iIdx}`}
                                    onClick={() => handleTranslateTicketField(sIdx, "priceEn", iIdx)}>
                                    {translatingTicketField === `${sIdx}-priceEn-${iIdx}` ? "..." : "Dịch"}
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <input type="text" placeholder="(tùy chọn)" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }}
                                  value={item.priceOneway || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].priceOneway = e.target.value; updateVisualTickets(u); }} />
                              </td>
                              <td style={{ padding: "4px" }}>
                                <button type="button" style={{ background: "rgba(220,38,38,0.7)", border: "none", color: "white", borderRadius: "3px", padding: "2px 6px", cursor: "pointer", fontSize: "11px" }}
                                  onClick={() => {
                                    const u = JSON.parse(JSON.stringify(visualTickets));
                                    u[sIdx].items = u[sIdx].items.filter((_: any, i: number) => i !== iIdx);
                                    updateVisualTickets(u);
                                  }}>✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button type="button" className="btn btn-secondary btn-xs" style={{ alignSelf: "flex-start" }}
                      onClick={() => {
                        const u = JSON.parse(JSON.stringify(visualTickets));
                        u[sIdx].items.push({ name: "", nameEn: "", price: "", priceEn: "", priceOneway: "" });
                        updateVisualTickets(u);
                      }}>
                      + Thêm loại vé vào tuyến này
                    </button>
                  </div>
                </div>
              ))}

              <button type="button" className="btn btn-secondary" style={{ alignSelf: "flex-start" }}
                onClick={() => {
                  const u = JSON.parse(JSON.stringify(visualTickets));
                  u.push({ title: "", titleEn: "", items: [{ name: "", nameEn: "", price: "", priceEn: "", priceOneway: "" }] });
                  updateVisualTickets(u);
                }}>
                + Thêm tuyến / loại vé mới
              </button>

              <div style={{ background: "rgba(11,37,69,0.06)", borderRadius: "8px", padding: "12px 16px", border: "1px solid rgba(11,37,69,0.12)", fontSize: "12.5px", color: "var(--primary-navy)", fontWeight: 600 }}>
                <strong>Lịch hoạt động hiển thị trên Mini App</strong> - cập nhật tại đây, không cần sửa code frontend.
              </div>

              {visualSchedules.map((section, sIdx) => (
                <div key={sIdx} style={{ border: "1.5px solid var(--border-slate)", borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ background: "var(--primary-navy)", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--accent-gold)", fontWeight: 700, fontSize: "13px" }}>Lịch hoạt động #{sIdx + 1}</span>
                    <button type="button" style={{ background: "rgba(220,38,38,0.7)", border: "none", color: "white", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "12px" }}
                      onClick={() => {
                        if (visualSchedules.length <= 1) return;
                        updateVisualSchedules(visualSchedules.filter((_, i) => i !== sIdx));
                      }}>Xóa mục</button>
                  </div>
                  <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến/khu vực (VI)</label>
                        <input type="text" className="form-input" value={section.title || ""}
                          onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].title = e.target.value; updateVisualSchedules(u); }} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến/khu vực (EN)</label>
                        <input type="text" className="form-input" value={section.titleEn || ""}
                          onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].titleEn = e.target.value; updateVisualSchedules(u); }} />
                      </div>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-slate)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ background: "rgba(11,37,69,0.05)", borderBottom: "1px solid var(--border-slate)" }}>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Ngày/khung (VI)</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Ngày/khung (EN)</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Giờ</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Ghi chú (VI)</th>
                            <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Note (EN)</th>
                            <th style={{ padding: "6px 4px", width: "36px" }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(section.items || []).map((item: any, iIdx: number) => (
                            <tr key={iIdx} style={{ borderTop: iIdx > 0 ? "1px solid var(--border-slate)" : "none" }}>
                              <td style={{ padding: "6px 8px" }}>
                                <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }} value={item.label || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].label = e.target.value; updateVisualSchedules(u); }} />
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }} value={item.labelEn || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].labelEn = e.target.value; updateVisualSchedules(u); }} />
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <input type="text" placeholder="07:00 - 18:00" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }} value={item.hours || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].hours = e.target.value; u[sIdx].items[iIdx].hoursEn = e.target.value; updateVisualSchedules(u); }} />
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }} value={item.note || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].note = e.target.value; updateVisualSchedules(u); }} />
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }} value={item.noteEn || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].noteEn = e.target.value; updateVisualSchedules(u); }} />
                              </td>
                              <td style={{ padding: "4px" }}>
                                <button type="button" style={{ background: "rgba(220,38,38,0.7)", border: "none", color: "white", borderRadius: "3px", padding: "2px 6px", cursor: "pointer", fontSize: "11px" }}
                                  onClick={() => {
                                    const u = JSON.parse(JSON.stringify(visualSchedules));
                                    u[sIdx].items = u[sIdx].items.filter((_: any, i: number) => i !== iIdx);
                                    updateVisualSchedules(u);
                                  }}>X</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" className="btn btn-secondary btn-xs" style={{ alignSelf: "flex-start" }}
                      onClick={() => {
                        const u = JSON.parse(JSON.stringify(visualSchedules));
                        u[sIdx].items.push({ label: "", labelEn: "", hours: "", hoursEn: "", note: "", noteEn: "" });
                        updateVisualSchedules(u);
                      }}>
                      + Thêm khung giờ
                    </button>
                  </div>
                </div>
              ))}

              <button type="button" className="btn btn-secondary" style={{ alignSelf: "flex-start" }}
                onClick={() => {
                  const u = JSON.parse(JSON.stringify(visualSchedules));
                  u.push({ title: "", titleEn: "", items: [{ label: "", labelEn: "", hours: "", hoursEn: "", note: "", noteEn: "" }] });
                  updateVisualSchedules(u);
                }}>
                + Thêm tuyến/khu vực lịch hoạt động
              </button>
              {/* Collapsible raw JSON for advanced use */}
              <details style={{ marginTop: "4px" }}>
                <summary style={{ cursor: "pointer", fontSize: "12px", color: "var(--text-light)", fontWeight: 600 }}>⚙️ Xem/Sửa JSON nâng cao (tự động đồng bộ)</summary>
                <textarea
                  className="form-textarea"
                  rows={8}
                  style={{ marginTop: "8px", fontSize: "11.5px", fontFamily: "monospace" }}
                  value={artContent}
                  onChange={e => {
                    setArtContent(e.target.value);
                    try {
                      const parsed = JSON.parse(e.target.value);
                      if (Array.isArray(parsed)) {
                        setVisualTickets(parsed);
                      } else {
                        if (Array.isArray(parsed.tickets)) setVisualTickets(parsed.tickets);
                        if (Array.isArray(parsed.schedules)) setVisualSchedules(parsed.schedules);
                      }
                    } catch { /* ignore */ }
                  }}
                />
              </details>
            </div>
          ) : (
            /* ===== PLAIN TEXT TEXTAREA for RAG articles ===== */
            <div className="form-group">
              <label className="form-label">Nội dung chi tiết văn bản (RAG Context — AI sẽ đọc và tra cứu)</label>
              <textarea 
                className="form-textarea" 
                required 
                rows={8}
                value={artContent} 
                onChange={e => setArtContent(e.target.value)}
                placeholder="Nhập nội dung văn bản, markdown được hỗ trợ. AI sẽ sử dụng đoạn này để trả lời câu hỏi của du khách..."
              />
            </div>
          )}

          <div className="form-group" style={{ flexDirection: "row", gap: "8px", alignItems: "center" }}>
            <input 
              type="checkbox" 
              id="art_pub" 
              checked={artPublished} 
              onChange={e => setArtPublished(e.target.checked)} 
            />
            <label htmlFor="art_pub" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
              Đăng tải lên hệ thống tra cứu công khai
            </label>
          </div>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary">
            {modalType === "add" ? "Tạo & Lập chỉ mục Vector" : "Lưu thay đổi"}
          </button>
        </footer>
      </form>
    </div>
  );
};
