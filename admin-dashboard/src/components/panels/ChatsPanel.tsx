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
        c.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const displayed = filtered.slice(0, visibleCount);

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="text"
            placeholder="Tìm hội thoại..."
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

      <div className="admin-table-container hide-on-mobile">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Đường truyền</th>
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
                    {c.channel === "mini_app" ? (
                      <span className="badge badge-info">Zalo Mini App</span>
                    ) : (
                      <span className="badge badge-success">Zalo OA Chatbot</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.question}</td>
                  <td style={{ fontSize: "12.5px" }}>{c.answer}</td>
                  <td className={scoreClass} style={{ fontSize: "14px", textAlign: "center" }}>
                    {Math.round(c.confidence_score * 100)}%
                  </td>
                  <td>
                    <div className="rag-meta-box">
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

      {/* Giao diện thích ứng di động di động (Mobile Cards Layout) */}
      <div className="mobile-card-list show-on-mobile">
        {displayed.map((c) => {
          let scoreClass = "rag-score-high";
          if (c.confidence_score < 0.4) scoreClass = "rag-score-low";
          else if (c.confidence_score < 0.8) scoreClass = "rag-score-medium";

          return (
            <div className="mobile-card" key={c.id}>
              <div className="mobile-card-row">
                <span>
                  {c.channel === "mini_app" ? (
                    <span className="badge badge-info">Zalo Mini App</span>
                  ) : (
                    <span className="badge badge-success">Zalo OA Chatbot</span>
                  )}
                </span>
                <span className={scoreClass} style={{ fontWeight: 700, fontSize: "13px" }}>
                  Tương đồng: {Math.round(c.confidence_score * 100)}%
                </span>
              </div>
              <div className="mobile-card-row">
                <span className="mobile-card-subtitle" style={{ fontFamily: "monospace" }}>{c.model || "untracked"}</span>
                <span style={{ fontSize: "11px", color: "var(--text-light)" }}>
                  {new Date(c.created_at).toLocaleTimeString("vi-VN")}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary-navy)" }}>Hỏi: {c.question}</div>
                <div className="mobile-card-body">Đáp: {c.answer}</div>
              </div>
              {c.matched_chunks && (
                <div style={{ fontSize: "11.5px", color: "var(--text-light)", backgroundColor: "#f1f5f9", padding: "6px 8px", borderRadius: "4px" }}>
                  <strong>Khợp RAG:</strong> {c.matched_chunks}
                </div>
              )}
              <div className="mobile-card-row" style={{ fontSize: "11.5px", marginTop: "4px" }}>
                <span>Tokens: <strong>{formatNumber(c.prompt_tokens ?? 0)}</strong> / <strong>{formatNumber(c.completion_tokens ?? 0)}</strong></span>
                <span style={{ fontWeight: 600, color: "var(--success)" }}>
                  Chi phí: {c.estimated_cost_usd !== undefined ? formatUsd(c.estimated_cost_usd) : "$0.00"}
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text-light)", fontSize: "13px" }}>
            Chưa ghi nhận nhật ký hội thoại AI nào.
          </div>
        )}
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
