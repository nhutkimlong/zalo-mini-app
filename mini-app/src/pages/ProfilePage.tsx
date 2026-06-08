import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, LogIn, LogOut, Award, Heart, Check, Lock, Edit2, Save, X, Phone, Mail } from "lucide-react";
import { Header, Page } from "zmp-ui";
import api, { TouristPlace, supabase } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export const ProfilePage: React.FC = () => {
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<TouristPlace[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  
  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const prof = await api.getMyProfile();
      setProfile(prof);
      setEditName(prof.name || "");
      setEditPhone(prof.phone || "");
      
      // Fetch favorites and stamps
      const [favs, stps] = await Promise.all([
        api.getMyFavorites(),
        api.getMyStamps()
      ]);
      
      setFavorites(favs);
      setStamps(stps);
    } catch (err) {
      console.warn("[Profile] Failed to fetch logged-in user data:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        fetchProfileData();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) {
        fetchProfileData();
      } else {
        setProfile(null);
        setFavorites([]);
        setStamps([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");
    
    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setAuthMessage("Đăng nhập thành công!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });
        if (error) throw error;
        setAuthMessage("Đăng ký thành công! Hãy đăng nhập.");
        setAuthMode("login");
      }
    } catch (err: any) {
      setAuthError(err.message || "Đã xảy ra lỗi khi xác thực.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    
    const randomId = Math.random().toString(36).substring(7);
    const guestEmail = `guest_${randomId}@nubaden.vn`;
    const guestPassword = "guestPassword123";
    const guestName = `Du khách vãng lai #${randomId.toUpperCase()}`;
    
    try {
      // First try to sign up
      const signUpRes = await supabase.auth.signUp({
        email: guestEmail,
        password: guestPassword,
        options: {
          data: { name: guestName }
        }
      });
      
      if (signUpRes.error) throw signUpRes.error;
      
      // Then sign in
      const signInRes = await supabase.auth.signInWithPassword({
        email: guestEmail,
        password: guestPassword
      });
      
      if (signInRes.error) throw signInRes.error;
      setAuthMessage("Đăng nhập Demo thành công!");
    } catch (err: any) {
      setAuthError(err.message || "Lỗi đăng nhập nhanh.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const updated = await api.updateMyProfile({ name: editName, phone: editPhone });
      setProfile(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert("Lỗi cập nhật hồ sơ: " + err.message);
    } finally {
      setEditLoading(false);
    }
  };


  // Check if a specific place is stamped
  const isPlaceStamped = (slug: string) => {
    return stamps.some(s => s.place_slug === slug);
  };

  if (loading) {
    return (
      <Page>
        <Header title={t("nav.profile")} showBackIcon={false} />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 120px)", color: "var(--primary-navy)" }}>
          <div className="common-loading">{t("common.loading")}</div>
        </div>
      </Page>
    );
  }

  // ─── Logged Out View ───────────────────────────────────────────────────────
  if (!profile) {
    return (
      <Page>
        <Header title={t("nav.profile")} showBackIcon={false} />
        <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div className="glass-card fade-in-up stagger-1" style={{ display: "flex", flexDirection: "column", gap: "16px", borderLeft: "4px solid var(--accent-gold)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--primary-navy)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(212,175,55,0.15)", color: "var(--accent-gold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 800 }}>{t("profile.title")}</h2>
                <p style={{ fontSize: "12px", color: "var(--light-text)" }}>{t("profile.logged_out")}</p>
              </div>
            </div>
            
            <p style={{ fontSize: "13px", color: "var(--light-text)", margin: 0 }}>
              {language === "km" 
                ? "សូមចូលគណនីរបស់អ្នកដើម្បីចូលរួមដំណើរការប្រមូលត្រាសញ្ញាបេតិកភណ្ឌ (Stamp Rally) និងចូលចិត្តទីកន្លែងដែលអ្នកស្រឡាញ់ដើម្បីរក្សាទុកការចងចាំដ៏ល្អរបស់អ្នក!"
                : language === "en"
                  ? "Log in to participate in the Heritage Stamp Rally and save your favorite landmarks to keep beautiful memories!"
                  : "Đăng nhập để tham gia Hành trình sưu tập dấu ấn di sản (Stamp Rally) và thả tim lưu trữ địa danh yêu thích để lưu giữ những kỷ niệm đẹp!"
              }
            </p>
          </div>

          <div className="glass-card fade-in-up stagger-2" style={{ padding: "20px" }}>
            <div style={{ display: "flex", borderBottom: "1px solid rgba(11,37,69,0.1)", marginBottom: "18px" }}>
              <button 
                onClick={() => setAuthMode("login")}
                style={{ 
                  flex: 1, 
                  padding: "10px", 
                  background: "transparent", 
                  border: "none", 
                  fontWeight: 700, 
                  color: authMode === "login" ? "var(--primary-navy)" : "var(--light-text)",
                  borderBottom: authMode === "login" ? "3px solid var(--accent-gold)" : "none",
                  cursor: "pointer"
                }}
              >
                {language === "en" ? "LOG IN" : "ĐĂNG NHẬP"}
              </button>
              <button 
                onClick={() => setAuthMode("signup")}
                style={{ 
                  flex: 1, 
                  padding: "10px", 
                  background: "transparent", 
                  border: "none", 
                  fontWeight: 700, 
                  color: authMode === "signup" ? "var(--primary-navy)" : "var(--light-text)",
                  borderBottom: authMode === "signup" ? "3px solid var(--accent-gold)" : "none",
                  cursor: "pointer"
                }}
              >
                {language === "en" ? "SIGN UP" : "ĐĂNG KÝ KHÁCH"}
              </button>
            </div>

            {authError && (
              <div style={{ padding: "10px", backgroundColor: "rgba(217, 83, 79, 0.1)", color: "var(--alert-red)", borderRadius: "8px", fontSize: "12px", marginBottom: "12px", border: "1px solid rgba(217, 83, 79, 0.2)" }}>
                {authError}
              </div>
            )}

            {authMessage && (
              <div style={{ padding: "10px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "green", borderRadius: "8px", fontSize: "12px", marginBottom: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                {authMessage}
              </div>
            )}

            <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {authMode === "signup" && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "4px", color: "var(--primary-navy)" }}>
                    {language === "en" ? "FULL NAME" : "HỌ VÀ TÊN"}
                  </label>
                  <input 
                    type="text" 
                    className="feedback-input" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder={language === "en" ? "John Doe" : "Nguyễn Văn A"}
                    required 
                  />
                </div>
              )}
              
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "4px", color: "var(--primary-navy)" }}>
                  EMAIL
                </label>
                <input 
                  type="email" 
                  className="feedback-input" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="name@example.com"
                  required 
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, marginBottom: "4px", color: "var(--primary-navy)" }}>
                  {language === "en" ? "PASSWORD" : "MẬT KHẨU"}
                </label>
                <input 
                  type="password" 
                  className="feedback-input" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required 
                />
              </div>

              <button className="submit-btn" type="submit" disabled={authLoading} style={{ marginTop: "8px" }}>
                {authLoading ? "..." : authMode === "login" ? t("profile.login_btn") : t("profile.login_btn")}
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", margin: "16px 0", color: "var(--light-text)", fontSize: "12px" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(0,0,0,0.08)" }} />
              <span style={{ padding: "0 10px" }}>{language === "en" ? "OR" : "HOẶC DÙNG THỬ"}</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(0,0,0,0.08)" }} />
            </div>

            <button 
              onClick={handleGuestLogin} 
              disabled={authLoading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "2px dashed var(--accent-gold)",
                background: "rgba(212, 175, 55, 0.05)",
                color: "var(--primary-navy)",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <LogIn size={16} />
              {language === "en" ? "Log In as Guest / Demo" : "Đăng Nhập Nhanh (Demo)"}
            </button>
          </div>

        </div>
      </Page>
    );
  }

  // ─── Logged In View ────────────────────────────────────────────────────────
  return (
    <Page>
      <Header title={t("nav.profile")} showBackIcon={false} />
      <div className="page-container" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* User Card */}
        <div className="glass-card fade-in-up stagger-1" style={{ display: "flex", flexDirection: "column", gap: "16px", border: "1.5px solid var(--accent-gold)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "var(--primary-navy)",
                color: "var(--accent-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--accent-gold)",
                fontWeight: 800,
                fontSize: "20px"
              }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  profile.name ? profile.name.charAt(0).toUpperCase() : "U"
                )}
              </div>
              
              {!isEditing ? (
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--primary-navy)", margin: 0 }}>
                    {profile.name || "Khách du lịch"}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                    {profile.phone && (
                      <span style={{ fontSize: "12px", color: "var(--light-text)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Phone size={12} /> {profile.phone}
                      </span>
                    )}
                    {profile.email && (
                      <span style={{ fontSize: "12px", color: "var(--light-text)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Mail size={12} /> {profile.email}
                      </span>
                    )}
                  </div>
                  <span className="badge badge-info" style={{ display: "inline-block", marginTop: "8px", fontSize: "10px", padding: "2px 8px", backgroundColor: "rgba(11,37,69,0.06)", color: "var(--primary-navy)", borderRadius: "10px", border: "1px solid rgba(11,37,69,0.1)", fontWeight: 700 }}>
                    {profile.link_type || "Zalo Mini App"}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <input 
                    type="text" 
                    className="feedback-input" 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    placeholder="Họ và tên"
                    style={{ padding: "6px 10px", fontSize: "13px" }}
                    required 
                  />
                  <input 
                    type="text" 
                    className="feedback-input" 
                    value={editPhone} 
                    onChange={e => setEditPhone(e.target.value)} 
                    placeholder="Số điện thoại"
                    style={{ padding: "6px 10px", fontSize: "13px" }}
                  />
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    <button className="submit-btn" type="submit" disabled={editLoading} style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", width: "auto" }}>
                      <Save size={14} /> {language === "en" ? "Save" : "Lưu"}
                    </button>
                    <button type="button" onClick={() => setIsEditing(false)} style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.15)", backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <X size={14} /> {language === "en" ? "Cancel" : "Hủy"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ background: "transparent", border: "none", color: "var(--accent-gold-dark)", cursor: "pointer", padding: "4px" }}
                aria-label={language === "en" ? "Edit Profile" : "Sửa hồ sơ"}
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px dashed rgba(11,37,69,0.1)", paddingTop: "12px" }}>
            <button 
              onClick={handleSignOut}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--alert-red)",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <LogOut size={14} />
              {t("profile.logout_btn")}
            </button>
          </div>
        </div>

        {/* Stamp Rally Collection Card */}
        <div className="glass-card fade-in-up stagger-2">
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-navy)", fontSize: "15px", fontWeight: 800, marginBottom: "4px" }}>
            <Award size={18} style={{ color: "var(--accent-gold)" }} />
            <span>{t("profile.stamps")}</span>
          </h3>
          <p style={{ fontSize: "12px", color: "var(--light-text)", marginBottom: "16px" }}>
            {t("profile.stamps_collected").replace("{count}", stamps.length.toString())}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { slug: "dinh-nui-ba-den-do-cao-986m", name: "Đỉnh Núi", nameEn: "Peak", nameKm: "កំពូលភ្នំ" },
              { slug: "chua-ba-linh-son-tien-thach-tu", name: "Chùa Bà", nameEn: "Temple", nameKm: "វត្តទួល" },
              { slug: "tuong-phat-ba-tay-bo-da-son", name: "Phật Bà", nameEn: "Lady Buddha", nameKm: "ព្រះពុទ្ធបដិមា" }
            ].map((landmark, idx) => {
              const collected = isPlaceStamped(landmark.slug);
              return (
                <div 
                  key={landmark.slug}
                  className={`fade-in-up stagger-${idx + 1}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 8px",
                    borderRadius: "14px",
                    border: `1.5px solid ${collected ? "var(--accent-gold)" : "rgba(11,37,69,0.1)"}`,
                    background: collected ? "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))" : "rgba(0,0,0,0.02)",
                    position: "relative",
                    opacity: collected ? 1 : 0.65,
                    transition: "all 0.3s ease"
                  }}
                >
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: collected ? "var(--accent-gold)" : "#cbd5e1",
                    color: collected ? "var(--primary-navy)" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: collected ? "0 4px 10px rgba(212, 175, 55, 0.3)" : "none",
                    marginBottom: "8px"
                  }}>
                    {collected ? (
                      <Check size={24} style={{ strokeWidth: 3 }} />
                    ) : (
                      <Lock size={18} />
                    )}
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary-navy)", textAlign: "center" }}>
                    {language === "km" ? landmark.nameKm : language === "en" ? landmark.nameEn : landmark.name}
                  </span>
                  <span style={{ fontSize: "9px", color: "var(--light-text)", marginTop: "2px", textTransform: "uppercase", fontWeight: 600 }}>
                    {collected ? "STAMPED" : "LOCKED"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* My Rewards & Vouchers */}
        <div className="glass-card fade-in-up stagger-3">
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-navy)", fontSize: "15px", fontWeight: 800, marginBottom: "12px" }}>
            <Award size={18} style={{ color: "var(--accent-gold)" }} />
            <span>{t("profile.rewards")}</span>
          </h3>

          {stamps.length < 3 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px 8px", backgroundColor: "rgba(11,37,69,0.02)", borderRadius: "12px", border: "1px dashed rgba(0,0,0,0.1)" }}>
              <Lock size={28} style={{ color: "#cbd5e1" }} />
              <p style={{ fontSize: "12px", color: "var(--light-text)", margin: 0, textAlign: "center", lineHeight: "1.5" }}>
                {t("profile.no_rewards")}
              </p>
            </div>
          ) : (
            <div 
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                padding: "16px",
                borderRadius: "12px",
                border: "2px solid var(--accent-gold)",
                background: "linear-gradient(135deg, var(--primary-navy), var(--secondary-blue))",
                color: "var(--cream-white)",
                textAlign: "center"
              }}
            >
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-gold)",
                color: "var(--primary-navy)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "4px"
              }}>
                <Award size={30} />
              </div>
              <h4 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "var(--accent-gold)" }}>
                {language === "en" 
                  ? "HERITAGE JOURNEY COMPLETED" 
                  : language === "km" 
                    ? "បានបញ្ចប់ដំណើរស្វែងរកបេតិកភណ្ឌ" 
                    : "HOÀN THÀNH HÀNH TRÌNH DI SẢN"}
              </h4>
              <p style={{ fontSize: "12px", color: "var(--cream-white)", margin: 0, lineHeight: "1.4" }}>
                {language === "en"
                  ? "Congratulations! You have successfully visited and collected all 3 heritage stamps of Black Lady Mountain. Your journey is now fully preserved in your memory!"
                  : language === "km"
                    ? "សូមអបអរសាទរ! អ្នកបានទៅទស្សនា និងប្រមូលត្រាសញ្ញាបេតិកភណ្ឌទាំង ៣ នៃភ្នំបាដិនដោយជោគជ័យ។ ដំណើររបស់អ្នកត្រូវបានរក្សាទុកយ៉ាងពេញលេញ!"
                    : "Chúc mừng! Bạn đã hoàn thành xuất sắc chuyến tham quan và thu thập đủ 3 dấu ấn di sản linh thiêng của Núi Bà Đen. Hành trình đầy ý nghĩa của bạn đã được lưu giữ trọn vẹn!"
                }
              </p>
            </div>
          )}
        </div>

        {/* Favorite Places List */}
        <div className="glass-card fade-in-up stagger-4">
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-navy)", fontSize: "15px", fontWeight: 800, marginBottom: "12px" }}>
            <Heart size={18} style={{ color: "var(--alert-red)", fill: "var(--alert-red)" }} />
            <span>{t("profile.favorites")}</span>
          </h3>

          {favorites.length === 0 ? (
            <p style={{ fontSize: "12px", color: "var(--light-text)", margin: 0 }}>
              {t("profile.no_favorites")}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {favorites.map((fav) => (
                <Link 
                  key={fav.id}
                  to={`/places/${fav.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    textDecoration: "none",
                    color: "inherit",
                    backgroundColor: "rgba(0,0,0,0.02)",
                    borderRadius: "10px",
                    padding: "8px",
                    border: "1px solid rgba(0,0,0,0.04)"
                  }}
                >
                  <img 
                    src={fav.image_url} 
                    alt={fav.name} 
                    style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover" }} 
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary-navy)", margin: 0 }}>
                      {language === "km" && fav.name_km 
                        ? fav.name_km 
                        : language === "en" && fav.name_en 
                          ? fav.name_en 
                          : fav.name}
                    </h4>
                    <span style={{ fontSize: "11px", color: "var(--light-text)", textTransform: "capitalize" }}>
                      {fav.category.replace("_", " ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </Page>
  );
};

export default ProfilePage;
