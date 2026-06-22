import React from "react";
import { AdminChatLog } from "../../services/adminApi";

interface ChatsPanelProps {
  chats: AdminChatLog[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  formatUsd: (value: number) => string;
  formatNumber: (value: number) => string;
  handleResetChatLogs: () => void;
}

export const ChatsPanel: React.FC<ChatsPanelProps> = ({
  chats,
  searchQuery,
  setSearchQuery,
  formatUsd,
  formatNumber,
  handleResetChatLogs,
}) => {
  const [visibleCount, setVisibleCount] = React.useState(20);

  const filtered = searchQuery.trim() === ""
    ? chats
    : chats.filter(c => 
        c.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.user_name && c.user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.user_id && c.user_id.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const displayed = filtered.slice(0, visibleCount);

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="text"
            placeholder="Tìm hội thoại…"
            className="form-input"
            style={{ width: "240px", padding: "6px 12px" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          className="btn btn-danger"
          onClick={handleResetChatLogs}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#DC2626",
            color: "white"
          }}
        >
          <span>🗑️ Xóa sạch nhật ký</span>
        </button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table" style={{ minWidth: "1500px" }}>
          <thead>
            <tr>
              <th>Đường truyền</th>
              <th>Du khách / Thành viên</th>
              <th>Câu hỏi của du khách</th>
              <th>Phản hồi của AI</th>
              <th>Độ tương đồng</th>
              <th>Chunk văn bản trùng khớp</th>
              <th>Model</th>
              <th>Tokens (In/Out)</th>
              <th>Chi phí (USD)</th>
              <th>Thời gian hỏi</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((c) => {
              let scoreClass = "rag-score-high";
              if (c.confidence_score < 0.4) scoreClass = "rag-score-low";
              else if (c.confidence_score < 0.8) scoreClass = "rag-score-medium";

              return (
                <tr key={c.id}>
                  <td>
                    {c.channel === "web" ? (
                      <span className="badge badge-info">Web PWA</span>
                    ) : c.channel === "mini_app" ? (
                      <span className="badge badge-success">Mini App</span>
                    ) : c.channel === "zalo_bot" ? (
                      <span className="badge" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3B82F6" }}>Zalo Bot</span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{c.channel || "Khác"}</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--cream-white)" }}>
                    {c.user_name ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span>{c.user_name}</span>
                        {c.user_id && (
                          <span style={{ fontSize: "10px", opacity: 0.5, fontFamily: "monospace" }}>
                            ID: {c.user_id.substring(0, 8)}…
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-light)", fontStyle: "italic" }}>Ẩn danh</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, maxWidth: "250px" }}>
                    <div style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }} title={c.question}>
                      {c.question}
                    </div>
                  </td>
                  <td style={{ fontSize: "12.5px", maxWidth: "350px" }}>
                    <div style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }} title={c.answer}>
                      {c.answer}
                    </div>
                  </td>
                  <td className={scoreClass} style={{ fontSize: "14px", textAlign: "center" }}>
                    {Math.round(c.confidence_score * 100)}%
                  </td>
                  <td style={{ maxWidth: "150px" }}>
                    <div className="rag-meta-box" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }} title={c.matched_chunks}>
                      <span>{c.matched_chunks}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: "12px", fontFamily: "monospace" }}>
                    {c.model || "untracked"}
                  </td>
                  <td style={{ fontSize: "12px" }}>
                    {c.prompt_tokens !== undefined && c.completion_tokens !== undefined ? (
                      <span>
                        <strong>{formatNumber(c.prompt_tokens)}</strong> / <strong>{formatNumber(c.completion_tokens)}</strong>
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-light)", fontStyle: "italic" }}>0</span>
                    )}
                  </td>
                  <td style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--success)" }}>
                    {c.estimated_cost_usd !== undefined ? formatUsd(c.estimated_cost_usd) : "$0.000000"}
                  </td>
                  <td style={{ fontSize: "11px", color: "var(--text-light)" }}>
                    {new Date(c.created_at).toLocaleTimeString("vi-VN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > visibleCount && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", marginBottom: "10px" }}>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => setVisibleCount(prev => prev + 20)}
            style={{ 
              fontWeight: 700, 
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
            }}
          >
            <span>🔽 Xem thêm nhật ký hội thoại ({filtered.length - visibleCount} dòng ẩn)</span>
          </button>
        </div>
      )}
    </div>
  );
};
