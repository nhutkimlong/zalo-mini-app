import React, { useState, useEffect } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { AdminFeedback } from "../../services/adminApi";

interface FeedbackModalProps {
  onClose: () => void;
  onSave: (status: AdminFeedback["status"], adminNotes: string) => void;
  selectedItem: AdminFeedback | null;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  onClose,
  onSave,
  selectedItem,
}) => {
  const [fbStatus, setFbStatus] = useState<AdminFeedback["status"]>("new");
  const [fbNotes, setFbNotes] = useState("");

  useEffect(() => {
    if (selectedItem) {
      setFbStatus(selectedItem.status || "new");
      setFbNotes(selectedItem.admin_notes || "");
    }
  }, [selectedItem]);

  const getFeedbackTypeLabel = (type: string) => {
    switch (type) {
      case "moi_truong": return "Môi trường & Rác thải";
      case "an_ninh": return "An ninh & Trật tự";
      case "gia_ca": return "Giá cả & Chặt chém";
      case "thai_do": return "Thái độ phục vụ";
      case "co_so_vat_chat": return "Cơ sở vật chất";
      case "y_te": return "Y tế & Cấp cứu";
      case "giao_thong": return "Giao thông & Đỗ xe";
      case "khac": return "Ý kiến đóng góp khác";
      default: return type;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(fbStatus, fbNotes);
  };

  if (!selectedItem) return null;

  return (
    <div className="modal-content">
      <header className="modal-header">
        <h3>Giải quyết phản ánh du khách - Mã {selectedItem.id}</h3>
        <button type="button" className="btn btn-secondary btn-xs" onClick={onClose}>✕</button>
      </header>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-slate)", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              <span style={{ fontWeight: 700, color: "var(--primary-navy)" }}>Du khách:</span> {selectedItem.reporter_name || "Nặc danh"} 
              {selectedItem.phone && ` (SĐT: ${selectedItem.phone})`}
            </div>
            <div>
              <span style={{ fontWeight: 700, color: "var(--primary-navy)" }}>Phân loại phản ánh:</span>{" "}
              <span style={{ fontWeight: 600 }}>
                {getFeedbackTypeLabel(selectedItem.report_type)}
              </span>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: "var(--primary-navy)" }}>Ý kiến du khách:</span>
              <p style={{ marginTop: "4px", fontSize: "13px", lineHeight: 1.4, color: "var(--text-dark)", whiteSpace: "pre-wrap" }}>
                💬 &quot;{selectedItem.content}&quot;
              </p>
            </div>
            {selectedItem.image_url && (
              <div style={{ marginTop: "6px" }}>
                <span style={{ fontWeight: 700, color: "var(--primary-navy)", display: "block", marginBottom: "6px" }}>
                  🖼️ Minh chứng đính kèm:
                </span>
                <a 
                  href={selectedItem.image_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ display: "inline-block", position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--accent-gold)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "all 0.2s" }}
                >
                  <img 
                    src={selectedItem.image_url} 
                    alt="Ảnh minh chứng từ du khách" 
                    style={{ display: "block", maxHeight: "180px", maxWidth: "100%", objectFit: "contain", borderRadius: "8px" }} 
                  />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(11, 37, 69, 0.85)", color: "white", padding: "4px 8px", fontSize: "10.5px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <ExternalLink size={10} />
                    <span>Nhấn để phóng to ở tab mới</span>
                  </div>
                </a>
              </div>
            )}
            {selectedItem.latitude && selectedItem.longitude && (
              <div style={{ marginTop: "4px" }}>
                <span style={{ fontWeight: 700, color: "var(--primary-navy)" }}>Tọa độ gửi kèm:</span>{" "}
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedItem.latitude},${selectedItem.longitude}`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: "var(--secondary-blue)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <MapPin size={12} />
                  <span>{selectedItem.latitude.toFixed(6)}, {selectedItem.longitude.toFixed(6)} (Xem vị trí thực địa)</span>
                </a>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Quyết định trạng thái</label>
            <select 
              className="form-select" 
              value={fbStatus} 
              onChange={e => setFbStatus(e.target.value as any)}
            >
              <option value="new">Chưa xử lý (Chờ duyệt)</option>
              <option value="in_progress">Đang xử lý (Đã giao việc liên quan)</option>
              <option value="resolved">Đã giải quyết xong (Đóng phản ánh)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Giải pháp hành chính / Ghi chú phản hồi nội bộ</label>
            <textarea 
              className="form-textarea" 
              placeholder="Nhập nội dung xử lý của Ban Quản lý..."
              rows={4}
              value={fbNotes} 
              onChange={e => setFbNotes(e.target.value)}
            />
          </div>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary">Lưu kết quả giải quyết</button>
        </footer>
      </form>
    </div>
  );
};
