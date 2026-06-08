import React from "react";
import { Database, Plus, Edit, Trash2 } from "lucide-react";
import { AdminKnowledgeArticle } from "../../services/adminApi";

interface ArticlesPanelProps {
  articles: AdminKnowledgeArticle[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isReindexing: boolean;
  handleReindexKnowledge: () => void;
  handleOpenAddArticle: () => void;
  handleOpenEditArticle: (art: AdminKnowledgeArticle) => void;
  handleDeleteArticle: (id: string) => void;
}

export const ArticlesPanel: React.FC<ArticlesPanelProps> = ({
  articles,
  searchQuery,
  setSearchQuery,
  isReindexing,
  handleReindexKnowledge,
  handleOpenAddArticle,
  handleOpenEditArticle,
  handleDeleteArticle,
}) => {
  const filtered = searchQuery.trim() === "" 
    ? articles 
    : articles.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="text"
            placeholder="Tìm bài viết…"
            className="form-input"
            style={{ width: "240px", padding: "6px 12px" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary" onClick={handleReindexKnowledge} disabled={isReindexing}>
            <Database size={16} />
            <span>{isReindexing ? "Đang index…" : "Re-index RAG"}</span>
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenAddArticle()}>
            <Plus size={16} />
            <span>Thêm bài viết mới</span>
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table" style={{ minWidth: "950px" }}>
          <thead>
            <tr>
              <th style={{ width: "25%" }}>Tiêu đề tri thức</th>
              <th style={{ width: "15%" }}>Phân mục</th>
              <th style={{ width: "40%" }}>Nội dung văn bản</th>
              <th style={{ width: "10%" }}>Đăng tải & Ngôn ngữ</th>
              <th style={{ width: "10%" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((art) => (
              <tr key={art.id}>
                <td style={{ fontWeight: 700, color: "var(--primary-navy)" }}>{art.title}</td>
                <td>
                  <span className="badge badge-info" style={{ textTransform: "capitalize" }}>
                    {art.category.replace(/_/g, " ")}
                  </span>
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
