import React from "react";
import { 
  BookOpen, 
  Bell, 
  AlertTriangle, 
  Bot, 
  Database, 
  Camera 
} from "lucide-react";
import { AdminFeedback, AdminChatLog } from "../../services/adminApi";

interface DashboardPanelProps {
  totalArticles: number;
  activeAnnouncements: number;
  newFeedbacks: number;
  totalFeedbacks: number;
  totalChats: number;
  successRate: number;
  feedbacks: AdminFeedback[];
  highConfidenceChats: number;
  chats: AdminChatLog[];
  setActiveTab: (tab: "dashboard" | "articles" | "guides" | "places" | "itineraries" | "announcements" | "feedbacks" | "chats" | "usage") => void;
  getFeedbackTypeLabel: (type: string) => string;
  getFeedbackBadge: (status: AdminFeedback["status"]) => React.ReactNode;
  handleOpenResolveFeedback: (f: AdminFeedback) => void;
  handleOpenAddArticle?: (defaultCat?: string, defaultTitle?: string) => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  totalArticles,
  activeAnnouncements,
  newFeedbacks,
  totalFeedbacks,
  totalChats,
  successRate,
  feedbacks,
  highConfidenceChats,
  chats,
  setActiveTab,
  getFeedbackTypeLabel,
  getFeedbackBadge,
  handleOpenResolveFeedback,
  handleOpenAddArticle,
}) => {
  const feedbackCategories = [
    { key: "ve_sinh", label: "Vệ sinh cảnh quan", color: "#3B82F6" },
    { key: "gia_ca", label: "Giá cả / Ép giá", color: "#F59E0B" },
    { key: "an_ninh", label: "An ninh trật tự", color: "#EF4444" },
    { key: "thai_do", label: "Thái độ phục vụ", color: "#10B981" },
    { key: "ha_tang", label: "Cơ sở hạ tầng", color: "#6366F1" },
    { key: "cheo_keo", label: "Chèo kéo du khách", color: "#EC4899" },
    { key: "gop_y", label: "Góp ý xây dựng", color: "#8B5CF6" },
  ];

  const feedbackCounts = feedbackCategories.map(cat => {
    const count = feedbacks.filter(f => f.report_type === cat.key).length;
    return { ...cat, count };
  }).sort((a, b) => b.count - a.count);

  const totalChatsCount = chats.length;
  const highConfCount = highConfidenceChats;
  const medConfCount = chats.filter(c => c.confidence_score >= 0.5 && c.confidence_score < 0.7).length;
  const lowConfCount = chats.filter(c => c.confidence_score < 0.5).length;

  const highConfPercent = totalChatsCount > 0 ? Math.round((highConfCount / totalChatsCount) * 100) : 0;
  const medConfPercent = totalChatsCount > 0 ? Math.round((medConfCount / totalChatsCount) * 100) : 0;
  const lowConfPercent = totalChatsCount > 0 ? Math.round((lowConfCount / totalChatsCount) * 100) : 0;

  // Lọc câu hỏi tin cậy kém để tối ưu RAG
  const lowConfidenceChatLogs = chats.filter(c => c.confidence_score < 0.5);

  const renderFeedbackDonut = () => {
    if (totalFeedbacks === 0) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "150px", color: "var(--text-light)" }}>
          Chưa có ý kiến phản ánh nào của du khách.
        </div>
      );
    }

    const r = 38;
    const circ = 2 * Math.PI * r; // ~238.76
    let currentOffset = 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ position: "relative", width: "140px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="140" height="140" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
              {feedbackCounts.map(cat => {
                const percent = totalFeedbacks > 0 ? (cat.count / totalFeedbacks) * 100 : 0;
                if (percent === 0) return null;
                const strokeLength = (percent / 100) * circ;
                const strokeOffset = currentOffset;
                currentOffset += strokeLength;

                return (
                  <circle
                    key={cat.key}
                    cx="50"
                    cy="50"
                    r={r}
                    fill="transparent"
                    stroke={cat.color}
                    strokeWidth="10"
                    strokeDasharray={`${strokeLength} ${circ}`}
                    strokeDashoffset={-strokeOffset}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                  />
                );
              })}
            </svg>
            <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-light)" }}>Ý KIẾN</span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--primary-navy)" }}>{totalFeedbacks}</span>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11.5px", flex: 1, minWidth: "180px", maxHeight: "140px", overflowY: "auto", paddingRight: "4px" }}>
            {feedbackCounts.map(cat => {
              const percent = totalFeedbacks > 0 ? Math.round((cat.count / totalFeedbacks) * 100) : 0;
              return (
                <div key={cat.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid var(--border-slate)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: cat.color, flexShrink: 0 }} />
                    {cat.label}
                  </span>
                  <span style={{ fontWeight: 700, color: "var(--text-dark)" }}>{cat.count} ({percent}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderRAGDonut = () => {
    if (totalChats === 0) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "150px", color: "var(--text-light)" }}>
          Chưa có dữ liệu hội thoại AI của du khách.
        </div>
      );
    }

    const r = 38;
    const circ = 2 * Math.PI * r; // ~238.76

    const highStroke = (highConfPercent / 100) * circ;
    const medStroke = (medConfPercent / 100) * circ;
    const lowStroke = (lowConfPercent / 100) * circ;

    const highOffset = 0;
    const medOffset = highStroke;
    const lowOffset = highStroke + medStroke;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ position: "relative", width: "140px", height: "140px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="140" height="140" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
              {highConfPercent > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="10"
                  strokeDasharray={`${highStroke} ${circ}`}
                  strokeDashoffset={-highOffset}
                />
              )}
              {medConfPercent > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="10"
                  strokeDasharray={`${medStroke} ${circ}`}
                  strokeDashoffset={-medOffset}
                />
              )}
              {lowConfPercent > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke="#EF4444"
                  strokeWidth="10"
                  strokeDasharray={`${lowStroke} ${circ}`}
                  strokeDashoffset={-lowOffset}
                />
              )}
            </svg>
            <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "var(--text-light)" }}>ĐỘ KHỚP</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--success)" }}>{successRate}%</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px", flex: 1, minWidth: "180px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-slate)", paddingBottom: "4px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981" }} />
                Độ tin cậy Cao (&gt;= 0.7)
              </span>
              <span style={{ fontWeight: 700 }}>{highConfCount} ({highConfPercent}%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-slate)", paddingBottom: "4px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F59E0B" }} />
                Độ tin cậy T.Bình (0.5 - 0.7)
              </span>
              <span style={{ fontWeight: 700 }}>{medConfCount} ({medConfPercent}%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-slate)", paddingBottom: "4px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#EF4444" }} />
                Độ tin cậy Kém (&lt; 0.5)
              </span>
              <span style={{ fontWeight: 700 }}>{lowConfCount} ({lowConfPercent}%)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Summary row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">BÀI VIẾT TRI THỨC</span>
            <span className="stat-value">{totalArticles}</span>
          </div>
          <div className="stat-icon"><BookOpen size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">BẢN TIN HOẠT ĐỘNG</span>
            <span className="stat-value">{activeAnnouncements}</span>
          </div>
          <div className="stat-icon"><Bell size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">PHẢN ÁNH CHỜ DUYỆT</span>
            <span className="stat-value" style={{ color: newFeedbacks > 0 ? "var(--danger)" : "inherit" }}>
              {newFeedbacks} / {totalFeedbacks}
            </span>
          </div>
          <div className="stat-icon"><AlertTriangle size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">KIỂM TOÁN CHATBOT</span>
            <span className="stat-value">{totalChats}</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>
            <Bot size={20} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">TỶ LỆ KHỚP CHÍNH XÁC</span>
            <span className="stat-value" style={{ color: successRate >= 90 ? "var(--success)" : "var(--warning)" }}>
              {successRate}%
            </span>
          </div>
          <div className="stat-icon"><Bot size={20} /></div>
        </div>
      </div>

      {/* Visual Analytics Charts Section (WOW Aesthetics - SVG Donuts) */}
      <div className="grid-2col" style={{ marginBottom: "24px" }}>
        {/* Left: Feedback category distribution chart */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <h3 className="panel-title" style={{ fontSize: "14px", fontWeight: 700 }}>
              <AlertTriangle size={18} style={{ color: "#E5A93C" }} />
              <span>Phân Phối & Phân Loại Ý Kiến Phản Ánh</span>
            </h3>
          </div>
          <div style={{ padding: "8px 0" }}>
            {renderFeedbackDonut()}
          </div>
        </div>

        {/* Right: RAG evaluation chatbot quality rating chart */}
        <div className="panel-card" style={{ marginBottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="panel-header">
              <h3 className="panel-title" style={{ fontSize: "14px", fontWeight: 700 }}>
                <Bot size={18} style={{ color: "#10B981" }} />
                <span>Đánh Giá Chất Lượng Phản Hồi RAG Chatbot</span>
              </h3>
            </div>
            <div style={{ padding: "8px 0" }}>
              {renderRAGDonut()}
            </div>
          </div>

          {/* RAG Action Center Loop (⚡ 1-Click Optimizer) */}
          <div style={{ 
            marginTop: "16px",
            backgroundColor: "#FFFBEB", 
            padding: "12px 14px", 
            borderRadius: "10px", 
            border: "1px solid #FDE68A",
            fontSize: "12.5px"
          }}>
            <h4 style={{ fontWeight: 800, margin: "0 0 6px 0", color: "#B45309", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>⚡ Hành động: Tối ưu RAG nhanh (Tin cậy kém &lt; 50%)</span>
            </h4>
            {lowConfidenceChatLogs.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ margin: 0, color: "var(--text-dark)", fontSize: "12px", lineHeight: 1.35 }}>
                  Phát hiện <strong>{lowConfidenceChatLogs.length} câu hỏi</strong> có điểm tin cậy thấp. Nhấp nút tối ưu để điền nhanh bài viết RAG mới:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {lowConfidenceChatLogs.slice(0, 2).map((chat) => (
                    <div key={chat.id} style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      backgroundColor: "white",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #FEF3C7"
                    }}>
                      <div style={{ flex: 1, marginRight: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "11.5px", fontWeight: 600, color: "var(--text-dark)" }}>
                        ❓ "{chat.question}"
                      </div>
                      {handleOpenAddArticle && (
                        <button 
                          className="btn btn-primary btn-xs"
                          style={{ fontSize: "10.5px", padding: "3px 6px", fontWeight: 700 }}
                          onClick={() => handleOpenAddArticle("lich_su", chat.question)}
                        >
                          Tối ưu RAG
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: "var(--success)", fontWeight: 600, fontSize: "12px" }}>
                ✔ Tuyệt vời! Chatbot hiện tại đạt hiệu năng tri thức tối đa. Không có câu hỏi nào cần tối ưu hóa.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Two columns details */}
      <div className="grid-dashboard-bottom">
        {/* Left: Recent feedbacks */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <h3 className="panel-title">
              <AlertTriangle size={18} />
              <span>Phản ánh mới nhận</span>
            </h3>
            <button className="btn btn-secondary btn-xs" onClick={() => setActiveTab("feedbacks")}>
              Xem tất cả
            </button>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã số</th>
                  <th>Người gửi</th>
                  <th>Loại phản ánh</th>
                  <th>Nội dung</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.slice(0, 3).map((f) => (
                  <tr key={f.id} style={{ cursor: "pointer" }} onClick={() => handleOpenResolveFeedback(f)}>
                    <td style={{ fontWeight: 700 }}>{f.id}</td>
                    <td>
                       <div style={{ fontWeight: 600 }}>{f.reporter_name || "Nặc danh"}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-light)" }}>{f.phone || "-"}</div>
                    </td>
                    <td>
                      {getFeedbackTypeLabel(f.report_type)}
                    </td>
                    <td>
                      <div style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
                        {f.image_url && (
                          <Camera size={14} style={{ color: "#E5A93C", marginRight: "6px", flexShrink: 0 }} />
                        )}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.content}</span>
                      </div>
                    </td>
                    <td>{getFeedbackBadge(f.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick shortcuts and OA statistics */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <h3 className="panel-title">
              <Bot size={18} />
              <span>Trợ lý số & Zalo OA</span>
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-slate)" }}>
              <h4 style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px", color: "var(--primary-navy)" }}>
                Cấu hình Vector Database
              </h4>
              <p style={{ fontSize: "12px", color: "var(--text-light)", lineHeight: 1.4, margin: "0 0 10px 0" }}>
                Dữ liệu tri thức RAG được chia nhỏ tự động và lưu trữ dưới dạng embeddings vector 1536 chiều để thực hiện tra cứu cosine.
              </p>
              <button className="btn btn-primary btn-xs" style={{ width: "100%" }} onClick={() => setActiveTab("articles")}>
                <Database size={12} />
                <span>Truy cập Kho bài viết RAG</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <span style={{ color: "var(--text-light)" }}>Số câu hỏi khớp tốt:</span>
                <span style={{ fontWeight: 700, color: "var(--success)" }}>{highConfCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                <span style={{ color: "var(--text-light)" }}>Số câu hỏi chuyển tiếp BQL:</span>
                <span style={{ fontWeight: 700, color: "var(--danger)" }}>{lowConfCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "var(--text-light)" }}>Nguồn câu hỏi Mini App:</span>
                <span style={{ fontWeight: 700 }}>{chats.filter(c => c.channel === "mini_app").length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
