import React from "react";
import { Search, Camera } from "lucide-react";
import { AdminFeedback } from "../../services/adminApi";

interface FeedbacksPanelProps {
  feedbacks: AdminFeedback[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  getFeedbackTypeBadge: (type: string) => React.ReactNode;
  getFeedbackBadge: (status: AdminFeedback["status"]) => React.ReactNode;
  handleOpenResolveFeedback: (fb: AdminFeedback) => void;
  handleDeleteFeedback: (id: string) => void;
}

export const FeedbacksPanel: React.FC<FeedbacksPanelProps> = ({
  feedbacks,
  searchQuery,
  setSearchQuery,
  getFeedbackTypeBadge,
  getFeedbackBadge,
  handleOpenResolveFeedback,
  handleDeleteFeedback,
}) => {
  const filtered = searchQuery.trim() === ""
    ? feedbacks
    : feedbacks.filter(fb => 
        (fb.reporter_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        fb.content.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Search size={16} style={{ color: "var(--text-light)" }} />
          <input
            type="text"
            placeholder="Lọc phản ánh theo tên hoặc nội dung..."
            className="form-input"
            style={{ width: "300px", padding: "6px 12px" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-container hide-on-mobile">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã số</th>
              <th>Du khách liên hệ</th>
              <th>Phân mục</th>
              <th>Ý kiến phản ánh</th>
              <th>Toạ độ GPS</th>
              <th>Trạng thái giải quyết</th>
              <th>Giải pháp hành chính</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((fb) => (
              <tr 
                key={fb.id} 
                style={{ cursor: "pointer" }} 
                onClick={() => handleOpenResolveFeedback(fb)}
              >
                <td style={{ fontWeight: 700 }}>{fb.id}</td>
                <td>
                  <div style={{ fontWeight: 700 }}>{fb.reporter_name || "Nặc danh"}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-light)", display: "flex", alignItems: "center", gap: "4px" }}>
                    📞 {fb.phone || "Không có điện thoại"}
                  </div>
                </td>
                 <td>
                  {getFeedbackTypeBadge(fb.report_type)}
                </td>
                <td>
                  <div style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12.5px", display: "flex", alignItems: "center" }}>
                    {fb.image_url && (
                      <Camera size={14} style={{ color: "#E5A93C", marginRight: "6px", flexShrink: 0 }} />
                    )}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fb.content}</span>
                  </div>
                </td>
                <td>
                  {fb.latitude && fb.longitude ? (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${fb.latitude},${fb.longitude}`} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: "var(--secondary-blue)", fontSize: "11.5px", textDecoration: "none", fontWeight: 600 }}
                    >
                      📍 {fb.latitude.toFixed(4)}, {fb.longitude.toFixed(4)}
                    </a>
                  ) : (
                    <span style={{ fontSize: "11px", color: "var(--text-light)" }}>Không gửi toạ độ</span>
                  )}
                </td>
                <td>{getFeedbackBadge(fb.status)}</td>
                <td>
                  <div style={{ 
                    maxWidth: "200px", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis", 
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    fontSize: "11px",
                    color: "var(--success)",
                    fontWeight: 500
                  }}>
                    {fb.admin_notes || <span style={{ color: "var(--text-light)", fontStyle: "italic" }}>Chưa có phương án giải quyết</span>}
                  </div>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="btn btn-danger btn-xs" 
                    style={{ 
                      padding: "4px 8px", 
                      fontSize: "11.5px", 
                      borderRadius: "4px", 
                      fontWeight: 700,
                      backgroundColor: "#DC2626",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      transition: "background-color 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#B91C1C"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#DC2626"}
                    onClick={() => handleDeleteFeedback(fb.id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Giao diện thích ứng di động di động (Mobile Cards Layout) */}
      <div className="mobile-card-list show-on-mobile">
        {filtered.map((fb) => (
          <div 
            className="mobile-card" 
            key={fb.id}
            onClick={() => handleOpenResolveFeedback(fb)}
            style={{ cursor: "pointer" }}
          >
            <div className="mobile-card-row">
              <span className="mobile-card-title">{fb.reporter_name || "Khách ẩn danh"}</span>
              <span>{getFeedbackBadge(fb.status)}</span>
            </div>
            <div className="mobile-card-row">
              <span className="mobile-card-subtitle">📞 {fb.phone || "Không có SĐT"}</span>
              <span>{getFeedbackTypeBadge(fb.report_type)}</span>
            </div>
            <div className="mobile-card-body">
              {fb.image_url && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontSize: "11px", color: "var(--accent-gold)", fontWeight: 600 }}>
                  <Camera size={12} /> Có hình ảnh đính kèm
                </div>
              )}
              {fb.content}
            </div>
            {fb.admin_notes && (
              <div style={{ fontSize: "12px", color: "var(--success)", fontWeight: 500, paddingLeft: "8px", borderLeft: "2px solid var(--success)", margin: "4px 0" }}>
                <strong>Giải quyết:</strong> {fb.admin_notes}
              </div>
            )}
            <div className="mobile-card-row" style={{ fontSize: "11px", color: "var(--text-light)", marginTop: "4px" }}>
              <span>Mã số: #{fb.id}</span>
              {fb.latitude && fb.longitude && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${fb.latitude},${fb.longitude}`} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: "var(--secondary-blue)", fontWeight: 600, textDecoration: "none" }}
                >
                  📍 Định vị GPS Map
                </a>
              )}
            </div>
            <div className="mobile-card-actions" onClick={(e) => e.stopPropagation()}>
              <button 
                className="btn btn-primary"
                onClick={() => handleOpenResolveFeedback(fb)}
              >
                Giải quyết
              </button>
              <button 
                className="btn btn-danger"
                style={{ backgroundColor: "#DC2626" }}
                onClick={() => handleDeleteFeedback(fb.id)}
              >
                Xóa phản ánh
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text-light)", fontSize: "13px" }}>
            Không tìm thấy phản ánh nào của du khách.
          </div>
        )}
      </div>
    </div>
  );
};
