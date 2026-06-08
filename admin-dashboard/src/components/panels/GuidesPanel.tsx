import React from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { AdminKnowledgeArticle } from "../../services/adminApi";

interface GuidesPanelProps {
  articles: AdminKnowledgeArticle[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleOpenAddArticle: (category?: string) => void;
  handleOpenEditArticle: (art: AdminKnowledgeArticle) => void;
  handleDeleteArticle: (id: string) => void;
}

export const GuidesPanel: React.FC<GuidesPanelProps> = ({
  articles,
  searchQuery,
  setSearchQuery,
  handleOpenAddArticle,
  handleOpenEditArticle,
  handleDeleteArticle,
}) => {
  const filtered = articles.filter(art => 
    ["ve_va_gio_mo_cua", "di_chuyen", "noi_quy"].includes(art.category)
  ).filter(art => 
    searchQuery.trim() === "" ||
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    art.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="panel-card">
      <div style={{ background: "rgba(11,37,69,0.05)", border: "1px solid rgba(11,37,69,0.12)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", fontSize: "12.5px", color: "var(--primary-navy)" }}>
        <strong>🎫 Hướng Dẫn Tham Quan</strong> — Quản lý thông tin hiển thị trực tiếp trên <strong>Zalo Mini App</strong> (bảng giá vé, lịch hoạt động, di chuyển, nội quy). Đây là nội dung <em>riêng biệt hoàn toàn</em> với Kho Tri Thức RAG.
      </div>
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="text"
            placeholder="Tìm hướng dẫn…"
            className="form-input"
            style={{ width: "240px", padding: "6px 12px" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => handleOpenAddArticle("ve_va_gio_mo_cua")}
        >
          <Plus size={16} />
          <span>Thêm hướng dẫn mới</span>
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table" style={{ minWidth: "900px" }}>
          <thead>
            <tr>
              <th style={{ width: "25%" }}>Tiêu đề hướng dẫn</th>
              <th style={{ width: "20%" }}>Phân mục hướng dẫn</th>
              <th style={{ width: "35%" }}>Nội dung chi tiết</th>
              <th style={{ width: "10%" }}>Đăng tải & Ngôn ngữ</th>
              <th style={{ width: "10%" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((art) => (
              <tr key={art.id}>
                <td style={{ fontWeight: 700, color: "var(--primary-navy)" }}>{art.title}</td>
                <td>
                  {art.category === "ve_va_gio_mo_cua" && <span className="badge badge-success">Vé & Lịch hoạt động</span>}
                  {art.category === "di_chuyen" && <span className="badge badge-info">Di chuyển & Bãi xe</span>}
                  {art.category === "noi_quy" && <span className="badge badge-warning">Nội quy & Ứng xử</span>}
                </td>
                <td>
                  <div style={{ 
                    maxWidth: "400px", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis", 
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    fontSize: "12.5px",
                    color: "var(--text-light)"
                  }}>
                    {art.content}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {art.is_published ? (
                      <span className="badge badge-success" style={{ alignSelf: "flex-start" }}>Hoạt động</span>
                    ) : (
                      <span className="badge badge-warning" style={{ alignSelf: "flex-start" }}>Bản nháp</span>
                    )}
                    <div style={{ display: "flex", gap: "4px", fontSize: "10px", marginTop: "2px" }}>
                      <span style={{ padding: "1px 4px", borderRadius: "3px", backgroundColor: "#10b981", color: "white", fontWeight: 700 }} title="Tiếng Việt">VI</span>
                      <span style={{ 
                        padding: "1px 4px", 
                        borderRadius: "3px", 
                        backgroundColor: art.title_en && art.content_en ? "#10b981" : "#cbd5e1", 
                        color: "white", 
                        fontWeight: 700 
                      }} title={art.title_en && art.content_en ? "Tiếng Anh đã dịch" : "Thiếu tiếng Anh"}>EN</span>
                      <span style={{ 
                        padding: "1px 4px", 
                        borderRadius: "3px", 
                        backgroundColor: art.title_km && art.content_km ? "#10b981" : "#ef4444", 
                        color: "white", 
                        fontWeight: 700 
                      }} title={art.title_km && art.content_km ? "Tiếng Khmer đã dịch" : "Thiếu tiếng Khmer"}>KM</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-secondary btn-xs" onClick={() => handleOpenEditArticle(art)}>
                      <Edit size={12} />
                    </button>
                    <button className="btn btn-danger btn-xs" onClick={() => handleDeleteArticle(art.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
