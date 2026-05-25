import React, { useState, useEffect } from "react";
import adminApi, { AdminAnnouncement } from "../../services/adminApi";

interface AnnouncementModalProps {
  onClose: () => void;
  onSave: (data: {
    title: string;
    title_en?: string;
    content: string;
    content_en?: string;
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
  const [annContent, setAnnContent] = useState("");
  const [annContentEn, setAnnContentEn] = useState("");
  const [annType, setAnnType] = useState<"general" | "emergency" | "weather" | "festival">("general");

  const [translatingField, setTranslatingField] = useState<string | null>(null);

  useEffect(() => {
    if (modalType === "edit" && selectedItem) {
      setAnnTitle(selectedItem.title || "");
      setAnnTitleEn(selectedItem.title_en || "");
      setAnnContent(selectedItem.content || "");
      setAnnContentEn(selectedItem.content_en || "");
      setAnnType(selectedItem.type || "general");
    } else {
      setAnnTitle("");
      setAnnTitleEn("");
      setAnnContent("");
      setAnnContentEn("");
      setAnnType("general");
    }
  }, [modalType, selectedItem]);

  const handleTranslate = async (
    sourceText: string,
    fieldToSet: "annTitleEn" | "annContentEn"
  ) => {
    if (!sourceText) {
      alert("Vui lòng nhập nội dung tiếng Việt trước khi dịch!");
      return;
    }
    setTranslatingField(fieldToSet);
    try {
      const res = await adminApi.translateText(sourceText, "en");
      if (fieldToSet === "annTitleEn") setAnnTitleEn(res.translated_text);
      else if (fieldToSet === "annContentEn") setAnnContentEn(res.translated_text);
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
      title: annTitle,
      title_en: annTitleEn,
      content: annContent,
      content_en: annContentEn,
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
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary">Lưu bản tin</button>
        </footer>
      </form>
    </div>
  );
};
