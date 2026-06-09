import React from "react";
import { Plus, Award, Edit, Trash2 } from "lucide-react";
import { AdminBadge } from "../../services/adminApi";

interface BadgesPanelProps {
  badges: AdminBadge[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleOpenAddBadge: () => void;
  handleOpenEditBadge: (badge: AdminBadge) => void;
  handleDeleteBadge: (id: string) => void;
}

export const BadgesPanel: React.FC<BadgesPanelProps> = ({
  badges,
  searchQuery,
  setSearchQuery,
  handleOpenAddBadge,
  handleOpenEditBadge,
  handleDeleteBadge,
}) => {
  const sorted = [...badges].sort((a, b) => a.xp_required - b.xp_required);

  const filtered = searchQuery.trim() === ""
    ? sorted
    : sorted.filter(badge => 
        badge.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (badge.description && badge.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  return (
    <div className="panel-card fade-in">
      <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="text"
            placeholder="Tìm danh hiệu/mô tả…"
            className="form-input"
            style={{ width: "260px", padding: "6px 12px" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddBadge}>
          <Plus size={16} />
          <span>Thêm danh hiệu mới</span>
        </button>
      </div>

      <div style={{
        background: "rgba(11,37,69,0.02)",
        border: "1px solid rgba(212,175,55,0.2)",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "12px",
        color: "var(--primary-navy)"
      }}>
        <Award size={18} style={{ color: "var(--accent-gold)", flexShrink: 0 }} />
        <span>
          <strong>Lưu ý:</strong> Cấp bậc (Level) của người dùng trên Web PWA được xác định tự động dựa trên số thứ tự của danh hiệu sắp xếp theo điểm XP tăng dần trong danh sách này.
        </span>
      </div>

      <div className="admin-table-container">
        <table className="admin-table" style={{ minWidth: "900px" }}>
          <thead>
            <tr>
              <th>Hình ảnh/Icon</th>
              <th>Cấp độ</th>
              <th>Tên Danh Hiệu</th>
              <th>Mốc XP Yêu Cầu</th>
              <th>Mô Tả & Điều Kiện Nhận</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text-light)" }}>
                  Không tìm thấy danh hiệu nào khớp với từ khóa tìm kiếm.
                </td>
              </tr>
            ) : (
              filtered.map((badge, idx) => (
                <tr key={badge.id}>
                  <td>
                    {badge.icon_url ? (
                      <img 
                        src={badge.icon_url} 
                        alt={badge.title} 
                        style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--accent-gold)" }} 
                      />
                    ) : (
                      <div style={{ 
                        width: "36px", 
                        height: "36px", 
                        borderRadius: "50%", 
                        backgroundColor: "rgba(11,37,69,0.1)", 
                        color: "var(--primary-navy)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        border: "1.5px solid rgba(11,37,69,0.2)"
                      }}>
                        <Award size={18} />
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-success" style={{ fontSize: "11px", fontWeight: 700 }}>
                      Cấp {idx + 1}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--primary-navy)", fontSize: "13px" }}>
                      {badge.title}
                    </div>
                    {badge.title_en && (
                      <div style={{ fontSize: "11px", color: "var(--text-light)" }}>EN: {badge.title_en}</div>
                    )}
                    {badge.title_km && (
                      <div style={{ fontSize: "11px", color: "#8da2bb" }}>KM: {badge.title_km}</div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-warning" style={{ fontSize: "12px", fontWeight: 700 }}>
                      {badge.xp_required.toLocaleString()} XP
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: "12px", color: "#334155", maxWidth: "400px", whiteSpace: "normal", wordBreak: "break-word", lineHeight: "1.4" }}>
                      {badge.description || "Chưa có mô tả chi tiết."}
                    </div>
                    {badge.description_en && (
                      <div style={{ fontSize: "11px", color: "var(--text-light)", marginTop: "2px" }}>EN: {badge.description_en}</div>
                    )}
                    {badge.description_km && (
                      <div style={{ fontSize: "11px", color: "#8da2bb", marginTop: "2px" }}>KM: {badge.description_km}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn btn-secondary btn-xs" title="Chỉnh sửa" onClick={() => handleOpenEditBadge(badge)}>
                        <Edit size={12} />
                      </button>
                      <button className="btn btn-danger btn-xs" title="Xóa" onClick={() => handleDeleteBadge(badge.id)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
