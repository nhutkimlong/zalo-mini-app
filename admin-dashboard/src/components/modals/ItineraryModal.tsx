import React, { useState, useEffect } from "react";
import adminApi, { AdminPlace, AdminItinerary, AdminItineraryStep } from "../../services/adminApi";

interface ItineraryModalProps {
  onClose: () => void;
  onSave: (data: {
    name: string;
    name_en?: string;
    duration: string;
    duration_en?: string;
    color: string;
    place_slugs: string[];
    steps: AdminItineraryStep[];
    status?: string;
  }) => void;
  selectedItem: AdminItinerary | null;
  modalType: "add" | "edit" | null;
  places: AdminPlace[];
}

export const ItineraryModal: React.FC<ItineraryModalProps> = ({
  onClose,
  onSave,
  selectedItem,
  modalType,
  places,
}) => {
  const [itName, setItName] = useState("");
  const [itNameEn, setItNameEn] = useState("");
  const [itDuration, setItDuration] = useState("");
  const [itDurationEn, setItDurationEn] = useState("");
  const [itColor, setItColor] = useState("#ffc107");
  const [itPlaceSlugs, setItPlaceSlugs] = useState<string[]>([]);
  const [itSteps, setItSteps] = useState<AdminItineraryStep[]>([]);
  const [itStatus, setItStatus] = useState("published");

  const [translatingField, setTranslatingField] = useState<string | null>(null);

  useEffect(() => {
    if (modalType === "edit" && selectedItem) {
      setItName(selectedItem.name || "");
      setItNameEn(selectedItem.name_en || "");
      setItDuration(selectedItem.duration || "");
      setItDurationEn(selectedItem.duration_en || "");
      setItColor(selectedItem.color || "#ffc107");
      setItPlaceSlugs(selectedItem.place_slugs || []);
      setItSteps(selectedItem.steps || []);
      setItStatus(selectedItem.status || "published");
    } else {
      setItName("");
      setItNameEn("");
      setItDuration("");
      setItDurationEn("");
      setItColor("#ffc107");
      setItPlaceSlugs([]);
      setItSteps([]);
      setItStatus("published");
    }
  }, [modalType, selectedItem]);

  const handleTranslate = async (sourceText: string, fieldToSet: "itNameEn") => {
    if (!sourceText) {
      alert("Vui lòng nhập nội dung tiếng Việt trước khi dịch!");
      return;
    }
    setTranslatingField(fieldToSet);
    try {
      const res = await adminApi.translateText(sourceText, "en");
      if (fieldToSet === "itNameEn") setItNameEn(res.translated_text);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Lỗi khi dịch tự động.");
    } finally {
      setTranslatingField(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: itName,
      name_en: itNameEn,
      duration: itDuration,
      duration_en: itDurationEn,
      color: itColor,
      place_slugs: itPlaceSlugs,
      steps: itSteps,
      status: itStatus
    });
  };

  return (
    <div className="modal-content" style={{ maxWidth: "600px" }}>
      <header className="modal-header">
        <h3>{modalType === "add" ? "Tạo lộ trình AI mới" : "Chỉnh sửa lộ trình AI"}</h3>
        <button type="button" className="btn btn-secondary btn-xs" onClick={onClose}>✕</button>
      </header>
      <form onSubmit={handleSubmit}>
        <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <div className="form-group">
            <label className="form-label">Tên lộ trình (VI)</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={itName} 
              onChange={e => setItName(e.target.value)} 
              placeholder="Ví dụ: Lộ trình Hành hương Tâm linh"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Tên lộ trình (EN)</span>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs" 
                style={{ padding: "2px 8px", fontSize: "10px" }}
                disabled={translatingField === "itNameEn"}
                onClick={() => handleTranslate(itName, "itNameEn")}
              >
                {translatingField === "itNameEn" ? "Đang dịch..." : "Dịch tự động"}
              </button>
            </label>
            <input 
              type="text" 
              className="form-input" 
              value={itNameEn} 
              onChange={e => setItNameEn(e.target.value)} 
              placeholder="Ví dụ: Sacred Pilgrimage Route"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Thời lượng (VI)</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={itDuration} 
                onChange={e => setItDuration(e.target.value)} 
                placeholder="Ví dụ: 4 giờ hoặc 1 ngày"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Thời lượng (EN)</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={itDurationEn} 
                onChange={e => setItDurationEn(e.target.value)} 
                placeholder="Ví dụ: 4 hours or 1 day"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Màu hiển thị trên bản đồ (Color Picker)</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input 
                type="color" 
                value={itColor} 
                onChange={e => setItColor(e.target.value)} 
                style={{ width: "40px", height: "36px", border: "1px solid #ccc", padding: 0, cursor: "pointer", borderRadius: "4px" }}
              />
              <input 
                type="text" 
                className="form-input" 
                value={itColor} 
                onChange={e => setItColor(e.target.value)} 
                placeholder="#ffc107"
                style={{ flex: 1, fontFamily: "monospace" }}
              />
            </div>
          </div>

          {/* Checklist of Places to form slugs path */}
          <div className="form-group" style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <label className="form-label" style={{ fontWeight: 700, color: "var(--primary-navy)" }}>Chọn các điểm trong tuyến đi (Theo thứ tự):</label>
            <p style={{ fontSize: "11px", color: "var(--text-light)", margin: "0 0 10px 0" }}>Chọn các địa danh từ danh sách để đưa vào lộ trình di chuyển:</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto", padding: "4px" }}>
              {places.map((place) => {
                const isChecked = itPlaceSlugs.includes(place.slug);
                return (
                  <label key={place.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={isChecked} 
                      onChange={() => {
                        if (isChecked) {
                          setItPlaceSlugs(itPlaceSlugs.filter(s => s !== place.slug));
                        } else {
                          setItPlaceSlugs([...itPlaceSlugs, place.slug]);
                        }
                      }}
                    />
                    <span>{place.name}</span>
                  </label>
                );
              })}
            </div>

            {itPlaceSlugs.length > 0 && (
              <div style={{ marginTop: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}>
                <label className="form-label" style={{ fontSize: "11.5px", fontWeight: 700 }}>Thứ tự di chuyển hiện tại (Bấm để sắp xếp):</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                  {itPlaceSlugs.map((slug, idx) => {
                    const matched = places.find(p => p.slug === slug);
                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#ffffff", padding: "4px 8px", borderRadius: "4px", border: "1px solid #e2e8f0", fontSize: "12px" }}>
                        <span style={{ fontWeight: 600 }}>{idx + 1}. {matched ? matched.name : slug}</span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-xs" 
                            disabled={idx === 0}
                            onClick={() => {
                              const slugs = [...itPlaceSlugs];
                              const temp = slugs[idx];
                              slugs[idx] = slugs[idx - 1];
                              slugs[idx - 1] = temp;
                              setItPlaceSlugs(slugs);
                            }}
                            style={{ padding: "1px 4px", fontSize: "10px" }}
                          >
                            ▲
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-xs" 
                            disabled={idx === itPlaceSlugs.length - 1}
                            onClick={() => {
                              const slugs = [...itPlaceSlugs];
                              const temp = slugs[idx];
                              slugs[idx] = slugs[idx + 1];
                              slugs[idx + 1] = temp;
                              setItPlaceSlugs(slugs);
                            }}
                            style={{ padding: "1px 4px", fontSize: "10px" }}
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Steps Builder */}
          <div className="form-group" style={{ marginTop: "14px" }}>
            <label className="form-label" style={{ fontWeight: 700, color: "var(--primary-navy)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Các bước hướng dẫn chiêm bái (Chặng đi):</span>
              <button 
                type="button" 
                className="btn btn-primary btn-xs" 
                onClick={() => setItSteps([...itSteps, { vi: "", en: "" }])}
              >
                + Thêm chặng đi
              </button>
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
              {itSteps.map((step, idx) => (
                <div key={idx} style={{ backgroundColor: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0", position: "relative" }}>
                  <button 
                    type="button" 
                    className="btn btn-danger btn-xs" 
                    style={{ position: "absolute", top: "8px", right: "8px", padding: "2px 6px", fontSize: "10px" }}
                    onClick={() => setItSteps(itSteps.filter((_, i) => i !== idx))}
                  >
                    Xóa
                  </button>
                  
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-gold)", display: "block", marginBottom: "6px" }}>
                    Chặng {idx + 1}
                  </span>

                  <div className="form-group" style={{ marginBottom: "6px" }}>
                    <label style={{ fontSize: "11px", display: "block", marginBottom: "2px", fontWeight: 600 }}>Hướng dẫn tiếng Việt</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={step.vi} 
                      onChange={e => {
                        const newSteps = [...itSteps];
                        newSteps[idx].vi = e.target.value;
                        setItSteps(newSteps);
                      }}
                      placeholder="Ví dụ: Bắt đầu hành trình tại chân núi..."
                      style={{ padding: "4px 8px", fontSize: "12px" }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: "11px", display: "flex", justifyContent: "space-between", marginBottom: "2px", fontWeight: 600 }}>
                      <span>Hướng dẫn tiếng Anh (EN)</span>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-xs" 
                        style={{ padding: "0px 6px", fontSize: "9px" }}
                        onClick={async () => {
                          if (!step.vi) return;
                          try {
                            const res = await adminApi.translateText(step.vi, "en");
                            const newSteps = [...itSteps];
                            newSteps[idx].en = res.translated_text;
                            setItSteps(newSteps);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      >
                        Dịch tự động
                      </button>
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={step.en} 
                      onChange={e => {
                        const newSteps = [...itSteps];
                        newSteps[idx].en = e.target.value;
                        setItSteps(newSteps);
                      }}
                      placeholder="Ví dụ: Start your journey at the mountain base..."
                      style={{ padding: "4px 8px", fontSize: "12px" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary">Lưu lộ trình di chuyển</button>
        </footer>
      </form>
    </div>
  );
};
