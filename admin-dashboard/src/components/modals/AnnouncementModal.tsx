import React, { useState, useEffect } from "react";
import adminApi, { AdminAnnouncement } from "../../services/adminApi";

interface AnnouncementModalProps {
  onClose: () => void;
  onSave: (data: {
    title: string;
    title_en?: string;
    title_km?: string;
    content: string;
    content_en?: string;
    content_km?: string;
    type: "general" | "emergency" | "weather" | "festival";
  }) => void;
  selectedItem: AdminAnnouncement | null;
  modalType: "add" | "edit" | null;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  onClose,
  onSave,
  selectedItem,
  modalType,
}) => {
  const [annTitle, setAnnTitle] = useState("");
  const [annTitleEn, setAnnTitleEn] = useState("");
  const [annTitleKm, setAnnTitleKm] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annContentEn, setAnnContentEn] = useState("");
  const [annContentKm, setAnnContentKm] = useState("");
  const [annType, setAnnType] = useState<"general" | "emergency" | "weather" | "festival">("general");

  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const [translatingAll, setTranslatingAll] = useState(false);

  useEffect(() => {
    if (modalType === "edit" && selectedItem) {
      setAnnTitle(selectedItem.title || "");
      setAnnTitleEn(selectedItem.title_en || "");
      setAnnTitleKm(selectedItem.title_km || "");
      setAnnContent(selectedItem.content || "");
      setAnnContentEn(selectedItem.content_en || "");
      setAnnContentKm(selectedItem.content_km || "");
      setAnnType(selectedItem.type || "general");
    } else {
      setAnnTitle("");
      setAnnTitleEn("");
      setAnnTitleKm("");
      setAnnContent("");
      setAnnContentEn("");
      setAnnContentKm("");
      setAnnType("general");
    }
  }, [modalType, selectedItem]);

  const handleTranslate = async (
    sourceText: string,
    fieldToSet: "annTitleEn" | "annContentEn" | "annTitleKm" | "annContentKm"
  ) => {
    if (!sourceText) {
      alert("Vui lòng nhập nội dung tiếng Việt trước khi dịch!");
      return;
    }
    setTranslatingField(fieldToSet);
    try {
      const targetLang = fieldToSet.endsWith("Km") ? "km" : "en";
      const res = await adminApi.translateText(sourceText, targetLang);
      if (fieldToSet === "annTitleEn") setAnnTitleEn(res.translated_text);
      else if (fieldToSet === "annContentEn") setAnnContentEn(res.translated_text);
      else if (fieldToSet === "annTitleKm") setAnnTitleKm(res.translated_text);
      else if (fieldToSet === "annContentKm") setAnnContentKm(res.translated_text);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Lỗi khi dịch tự động.");
    } finally {
      setTranslatingField(null);
    }
  };

  const handleTranslateAll = async () => {
    if (!annTitle && !annContent) {
      alert("Vui lòng nhập thông tin tiếng Việt trước khi dịch!");
      return;
    }

    const needsTranslation = !annTitleEn || !annTitleKm || !annContentEn || !annContentKm;

    if (!needsTranslation) {
      alert("Tất cả các trường đã được dịch đầy đủ, không cần dịch thêm!");
      return;
    }

    const payload = {
      title: annTitle,
      titleEn: annTitleEn,
      titleKm: annTitleKm,
      content: annContent,
      contentEn: annContentEn,
      contentKm: annContentKm
    };

    setTranslatingAll(true);
    try {
      const res = await adminApi.translateText(JSON.stringify(payload), "both");
      const resObj = JSON.parse(res.translated_text);
      
      if (resObj.titleEn) setAnnTitleEn(resObj.titleEn);
      if (resObj.titleKm) setAnnTitleKm(resObj.titleKm);
      if (resObj.contentEn) setAnnContentEn(resObj.contentEn);
      if (resObj.contentKm) setAnnContentKm(resObj.contentKm);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Lỗi khi dịch tự động toàn bộ bằng AI.");
    } finally {
      setTranslatingAll(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: annTitle,
      title_en: annTitleEn,
      title_km: annTitleKm,
      content: annContent,
      content_en: annContentEn,
      content_km: annContentKm,
      type: annType
    });
  };

  return (
    <div className="modal-content">
      <header className="modal-header">
        <h3>{modalType === "add" ? "Tạo bản tin mới" : "Chỉnh sửa bản tin"}</h3>
        <button type="button" className="btn btn-secondary btn-xs" onClick={onClose}>✕</button>
      </header>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {/* Centralized AI Translation Banner */}
          <div style={{
            background: "linear-gradient(135deg, rgba(11,37,69,0.05) 0%, rgba(212,163,89,0.1) 100%)",
            border: "1px solid rgba(212,163,89,0.3)",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            gap: "12px"
          }}>
            <div>
              <h4 style={{ margin: 0, color: "var(--primary-navy)", fontSize: "13px", fontWeight: 700 }}>✨ Trợ lý Dịch thuật AI Đa ngôn ngữ (EN & KM)</h4>
              <p style={{ margin: "2px 0 0 0", color: "#475569", fontSize: "11px", lineHeight: "1.4" }}>
                Nhấn dịch để tự động chuyển ngữ các phần trống sang Tiếng Anh & Khmer. Thông tin đã nhập tay sẽ được giữ nguyên.
              </p>
            </div>
            <button
              type="button"
              className="btn"
              style={{
                background: "linear-gradient(135deg, var(--primary-navy) 0%, #1e293b 100%)",
                border: "1px solid var(--accent-gold)",
                color: "var(--accent-gold)",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
              disabled={translatingAll}
              onClick={handleTranslateAll}
            >
              {translatingAll ? "⏳ Đang dịch AI..." : "🚀 Dịch AI (EN & KM)"}
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Tiêu đề thông báo (VI)</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={annTitle} 
              onChange={e => setAnnTitle(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Tiêu đề thông báo (EN)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs" 
                style={{ padding: "2px 8px", marginBottom: "4px" }}
                disabled={translatingField === "annTitleEn"}
                onClick={() => handleTranslate(annTitle, "annTitleEn")}
              >
                {translatingField === "annTitleEn" ? "Đang dịch..." : "Dịch tự động AI"}
              </button>
            </div>
            <input 
              type="text" 
              className="form-input" 
              value={annTitleEn} 
              onChange={e => setAnnTitleEn(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Tiêu đề thông báo (KM)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs" 
                style={{ padding: "2px 8px", marginBottom: "4px" }}
                disabled={translatingField === "annTitleKm"}
                onClick={() => handleTranslate(annTitle, "annTitleKm")}
              >
                {translatingField === "annTitleKm" ? "Đang dịch..." : "Dịch tự động AI"}
              </button>
            </div>
            <input 
              type="text" 
              className="form-input" 
              value={annTitleKm} 
              onChange={e => setAnnTitleKm(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cấp độ thông báo</label>
            <select 
              className="form-select" 
              value={annType} 
              onChange={e => setAnnType(e.target.value as any)}
            >
              <option value="general">Thường nhật / Lịch hoạt động</option>
              <option value="emergency">Khẩn cấp / Sự cố kĩ thuật</option>
              <option value="weather">Thời tiết / Thiên tai an toàn</option>
              <option value="festival">Lễ hội / Sự kiện văn hóa</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nội dung chi tiết thông báo (VI)</label>
            <textarea 
              className="form-textarea" 
              required 
              rows={5}
              value={annContent} 
              onChange={e => setAnnContent(e.target.value)}
            />
          </div>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Nội dung chi tiết thông báo (EN)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs" 
                style={{ padding: "2px 8px", marginBottom: "4px" }}
                disabled={translatingField === "annContentEn"}
                onClick={() => handleTranslate(annContent, "annContentEn")}
              >
                {translatingField === "annContentEn" ? "Đang dịch..." : "Dịch tự động AI"}
              </button>
            </div>
            <textarea 
              className="form-textarea" 
              rows={5}
              value={annContentEn} 
              onChange={e => setAnnContentEn(e.target.value)}
            />
          </div>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Nội dung chi tiết thông báo (KM)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs" 
                style={{ padding: "2px 8px", marginBottom: "4px" }}
                disabled={translatingField === "annContentKm"}
                onClick={() => handleTranslate(annContent, "annContentKm")}
              >
                {translatingField === "annContentKm" ? "Đang dịch..." : "Dịch tự động AI"}
              </button>
            </div>
            <textarea 
              className="form-textarea" 
              rows={5}
              value={annContentKm} 
              onChange={e => setAnnContentKm(e.target.value)}
            />
          </div>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary">Lưu bản tin</button>
        </footer>
      </form>
    </div>
  );
};
