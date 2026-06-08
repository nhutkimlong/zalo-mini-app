import React, { useState, useEffect } from "react";
import { Thermometer, Activity, Award, Save, RefreshCw } from "lucide-react";
import { AdminPlace, adminApi } from "../../services/adminApi";

interface RealtimePanelProps {
  places: AdminPlace[];
}

export const RealtimePanel: React.FC<RealtimePanelProps> = ({ places }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [weatherAuto, setWeatherAuto] = useState(true);
  const [weatherStatus, setWeatherStatus] = useState("sunny");
  const [weatherTemp, setWeatherTemp] = useState(30);
  const [cablePeakQueue, setCablePeakQueue] = useState("low");
  const [cablePeakWait, setCablePeakWait] = useState(5);
  const [cableTempleQueue, setCableTempleQueue] = useState("medium");
  const [cableTempleWait, setCableTempleWait] = useState(15);

  // Analytics states
  const [checkins, setCheckins] = useState<Array<{ place_slug: string; created_at: string }>>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [realtimeRes, stampsRes] = await Promise.all([
        adminApi.getRealtimeStatus(),
        adminApi.getAllStamps()
      ]);

      setWeatherAuto(realtimeRes.weather_auto);
      setWeatherStatus(realtimeRes.weather_status);
      setWeatherTemp(realtimeRes.weather_temp);
      setCablePeakQueue(realtimeRes.cable_peak_queue);
      setCablePeakWait(realtimeRes.cable_peak_wait_time);
      setCableTempleQueue(realtimeRes.cable_temple_queue);
      setCableTempleWait(realtimeRes.cable_temple_wait_time);
      setCheckins(stampsRes);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Lỗi tải thông tin thực địa từ server." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await adminApi.updateRealtimeStatus({
        weather_auto: weatherAuto,
        weather_status: weatherStatus,
        weather_temp: weatherTemp,
        cable_peak_queue: cablePeakQueue,
        cable_peak_wait_time: cablePeakWait,
        cable_temple_queue: cableTempleQueue,
        cable_temple_wait_time: cableTempleWait
      });
      setMessage({ type: "success", text: res.message || "Cập nhật thành công!" });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Không thể lưu thông tin thực địa." });
    } finally {
      setSaving(false);
    }
  };

  // Calculate checkin stats per place
  const statsMap = checkins.reduce((acc, c) => {
    acc[c.place_slug] = (acc[c.place_slug] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalCheckins = checkins.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Real-time Field Settings Form */}
      <div className="panel-card" style={{ borderLeft: "4px solid var(--accent-gold)" }}>
        <div className="panel-header" style={{ marginBottom: "20px" }}>
          <div className="panel-title" style={{ fontSize: "18px" }}>
            <Activity size={20} style={{ color: "var(--accent-gold)" }} />
            <span>Điều Phối Trạng Thái Thực Địa (Thời Gian Thực)</span>
          </div>
          <button 
            type="button"
            className="btn btn-secondary btn-xs" 
            onClick={fetchData}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={12} />
            Làm mới
          </button>
        </div>

        {message && (
          <div 
            style={{
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              backgroundColor: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
              color: message.type === "success" ? "var(--success)" : "var(--danger)"
            }}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-light)" }}>
            Đang tải dữ liệu thực địa…
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
              
              {/* Weather block */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary-navy)", borderBottom: "1px dashed var(--border-slate)", paddingBottom: "6px" }}>
                  1. Trạng Thái Thời Tiết Đỉnh Núi
                </h4>
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(11,37,69,0.03)", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-slate)" }}>
                  <input
                    type="checkbox"
                    id="weather-auto-toggle"
                    checked={weatherAuto}
                    onChange={(e) => setWeatherAuto(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--accent-gold)", cursor: "pointer" }}
                  />
                  <label htmlFor="weather-auto-toggle" style={{ fontWeight: 600, cursor: "pointer", color: "var(--text-dark)", fontSize: "12px" }}>
                    Tự động đồng bộ thời tiết qua Open-Meteo API
                  </label>
                </div>

                {weatherAuto && (
                  <div style={{ fontSize: "12px", color: "var(--success)", fontWeight: 500, backgroundColor: "rgba(16,185,129,0.06)", padding: "8px 12px", borderRadius: "6px", border: "1px dashed rgba(16,185,129,0.2)" }}>
                    ✓ Đang lấy thời tiết tự động theo thời gian thực tại đỉnh Núi Bà Đen từ Open-Meteo. Bạn không cần thiết lập thủ công.
                  </div>
                )}

                <div style={{ opacity: weatherAuto ? 0.5 : 1, transition: "opacity 0.2s ease" }}>
                  <label className="form-label" style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Thời tiết hiện tại:</label>
                  <select 
                    className="form-input" 
                    value={weatherStatus} 
                    onChange={(e) => setWeatherStatus(e.target.value)}
                    style={{ width: "100%" }}
                    disabled={weatherAuto}
                  >
                    <option value="sunny">☀️ Nắng ráo (Sunny)</option>
                    <option value="cloudy">☁️ Nhiều mây / Sương mù (Cloudy)</option>
                    <option value="rainy">🌧️ Mưa lâm râm (Rainy)</option>
                    <option value="windy">💨 Gió lớn / Lốc xoáy (Windy)</option>
                  </select>
                </div>

                <div style={{ opacity: weatherAuto ? 0.5 : 1, transition: "opacity 0.2s ease" }}>
                  <label className="form-label" style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>
                    Nhiệt độ đo được: <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>{weatherTemp}°C</span>
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Thermometer size={20} style={{ color: "var(--text-light)" }} />
                    <input 
                      type="range" 
                      min="15" 
                      max="40" 
                      value={weatherTemp} 
                      onChange={(e) => setWeatherTemp(parseInt(e.target.value))}
                      style={{ flex: 1, accentColor: "var(--accent-gold)" }}
                      disabled={weatherAuto}
                    />
                  </div>
                </div>
              </div>

              {/* Cable car queues block */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary-navy)", borderBottom: "1px dashed var(--border-slate)", paddingBottom: "6px" }}>
                  2. Trạng Thái Hàng Đợi Các Tuyến Cáp Treo
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Tuyến Vân Sơn (Đỉnh):</label>
                    <select 
                      className="form-input" 
                      value={cablePeakQueue} 
                      onChange={(e) => setCablePeakQueue(e.target.value)}
                      style={{ width: "100%" }}
                    >
                      <option value="low">🟢 Thưa thớt (Vắng)</option>
                      <option value="medium">🟡 Vừa phải (Bình thường)</option>
                      <option value="high">🔴 Đông đúc (Chờ lâu)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Chờ dự kiến (phút):</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="0" 
                      max="120"
                      value={cablePeakWait} 
                      onChange={(e) => setCablePeakWait(parseInt(e.target.value) || 0)}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Tuyến Chùa Hang (Chùa):</label>
                    <select 
                      className="form-input" 
                      value={cableTempleQueue} 
                      onChange={(e) => setCableTempleQueue(e.target.value)}
                      style={{ width: "100%" }}
                    >
                      <option value="low">🟢 Thưa thớt (Vắng)</option>
                      <option value="medium">🟡 Vừa phải (Bình thường)</option>
                      <option value="high">🔴 Đông đúc (Chờ lâu)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontWeight: 600 }}>Chờ dự kiến (phút):</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="0" 
                      max="120"
                      value={cableTempleWait} 
                      onChange={(e) => setCableTempleWait(parseInt(e.target.value) || 0)}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

              </div>

            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" type="submit" disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <Save size={16} />
                <span>{saving ? "Đang lưu…" : "Lưu Trạng Thái Thực Địa"}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stamp Rally Analytics */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title" style={{ fontSize: "18px" }}>
            <Award size={20} style={{ color: "var(--accent-gold)" }} />
            <span>Thống Kê Sưu Tập Dấu Ấn Di Sản (Stamp Rally)</span>
          </div>
          <span className="badge badge-info" style={{ padding: "4px 10px", fontSize: "12px", backgroundColor: "rgba(11,37,69,0.06)", color: "var(--primary-navy)", border: "1px solid rgba(11,37,69,0.12)" }}>
            Tổng lượt check-in: {totalCheckins}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-light)" }}>
            Đang tải thống kê…
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
            
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "40%" }}>Địa danh</th>
                    <th style={{ width: "40%" }}>Phân bố Check-in (Tỉ lệ)</th>
                    <th style={{ width: "20%", textAlign: "right" }}>Số lượt check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {places.map((place) => {
                    const count = statsMap[place.slug] || 0;
                    const pct = totalCheckins > 0 ? (count / totalCheckins) * 100 : 0;
                    return (
                      <tr key={place.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: "var(--primary-navy)" }}>{place.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-light)" }}>Slug: {place.slug}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ flex: 1, height: "10px", backgroundColor: "#f1f5f9", borderRadius: "5px", overflow: "hidden" }}>
                              <div style={{
                                width: `${pct}%`,
                                height: "100%",
                                backgroundColor: count > 0 ? "var(--accent-gold)" : "#cbd5e1",
                                borderRadius: "5px",
                                transition: "width 0.5s ease"
                              }} />
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-light)", width: "36px", textAlign: "right" }}>
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, fontSize: "15px", color: "var(--primary-navy)" }}>
                          {count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
