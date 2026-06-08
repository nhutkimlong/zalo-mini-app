import React, { useState } from "react";
import { Search, Camera, Kanban, List, Trash2, ArrowRight, CheckCircle, Clock, AlertCircle } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  const filtered = searchQuery.trim() === ""
    ? feedbacks
    : feedbacks.filter(fb => 
        (fb.reporter_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        fb.content.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const newFeedbacks = filtered.filter(f => f.status === "new");
  const inProgressFeedbacks = filtered.filter(f => f.status === "in_progress");
  const resolvedFeedbacks = filtered.filter(f => f.status === "resolved" || f.status === "spam");

  const getFeedbackTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      ve_sinh: "Vệ sinh",
      gia_ca: "Giá cả",
      an_ninh: "An ninh",
      thai_do: "Phục vụ",
      ha_tang: "Hạ tầng",
      cheo_keo: "Chèo kéo",
      gop_y: "Góp ý",
      khac: "Khác"
    };
    return types[type] || type;
  };

  return (
    <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Toolbar */}
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          gap: "16px",
          flexWrap: "wrap"
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "250px", maxWidth: "400px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", display: "flex" }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Lọc phản ánh theo tên hoặc nội dung…"
            className="form-input"
            style={{ paddingLeft: "36px", width: "100%", boxSizing: "border-box" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* View Toggle Mode */}
        <div 
          style={{ 
            display: "flex", 
            backgroundColor: "rgba(255, 255, 255, 0.05)", 
            padding: "4px", 
            borderRadius: "8px", 
            border: "1px solid rgba(255, 255, 255, 0.1)" 
          }}
        >
          <button
            onClick={() => setViewMode("kanban")}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              backgroundColor: viewMode === "kanban" ? "#D4AF37" : "transparent",
              color: viewMode === "kanban" ? "#121212" : "rgba(255, 255, 255, 0.6)",
              transition: "all 0.2s"
            }}
          >
            <Kanban size={14} />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              backgroundColor: viewMode === "table" ? "#D4AF37" : "transparent",
              color: viewMode === "table" ? "#121212" : "rgba(255, 255, 255, 0.6)",
              transition: "all 0.2s"
            }}
          >
            <List size={14} />
            <span>Danh sách bảng</span>
          </button>
        </div>
      </div>

      {/* View Contents */}
      {viewMode === "kanban" ? (
        /* KANBAN BOARD VIEW */
        <div 
          style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
            gap: "20px",
            alignItems: "start",
            minHeight: "500px"
          }}
        >
          {/* Column 1: New */}
          <div className="kanban-col" style={{ backgroundColor: "rgba(0,0,0,0.15)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "#38bdf8", fontWeight: 700 }}>
                <AlertCircle size={16} />
                <span>Mới tiếp nhận</span>
              </h4>
              <span className="badge" style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>{newFeedbacks.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {newFeedbacks.length === 0 ? (
                <div style={{ padding: "30px 10px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "13px", fontStyle: "italic" }}>
                  Không có phản ánh mới
                </div>
              ) : (
                newFeedbacks.map(fb => (
                  <div 
                    key={fb.id} 
                    onClick={() => handleOpenResolveFeedback(fb)}
                    className="glass-card" 
                    style={{ 
                      padding: "14px", 
                      borderRadius: "8px", 
                      borderLeft: "4px solid #38bdf8", 
                      cursor: "pointer", 
                      backgroundColor: "rgba(255,255,255,0.02)",
                      transition: "transform 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(56, 189, 248, 0.1)", color: "#38bdf8" }}>
                        {getFeedbackTypeLabel(fb.report_type)}
                      </span>
                      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                        ID: {fb.id.slice(0, 8)}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", margin: "0 0 10px 0", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                      {fb.image_url && <Camera size={12} style={{ color: "#E5A93C", marginRight: "4px", display: "inline" }} />}
                      {fb.content}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: "rgba(255,255,255,0.5)" }}>
                      <div>
                        <strong>{fb.reporter_name || "Nặc danh"}</strong>
                        {fb.phone && <div style={{ fontSize: "10.5px" }}>📞 {fb.phone}</div>}
                      </div>
                      <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="kanban-col" style={{ backgroundColor: "rgba(0,0,0,0.15)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "#fbbf24", fontWeight: 700 }}>
                <Clock size={16} />
                <span>Đang xử lý</span>
              </h4>
              <span className="badge" style={{ backgroundColor: "rgba(251, 191, 36, 0.15)", color: "#fbbf24" }}>{inProgressFeedbacks.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {inProgressFeedbacks.length === 0 ? (
                <div style={{ padding: "30px 10px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "13px", fontStyle: "italic" }}>
                  Không có phản ánh đang xử lý
                </div>
              ) : (
                inProgressFeedbacks.map(fb => (
                  <div 
                    key={fb.id} 
                    onClick={() => handleOpenResolveFeedback(fb)}
                    className="glass-card" 
                    style={{ 
                      padding: "14px", 
                      borderRadius: "8px", 
                      borderLeft: "4px solid #fbbf24", 
                      cursor: "pointer", 
                      backgroundColor: "rgba(255,255,255,0.02)",
                      transition: "transform 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(251, 191, 36, 0.1)", color: "#fbbf24" }}>
                        {getFeedbackTypeLabel(fb.report_type)}
                      </span>
                      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                        ID: {fb.id.slice(0, 8)}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", margin: "0 0 10px 0", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                      {fb.image_url && <Camera size={12} style={{ color: "#E5A93C", marginRight: "4px", display: "inline" }} />}
                      {fb.content}
                    </p>
                    {fb.assigned_unit && (
                      <div style={{ fontSize: "11px", color: "#fbbf24", backgroundColor: "rgba(251, 191, 36, 0.05)", padding: "4px 8px", borderRadius: "4px", marginBottom: "8px" }}>
                        📍 Đơn vị: {fb.assigned_unit}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px", color: "rgba(255,255,255,0.5)" }}>
                      <div>
                        <strong>{fb.reporter_name || "Nặc danh"}</strong>
                        {fb.phone && <div style={{ fontSize: "10.5px" }}>📞 {fb.phone}</div>}
                      </div>
                      <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Resolved */}
          <div className="kanban-col" style={{ backgroundColor: "rgba(0,0,0,0.15)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "#22c55e", fontWeight: 700 }}>
                <CheckCircle size={16} />
                <span>Đã giải quyết / Từ chối</span>
              </h4>
              <span className="badge" style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}>{resolvedFeedbacks.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {resolvedFeedbacks.length === 0 ? (
                <div style={{ padding: "30px 10px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "13px", fontStyle: "italic" }}>
                  Không có phản ánh hoàn tất
                </div>
              ) : (
                resolvedFeedbacks.map(fb => (
                  <div 
                    key={fb.id} 
                    onClick={() => handleOpenResolveFeedback(fb)}
                    className="glass-card" 
                    style={{ 
                      padding: "14px", 
                      borderRadius: "8px", 
                      borderLeft: `4px solid ${fb.status === "spam" ? "#ef4444" : "#22c55e"}`, 
                      cursor: "pointer", 
                      backgroundColor: "rgba(255,255,255,0.02)",
                      transition: "transform 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "none"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <span style={{ 
                        fontSize: "11px", 
                        fontWeight: 700, 
                        padding: "2px 6px", 
                        borderRadius: "4px", 
                        backgroundColor: fb.status === "spam" ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)", 
                        color: fb.status === "spam" ? "#ef4444" : "#22c55e" 
                      }}>
                        {getFeedbackTypeLabel(fb.report_type)}
                      </span>
                      <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                        ID: {fb.id.slice(0, 8)}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: "0 0 10px 0", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {fb.content}
                    </p>
                    {fb.admin_notes && (
                      <div style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.7)", backgroundColor: "rgba(255,255,255,0.03)", padding: "8px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <strong>notes:</strong> {fb.admin_notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TRADITIONAL LIST TABLE VIEW */
        <div className="admin-table-container">
          <table className="admin-table" style={{ minWidth: "1100px" }}>
            <thead>
              <tr>
                <th>Mã số</th>
                <th>Du khách liên hệ</th>
                <th>Phân mục</th>
                <th>Ý kiến phản ánh</th>
                <th>Toạ độ GPS</th>
                <th>Trạng thái giải quyết</th>
                <th>Giải pháp hành chính</th>
                <th style={{ width: "80px", textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fb) => (
                <tr 
                  key={fb.id} 
                  style={{ cursor: "pointer" }} 
                  onClick={() => handleOpenResolveFeedback(fb)}
                >
                  <td style={{ fontWeight: 700 }}>{fb.id.slice(0, 8)}</td>
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
                  <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "right" }}>
                    <button 
                      className="btn btn-secondary btn-xs" 
                      style={{ 
                        padding: "4px 8px", 
                        fontSize: "11.5px", 
                        borderRadius: "4px", 
                        fontWeight: 700,
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        cursor: "pointer"
                      }}
                      onClick={() => handleDeleteFeedback(fb.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
