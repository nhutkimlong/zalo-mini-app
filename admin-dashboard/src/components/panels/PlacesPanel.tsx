import React from "react";
import { Plus, ExternalLink, Headphones, Edit, Trash2 } from "lucide-react";
import { AdminPlace } from "../../services/adminApi";

interface PlacesPanelProps {
  places: AdminPlace[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleOpenAddPlace: () => void;
  handleOpenEditPlace: (pl: AdminPlace) => void;
  handleDeletePlace: (id: string) => void;
  getAudioFileLabel: (url?: string | null) => string;
}

export const PlacesPanel: React.FC<PlacesPanelProps> = ({
  places,
  searchQuery,
  setSearchQuery,
  handleOpenAddPlace,
  handleOpenEditPlace,
  handleDeletePlace,
  getAudioFileLabel,
}) => {
  const filtered = searchQuery.trim() === ""
    ? places
    : places.filter(pl => 
        pl.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        pl.short_description.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="text"
            placeholder="Tìm điểm tham quan…"
            className="form-input"
            style={{ width: "240px", padding: "6px 12px" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddPlace}>
          <Plus size={16} />
          <span>Thêm địa danh mới</span>
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table" style={{ minWidth: "900px" }}>
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Tên địa danh</th>
              <th>Phân loại</th>
              <th>Vị trí GPS (Vĩ độ/Kinh độ)</th>
              <th>Audio Thuyết Minh</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pl) => (
              <tr key={pl.id}>
                <td>
                  <img 
                    src={pl.image_url} 
                    alt={pl.name} 
                    style={{ width: "50px", height: "40px", borderRadius: "4px", objectFit: "cover" }} 
                  />
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: "var(--primary-navy)", display: "flex", alignItems: "center", gap: "8px" }}>
                    {pl.name}
                    <span className="badge" style={{ backgroundColor: "#e2e8f0", color: "#475569", fontSize: "10px", padding: "2px 6px" }}>
                      #{pl.display_order ?? 0}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-light)" }}>Slug: {pl.slug}</div>
                </td>
                <td>
                  <span className="badge badge-info" style={{ textTransform: "capitalize" }}>
                    {pl.category === "tam_linh" && "Tâm Linh / Tôn Giáo"}
                    {pl.category === "phong_canh" && "Phong Cảnh / Check-in"}
                    {pl.category === "dich_vu" && "Cáp Treo / Dịch Vụ"}
                  </span>
                </td>
                <td>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${pl.latitude},${pl.longitude}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ color: "var(--secondary-blue)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                  >
                    <span>{pl.latitude.toFixed(6)}, {pl.longitude.toFixed(6)}</span>
                    <ExternalLink size={12} />
                  </a>
                </td>
                <td>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "11px", color: "var(--text-light)" }}>
                    <Headphones size={12} style={{ flexShrink: 0 }} />
                    <span>{getAudioFileLabel(pl.audio_url)}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-secondary btn-xs" onClick={() => handleOpenEditPlace(pl)}>
                      <Edit size={12} />
                    </button>
                    <button className="btn btn-danger btn-xs" onClick={() => handleDeletePlace(pl.id)}>
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
