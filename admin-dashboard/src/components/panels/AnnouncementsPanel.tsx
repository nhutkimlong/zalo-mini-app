import React from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { AdminAnnouncement } from "../../services/adminApi";

interface AnnouncementsPanelProps {
  announcements: AdminAnnouncement[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleOpenAddAnnouncement: () => void;
  handleOpenEditAnnouncement: (ann: AdminAnnouncement) => void;
  handleDeleteAnnouncement: (id: string) => void;
  getAnnBadge: (type: AdminAnnouncement["type"]) => React.ReactNode;
}

export const AnnouncementsPanel: React.FC<AnnouncementsPanelProps> = ({
  announcements,
  searchQuery,
  setSearchQuery,
  handleOpenAddAnnouncement,
  handleOpenEditAnnouncement,
  handleDeleteAnnouncement,
  getAnnBadge,
}) => {
  const filtered = searchQuery.trim() === ""
    ? announcements
    : announcements.filter(ann => 
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ann.content.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="text"
            placeholder="Tìm bản tin..."
            className="form-input"
            style={{ width: "240px", padding: "6px 12px" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddAnnouncement}>
          <Plus size={16} />
          <span>Tạo bản tin mới</span>
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "15%" }}>Mức độ</th>
              <th style={{ width: "30%" }}>Tiêu đề bản tin</th>
              <th style={{ width: "40%" }}>Chi tiết nội dung</th>
              <th style={{ width: "15%" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ann) => (
              <tr key={ann.id}>
                <td>{getAnnBadge(ann.type)}</td>
                <td style={{ fontWeight: 700, color: "var(--primary-navy)" }}>{ann.title}</td>
                <td style={{ fontSize: "12.5px", color: "var(--text-light)" }}>{ann.content}</td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-secondary btn-xs" onClick={() => handleOpenEditAnnouncement(ann)}>
                      <Edit size={12} />
                    </button>
                    <button className="btn btn-danger btn-xs" onClick={() => handleDeleteAnnouncement(ann.id)}>
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
