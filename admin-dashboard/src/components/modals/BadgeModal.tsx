import React, { useState, useEffect } from "react";
import adminApi, { AdminBadge } from "../../services/adminApi";

interface BadgeModalProps {
  onClose: () => void;
  onSave: (data: {
    title: string;
    title_en?: string | null;
    title_km?: string | null;
    xp_required: number;
    description?: string | null;
    description_en?: string | null;
    description_km?: string | null;
    icon_url?: string | null;
  }) => void;
  selectedItem: AdminBadge | null;
  modalType: "add" | "edit" | null;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({
  onClose,
  onSave,
  selectedItem,
  modalType,
}) => {
  const [badgeTitle, setBadgeTitle] = useState("");
  const [badgeTitleEn, setBadgeTitleEn] = useState("");
  const [badgeTitleKm, setBadgeTitleKm] = useState("");
  const [badgeXp, setBadgeXp] = useState<number>(0);
  const [badgeDesc, setBadgeDesc] = useState("");
  const [badgeDescEn, setBadgeDescEn] = useState("");
  const [badgeDescKm, setBadgeDescKm] = useState("");
  const [badgeIcon, setBadgeIcon] = useState("");

  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const [translatingAll, setTranslatingAll] = useState(false);

  useEffect(() => {
    if (modalType === "edit" && selectedItem) {
      setBadgeTitle(selectedItem.title || "");
      setBadgeTitleEn(selectedItem.title_en || "");
      setBadgeTitleKm(selectedItem.title_km || "");
      setBadgeXp(selectedItem.xp_required || 0);
      setBadgeDesc(selectedItem.description || "");
      setBadgeDescEn(selectedItem.description_en || "");
      setBadgeDescKm(selectedItem.description_km || "");
      setBadgeIcon(selectedItem.icon_url || "");
    } else {
      setBadgeTitle("");
      setBadgeTitleEn("");
      setBadgeTitleKm("");
      setBadgeXp(0);
      setBadgeDesc("");
      setBadgeDescEn("");
      setBadgeDescKm("");
      setBadgeIcon("");
    }
  }, [modalType, selectedItem]);

  const handleTranslate = async (
    sourceText: string,
    fieldToSet: "badgeTitleEn" | "badgeDescEn" | "badgeTitleKm" | "badgeDescKm"
  ) => {
    if (!sourceText) {
      alert("Vui lòng nhập nội dung tiếng Việt trước khi dịch!");
      return;
    }
    setTranslatingField(fieldToSet);
    try {
      const targetLang = fieldToSet.endsWith("Km") ? "km" : "en";
      const res = await adminApi.translateText(sourceText, targetLang);
      if (fieldToSet === "badgeTitleEn") setBadgeTitleEn(res.translated_text);
      else if (fieldToSet === "badgeDescEn") setBadgeDescEn(res.translated_text);
      else if (fieldToSet === "badgeTitleKm") setBadgeTitleKm(res.translated_text);
      else if (fieldToSet === "badgeDescKm") setBadgeDescKm(res.translated_text);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Lỗi khi dịch tự động.");
    } finally {
      setTranslatingField(null);
    }
  };

  const handleTranslateAll = async () => {
    if (!badgeTitle && !badgeDesc) {
      alert("Vui lòng nhập thông tin tiếng Việt trước khi dịch!");
      return;
    }

    const needsTranslation = !badgeTitleEn || !badgeTitleKm || !badgeDescEn || !badgeDescKm;

    if (!needsTranslation) {
      alert("Tất cả các trường đã được dịch đầy đủ, không cần dịch thêm!");
      return;
    }

    const payload = {
      title: badgeTitle,
      titleEn: badgeTitleEn,
      titleKm: badgeTitleKm,
      description: badgeDesc,
      descriptionEn: badgeDescEn,
      descriptionKm: badgeDescKm
    };

    setTranslatingAll(true);
    try {
      const res = await adminApi.translateText(JSON.stringify(payload), "both");
      const resObj = JSON.parse(res.translated_text);
      
      if (resObj.titleEn) setBadgeTitleEn(resObj.titleEn);
      if (resObj.titleKm) setBadgeTitleKm(resObj.titleKm);
      if (resObj.descriptionEn) setBadgeDescEn(resObj.descriptionEn);
      if (resObj.descriptionKm) setBadgeDescKm(resObj.descriptionKm);
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
      title: badgeTitle,
      title_en: badgeTitleEn || null,
      title_km: badgeTitleKm || null,
      xp_required: Number(badgeXp),
      description: badgeDesc || null,
      description_en: badgeDescEn || null,
      description_km: badgeDescKm || null,
      icon_url: badgeIcon || null
    });
  };

