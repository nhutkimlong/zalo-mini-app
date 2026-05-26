import React from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { AdminItinerary, AdminPlace } from "../../services/adminApi";

interface ItinerariesPanelProps {
  itineraries: AdminItinerary[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  places: AdminPlace[];
  handleOpenAddItinerary: () => void;
  handleOpenEditItinerary: (it: AdminItinerary) => void;
  handleDeleteItinerary: (id: string) => void;
}

export const ItinerariesPanel: React.FC<ItinerariesPanelProps> = ({
  itineraries,
  searchQuery,
  setSearchQuery,
  places,
  handleOpenAddItinerary,
  handleOpenEditItinerary,
  handleDeleteItinerary,
}) => {
  const filtered = itineraries.filter(it => 
    it.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (it.name_en || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="text"
            placeholder="Tìm lộ trình..."
            className="form-input"
            style={{ width: "240px", padding: "6px 12px" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddItinerary}>
          <Plus size={16} />
          <span>Thêm lộ trình mới</span>
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table" style={{ minWidth: "900px" }}>
          <thead>
            <tr>
              <th>Lộ trình (Tên)</th>
              <th>Thời lượng</th>
              <th>Mã màu vẽ</th>
              <th>Tuyến đi (Điểm kết nối)</th>
              <th>Số chặng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr key={it.id}>
                <td>
                  <div style={{ fontWeight: 700, color: "var(--primary-navy)" }}>{it.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-light)" }}>EN: {it.name_en || "-"}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{it.duration}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-light)" }}>EN: {it.duration_en || "-"}</div>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ display: "inline-block", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: it.color, border: "1px solid #ccc" }} />
                    <span style={{ fontSize: "11px", fontFamily: "monospace" }}>{it.color}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                    {it.place_slugs.map((slug, idx) => {
                      const matched = places.find(p => p.slug === slug);
                      return (
                        <React.Fragment key={idx}>
                          {idx > 0 && <span style={{ color: "var(--text-light)", fontSize: "10px" }}>➔</span>}
                          <span className="badge" style={{ backgroundColor: "rgba(11,37,69,0.06)", color: "var(--primary-navy)", border: "1px solid rgba(11,37,69,0.12)", fontSize: "11px" }}>
                            {matched ? matched.name : slug}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </td>
                <td>
                  <span className="badge badge-info">{it.steps.length} chặng</span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-secondary btn-xs" onClick={() => handleOpenEditItinerary(it)}>
                      <Edit size={12} />
                    </button>
                    <button className="btn btn-danger btn-xs" onClick={() => handleDeleteItinerary(it.id)}>
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
