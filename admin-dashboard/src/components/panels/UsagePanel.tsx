import React from "react";
import { DollarSign, Bot, Database, MessageSquare, BookOpen, Clock } from "lucide-react";
import { AdminUsageSummary } from "../../services/adminApi";

interface UsagePanelProps {
  usageSummary: AdminUsageSummary | null;
  formatUsd: (value: number) => string;
  formatNumber: (value: number) => string;
  cfgModel: string;
  setCfgModel: (v: string) => void;
  cfgInputCost: number;
  setCfgInputCost: (v: number) => void;
  cfgOutputCost: number;
  setCfgOutputCost: (v: number) => void;
  cfgEmbedModel: string;
  setCfgEmbedModel: (v: string) => void;
  cfgEmbedCost: number;
  setCfgEmbedCost: (v: number) => void;
  savingSettings: boolean;
  handleSaveSettings: (e: React.FormEvent) => void;
  exchangeRate?: number;
}

export const UsagePanel: React.FC<UsagePanelProps> = ({
  usageSummary,
  formatUsd,
  formatNumber,
  cfgModel,
  setCfgModel,
  cfgInputCost,
  setCfgInputCost,
  cfgOutputCost,
  setCfgOutputCost,
  cfgEmbedModel,
  setCfgEmbedModel,
  cfgEmbedCost,
  setCfgEmbedCost,
  savingSettings,
  handleSaveSettings,
  exchangeRate = 25450,
}) => {
  const usage = usageSummary ?? {
    request_count: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    estimated_cost_usd: 0,
    daily: [],
    by_model: []
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">TỔNG CHI PHÍ ƯỚC TÍNH</span>
            <span className="stat-value">{formatUsd(usage.estimated_cost_usd)}</span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>
            <DollarSign size={20} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">LƯỢT GỌI MODEL</span>
            <span className="stat-value">{formatNumber(usage.request_count)}</span>
          </div>
          <div className="stat-icon"><Bot size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">INPUT TOKENS (ĐẦU VÀO)</span>
            <span className="stat-value">{formatNumber(usage.prompt_tokens)}</span>
          </div>
          <div className="stat-icon"><Database size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">OUTPUT TOKENS (ĐẦU RA)</span>
            <span className="stat-value">{formatNumber(usage.completion_tokens)}</span>
          </div>
          <div className="stat-icon"><MessageSquare size={20} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">TỔNG TOKENS</span>
            <span className="stat-value">{formatNumber(usage.total_tokens)}</span>
          </div>
          <div className="stat-icon"><BookOpen size={20} /></div>
        </div>
      </div>

      <div className="grid-usage">
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <h3 className="panel-title">
              <Bot size={18} />
              <span>Chi phí theo Model AI</span>
            </h3>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Model AI</th>
                  <th>Lượt gọi</th>
                  <th>Tổng Tokens</th>
                  <th>Chi phí</th>
                </tr>
              </thead>
              <tbody>
                {usage.by_model.map((row) => (
                  <tr key={row.model || "untracked"}>
                    <td style={{ fontWeight: 700 }}>{row.model || "untracked"}</td>
                    <td>{formatNumber(row.request_count)}</td>
                    <td>{formatNumber(row.total_tokens)}</td>
                    <td style={{ fontWeight: 700, color: "var(--success)" }}>{formatUsd(row.estimated_cost_usd)}</td>
                  </tr>
                ))}
                {usage.by_model.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--text-light)", padding: "24px" }}>
                      Chưa có dữ liệu sử dụng Model.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <h3 className="panel-title">
              <Clock size={18} />
              <span>Chi phí theo ngày sử dụng</span>
            </h3>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Lượt gọi</th>
                  <th>Input (Đầu vào)</th>
                  <th>Output (Đầu ra)</th>
                  <th>Tổng Tokens</th>
                  <th>Chi phí</th>
                </tr>
              </thead>
              <tbody>
                {usage.daily.map((row) => (
                  <tr key={row.date || "unknown"}>
                    <td style={{ fontWeight: 700 }}>{row.date || "unknown"}</td>
                    <td>{formatNumber(row.request_count)}</td>
                    <td>{formatNumber(row.prompt_tokens)}</td>
                    <td>{formatNumber(row.completion_tokens)}</td>
                    <td>{formatNumber(row.total_tokens)}</td>
                    <td style={{ fontWeight: 700, color: "var(--success)" }}>{formatUsd(row.estimated_cost_usd)}</td>
                  </tr>
                ))}
                {usage.daily.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-light)", padding: "24px" }}>
                      Chưa có dữ liệu sử dụng hàng ngày.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel-card" style={{ marginTop: "24px" }}>
        <div className="panel-header">
          <h3 className="panel-title">
            <DollarSign size={18} />
            <span>⚙️ Cấu hình Model AI & Biểu phí (Supabase Config)</span>
          </h3>
        </div>
        <form onSubmit={handleSaveSettings}>
          <div className="grid-2col">
            {/* Cột 1: Model Hội Thoại (LLM) */}
            <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "var(--primary-navy)", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", fontSize: "13.5px" }}>
                <Bot size={16} />
                <span>Cấu hình Model Hội Thoại (LLM)</span>
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "11.5px", fontWeight: 600 }}>Tên Model LLM hiện tại</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={cfgModel} 
                    onChange={e => setCfgModel(e.target.value)} 
                    required
                  />
                </div>
                <div className="grid-form-row">
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: "11.5px", fontWeight: 600 }}>Giá Input (USD/1M)</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      min="0"
                      className="form-input" 
                      value={cfgInputCost} 
                      onChange={e => setCfgInputCost(Number(e.target.value))} 
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: "11.5px", fontWeight: 600 }}>Giá Output (USD/1M)</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      min="0"
                      className="form-input" 
                      value={cfgOutputCost} 
                      onChange={e => setCfgOutputCost(Number(e.target.value))} 
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cột 2: Model Nhúng (Embedding) */}
            <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 12px 0", color: "var(--primary-navy)", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", fontSize: "13.5px" }}>
                <Database size={16} />
                <span>Cấu hình Model Nhúng (Embedding)</span>
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "11.5px", fontWeight: 600 }}>Tên Model Embedding hiện tại</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={cfgEmbedModel} 
                    onChange={e => setCfgEmbedModel(e.target.value)} 
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "11.5px", fontWeight: 600 }}>Giá Embedding (USD / 1M tokens)</label>
                  <input 
                    type="number" 
                    step="0.0001"
                    min="0"
                    className="form-input" 
                    value={cfgEmbedCost} 
                    onChange={e => setCfgEmbedCost(Number(e.target.value))} 
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="submit" className="btn btn-primary" disabled={savingSettings}>
              {savingSettings ? "Đang lưu cấu hình..." : "Lưu cấu hình hệ thống"}
            </button>
          </div>
        </form>
        
        <div style={{ marginTop: "16px", padding: "10px 14px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px dashed #bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }} className="show-on-mobile-flex">
          <span style={{ fontWeight: 600, color: "var(--success)" }}>⭐ Tỷ giá:</span>
          <span style={{ fontWeight: 700, color: "var(--primary-navy)" }}>1 USD = {exchangeRate.toLocaleString("vi-VN")} VNĐ</span>
        </div>
        <div style={{ marginTop: "16px", padding: "10px 14px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px dashed #bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }} className="hide-on-mobile">
          <span style={{ fontWeight: 600, color: "var(--success)" }}>⭐ Tỷ giá quy đổi thời gian thực:</span>
          <span style={{ fontWeight: 700, color: "var(--primary-navy)" }}>1 USD = {exchangeRate.toLocaleString("vi-VN")} VNĐ (Đã đồng bộ tự động)</span>
        </div>
      </div>
    </div>
  );
};