  return (
    <div className="modal-content">
      <header className="modal-header">
        <h3>{modalType === "add" ? "Tạo danh hiệu mới" : "Chỉnh sửa danh hiệu"}</h3>
        <button type="button" className="btn btn-secondary btn-xs" onClick={onClose}>✕</button>
      </header>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {/* AI Translation Banner */}
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
              <h4 style={{ margin: 0, color: "var(--primary-navy)", fontSize: "13px", fontWeight: 700 }}>✨ Trợ lý Dịch thuật AI Danh hiệu (EN & KM)</h4>
              <p style={{ margin: "2px 0 0 0", color: "#475569", fontSize: "11px", lineHeight: "1.4" }}>
                Tự động chuyển ngữ danh xưng và mô tả sang Tiếng Anh & Khmer để đảm bảo trải nghiệm đa ngôn ngữ đồng nhất trên PWA.
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
              {translatingAll ? "⏳ Đang dịch..." : "🚀 Dịch AI (EN & KM)"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Điểm XP Yêu Cầu</label>
              <input 
                type="number" 
                className="form-input" 
                required 
                min={0}
                value={badgeXp} 
                onChange={e => setBadgeXp(Number(e.target.value))} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Icon URL (hoặc tên icon)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ví dụ: /assets/badges/level1.png"
                value={badgeIcon} 
                onChange={e => setBadgeIcon(e.target.value)} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tên danh hiệu (VI)</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={badgeTitle} 
              onChange={e => setBadgeTitle(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Tên danh hiệu (EN)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs" 
                style={{ padding: "2px 8px", marginBottom: "4px" }}
                disabled={translatingField === "badgeTitleEn"}
                onClick={() => handleTranslate(badgeTitle, "badgeTitleEn")}
              >
                {translatingField === "badgeTitleEn" ? "Đang dịch..." : "Dịch tự động AI"}
              </button>
            </div>
            <input 
              type="text" 
              className="form-input" 
              value={badgeTitleEn} 
              onChange={e => setBadgeTitleEn(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Tên danh hiệu (KM)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs" 
                style={{ padding: "2px 8px", marginBottom: "4px" }}
                disabled={translatingField === "badgeTitleKm"}
                onClick={() => handleTranslate(badgeTitle, "badgeTitleKm")}
              >
                {translatingField === "badgeTitleKm" ? "Đang dịch..." : "Dịch tự động AI"}
              </button>
            </div>
            <input 
              type="text" 
              className="form-input" 
              value={badgeTitleKm} 
              onChange={e => setBadgeTitleKm(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mô tả điều kiện nhận (VI)</label>
            <textarea 
              className="form-textarea" 
              rows={3}
              value={badgeDesc} 
              onChange={e => setBadgeDesc(e.target.value)}
            />
          </div>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Mô tả điều kiện nhận (EN)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs" 
                style={{ padding: "2px 8px", marginBottom: "4px" }}
                disabled={translatingField === "badgeDescEn"}
                onClick={() => handleTranslate(badgeDesc, "badgeDescEn")}
              >
                {translatingField === "badgeDescEn" ? "Đang dịch..." : "Dịch tự động AI"}
              </button>
            </div>
            <textarea 
              className="form-textarea" 
              rows={3}
              value={badgeDescEn} 
              onChange={e => setBadgeDescEn(e.target.value)}
            />
          </div>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Mô tả điều kiện nhận (KM)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs" 
                style={{ padding: "2px 8px", marginBottom: "4px" }}
                disabled={translatingField === "badgeDescKm"}
                onClick={() => handleTranslate(badgeDesc, "badgeDescKm")}
              >
                {translatingField === "badgeDescKm" ? "Đang dịch..." : "Dịch tự động AI"}
              </button>
            </div>
            <textarea 
              className="form-textarea" 
              rows={3}
              value={badgeDescKm} 
              onChange={e => setBadgeDescKm(e.target.value)}
            />
          </div>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary">Lưu danh hiệu</button>
        </footer>
      </form>
    </div>
  );
};
