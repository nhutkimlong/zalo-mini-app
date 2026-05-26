import React, { useState } from "react";
import { Lock, LogIn, AlertCircle } from "lucide-react";
import adminApi from "../services/adminApi";

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu quản trị");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.login(password);
      if (response.token) {
        onLoginSuccess(response.token);
      } else {
        setError("Đăng nhập thất bại");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Mật khẩu quản trị không chính xác hoặc lỗi kết nối server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #020c1b 0%, #0c2340 100%)",
        padding: "20px",
        fontFamily: "inherit"
      }}
    >
      <div 
        className="glass-card" 
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "rgba(10, 25, 47, 0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(212, 175, 55, 0.2)",
          borderRadius: "16px",
          padding: "40px 30px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.05)",
          textAlign: "center"
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <div style={{
            padding: "8px",
            borderRadius: "16px",
            border: "2px solid #D4AF37",
            backgroundColor: "rgba(6, 21, 42, 0.8)",
            boxShadow: "0 0 20px rgba(212, 175, 55, 0.3)"
          }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "10px",
                objectFit: "cover"
              }} 
              onError={(e) => {
                // If local image fails to load, hide or replace with default text
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        </div>

        <h1 style={{
          fontSize: "20px",
          fontWeight: 800,
          color: "#D4AF37",
          margin: "0 0 8px 0",
          letterSpacing: "1px",
          textTransform: "uppercase"
        }}>
          Núi Bà Đen Admin
        </h1>
        <p style={{
          fontSize: "13px",
          color: "rgba(255, 255, 255, 0.6)",
          margin: "0 0 30px 0"
        }}>
          Hệ thống Quản trị Trợ lý Du lịch Số
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
          <div style={{ marginBottom: "20px" }}>
            <label 
              htmlFor="password" 
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.8)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Mật khẩu quản trị
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255, 255, 255, 0.4)",
                display: "flex",
                alignItems: "center"
              }}>
                <Lock size={16} />
              </span>
              <input 
                id="password"
                type="password" 
                placeholder="Nhập mật khẩu..." 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 42px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#D4AF37";
                  e.target.style.boxShadow = "0 0 8px rgba(212, 175, 55, 0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {error && (
            <div 
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
                padding: "12px",
                backgroundColor: "rgba(217, 83, 79, 0.1)",
                border: "1px solid rgba(217, 83, 79, 0.3)",
                borderRadius: "8px",
                color: "#ff6b6b",
                fontSize: "12px",
                marginBottom: "20px",
                lineHeight: "1.4"
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)",
              color: "#06152a",
              fontWeight: 700,
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 15px rgba(212, 175, 55, 0.2)",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(212, 175, 55, 0.3)";
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(212, 175, 55, 0.2)";
            }}
          >
            {loading ? (
              <span className="spinner" style={{ width: "16px", height: "16px", border: "2px solid #06152a", borderTopColor: "transparent", margin: 0 }}></span>
            ) : (
              <>
                <LogIn size={16} />
                <span>Đăng nhập hệ thống</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
