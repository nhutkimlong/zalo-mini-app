import React from "react";
import { TrendingUp, DollarSign, Activity, Award } from "lucide-react";

interface DailyUsageRow {
  date: string;
  request_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

interface AnalyticsViewProps {
  usageSummary: {
    request_count: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost_usd: number;
    daily: DailyUsageRow[];
  } | null;
  formatUsd: (value: number) => string;
  formatNumber: (value: number) => string;
  exchangeRate: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  usageSummary,
  formatUsd,
  formatNumber,
  exchangeRate
}) => {
  const usage = usageSummary ?? {
    request_count: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    estimated_cost_usd: 0,
    daily: []
  };

  const dailyData = usage.daily ?? [];

  // 1. Calculate max total tokens for scaling the chart
  const maxTokens = dailyData.length > 0
    ? Math.max(...dailyData.map(d => d.total_tokens || 0), 1000)
    : 1000;

  // 2. Calculate max cost for scaling the cost chart
  const maxCost = dailyData.length > 0
    ? Math.max(...dailyData.map(d => d.estimated_cost_usd || 0), 0.05)
    : 0.05;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Overview stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">TỔNG NGÂN SÁCH ĐÃ CHI</span>
            <span className="stat-value" style={{ color: "var(--success)" }}>
              {formatUsd(usage.estimated_cost_usd)}
            </span>
          </div>
          <div className="stat-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>
            <DollarSign size={20} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">TRUNG BÌNH CHI PHÍ / LƯỢT</span>
            <span className="stat-value">
              {usage.request_count > 0 
                ? formatUsd(usage.estimated_cost_usd / usage.request_count) 
                : "$0.00"}
            </span>
          </div>
          <div className="stat-icon"><TrendingUp size={20} /></div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">TRUNG BÌNH TOKENS / LƯỢT</span>
            <span className="stat-value">
              {usage.request_count > 0
                ? formatNumber(Math.round(usage.total_tokens / usage.request_count))
                : "0"}
            </span>
          </div>
          <div className="stat-icon"><Activity size={20} /></div>
        </div>
      </div>

      <div className="grid-2col">
        {/* SVG Daily Token Usage Bar Chart */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <h3 className="panel-title" style={{ fontSize: "14px", fontWeight: 700 }}>
              <Activity size={18} style={{ color: "var(--accent-gold)" }} />
              <span>Biểu đồ tiêu thụ Tokens hàng ngày</span>
            </h3>
          </div>
          <div style={{ padding: "16px 8px 8px 8px" }}>
            {dailyData.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* SVG Graph */}
                <div style={{ height: "200px", width: "100%", position: "relative" }}>
                  <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="40" y1="20" x2="480" y2="20" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="40" y1="80" x2="480" y2="80" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="40" y1="140" x2="480" y2="140" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />

                    {/* Left axis Labels */}
                    <text x="5" y="24" fontSize="9" fontWeight="700" fill="#64748b">{formatNumber(Math.round(maxTokens))}</text>
                    <text x="5" y="84" fontSize="9" fontWeight="700" fill="#64748b">{formatNumber(Math.round(maxTokens * 0.6))}</text>
                    <text x="5" y="144" fontSize="9" fontWeight="700" fill="#64748b">{formatNumber(Math.round(maxTokens * 0.2))}</text>

                    {/* Bars rendering */}
                    {dailyData.map((d, index) => {
                      const count = dailyData.length;
                      const barWidth = Math.min(24, Math.max(8, 360 / count));
                      const spacing = (440 - barWidth * count) / (count + 1);
                      const x = 40 + spacing + index * (barWidth + spacing);
                      
                      const tokenRatio = d.total_tokens / maxTokens;
                      // Height of bar scaled to max 150px (y from 170 down to 20)
                      const barHeight = tokenRatio * 150;
                      const y = 170 - barHeight;

                      return (
                        <g key={d.date} className="bar-group">
                          {/* Prompt tokens part (dark navy) */}
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx={2}
                            fill="#134074"
                            style={{ transition: "all 0.5s ease" }}
                          />
                          {/* Completion tokens part overlay (gold highlight) */}
                          <rect
                            x={x}
                            y={170 - (d.completion_tokens / maxTokens) * 150}
                            width={barWidth}
                            height={(d.completion_tokens / maxTokens) * 150}
                            rx={2}
                            fill="#d4af37"
                            style={{ transition: "all 0.5s ease" }}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* X Axis Labels */}
                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "40px", paddingRight: "20px", fontSize: "10px", fontWeight: 700, color: "#64748b" }}>
                  <span>{dailyData[0]?.date || "Bắt đầu"}</span>
                  <span>Giữa kỳ</span>
                  <span>{dailyData[dailyData.length - 1]?.date || "Hôm nay"}</span>
                </div>

                {/* Legend */}
                <div style={{ display: "flex", gap: "16px", justifyContent: "center", fontSize: "11px", fontWeight: 600, marginTop: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#134074" }} />
                    Prompt Tokens (Đầu vào)
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#d4af37" }} />
                    Completion Tokens (Đầu ra)
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--text-light)" }}>
                Chưa có dữ liệu thống kê theo ngày.
              </div>
            )}
          </div>
        </div>

        {/* SVG Daily Estimated Cost Line Chart */}
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <h3 className="panel-title" style={{ fontSize: "14px", fontWeight: 700 }}>
              <DollarSign size={18} style={{ color: "var(--success)" }} />
              <span>Biểu đồ chi phí hàng ngày (VNĐ quy đổi)</span>
            </h3>
          </div>
          <div style={{ padding: "16px 8px 8px 8px" }}>
            {dailyData.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* SVG Graph */}
                <div style={{ height: "200px", width: "100%", position: "relative" }}>
                  <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="45" y1="20" x2="480" y2="20" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="45" y1="80" x2="480" y2="80" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="45" y1="140" x2="480" y2="140" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
                    <line x1="45" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />

                    {/* Left axis Labels (VND) */}
                    <text x="2" y="24" fontSize="8" fontWeight="700" fill="#64748b">{(maxCost * exchangeRate).toLocaleString("vi-VN")}đ</text>
                    <text x="2" y="84" fontSize="8" fontWeight="700" fill="#64748b">{(maxCost * 0.6 * exchangeRate).toLocaleString("vi-VN")}đ</text>
                    <text x="2" y="144" fontSize="8" fontWeight="700" fill="#64748b">{(maxCost * 0.2 * exchangeRate).toLocaleString("vi-VN")}đ</text>

                    {/* Area path definition */}
                    {(() => {
                      const count = dailyData.length;
                      const step = count > 1 ? 435 / (count - 1) : 435;
                      const points = dailyData.map((d, index) => {
                        const x = 45 + index * step;
                        const costRatio = d.estimated_cost_usd / maxCost;
                        const y = 170 - costRatio * 150;
                        return { x, y };
                      });

                      const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
                      const areaPath = `${linePath} L ${points[points.length - 1].x} 170 L 45 170 Z`;

                      return (
                        <g>
                          {/* Gradient fill */}
                          <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path d={areaPath} fill="url(#areaGradient)" />
                          <path d={linePath} fill="none" stroke="#10B981" strokeWidth="2.5" />

                          {/* Dots */}
                          {points.map((p, idx) => (
                            <circle
                              key={idx}
                              cx={p.x}
                              cy={p.y}
                              r={3.5}
                              fill="#ffffff"
                              stroke="#10B981"
                              strokeWidth="2"
                            />
                          ))}
                        </g>
                      );
                    })()}
                  </svg>
                </div>

                {/* X Axis Labels */}
                <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "45px", paddingRight: "20px", fontSize: "10px", fontWeight: 700, color: "#64748b" }}>
                  <span>{dailyData[0]?.date || "Bắt đầu"}</span>
                  <span>Giữa kỳ</span>
                  <span>{dailyData[dailyData.length - 1]?.date || "Hôm nay"}</span>
                </div>

                {/* Status Indicator */}
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#10B981", alignItems: "center" }}>
                  <Award size={14} />
                  <span>Tổng chi phí hàng ngày được hiển thị bằng VNĐ quy đổi thời gian thực</span>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--text-light)" }}>
                Chưa có dữ liệu thống kê chi phí.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsView;
