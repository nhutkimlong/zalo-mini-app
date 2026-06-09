import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { User, LogIn, LogOut, Award, Heart, Check, Lock, Edit2, Save, X, Phone, Mail, Camera } from "lucide-react";
import { Header, Page } from "zmp-ui";
import api, { TouristPlace, supabase } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export const ProfilePage: React.FC = () => {
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<TouristPlace[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [allPlaces, setAllPlaces] = useState<TouristPlace[]>([]);
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

  // Avatar and Password states
  const [avatarLoading, setAvatarLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const prof = await api.getMyProfile();
      setProfile(prof);
      setEditName(prof ? prof.name || "" : "");
      setEditPhone(prof ? prof.phone || "" : "");
      
      // Fetch favorites, stamps, itineraries, badge rules, leaderboard, and all places concurrently (instant Direct Supabase)
      const [favs, stps, itins, bdgs, ldrbd, pls] = await Promise.all([
        api.getMyFavorites(),
        api.getMyStamps(),
        api.getMyItineraries(),
        api.getBadges(),
        api.getLeaderboard(),
        api.getPlaces()
      ]);
      
      setFavorites(favs);
      setStamps(stps);
      setItineraries(itins);
      setBadges(bdgs);
      setLeaderboard(ldrbd);
      setAllPlaces(pls);
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
        const signUpRes = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });
        if (signUpRes.error) throw signUpRes.error;
        
        // If not logged in immediately (no session), auto sign in
        if (!signUpRes.data.session) {
          const signInRes = await supabase.auth.signInWithPassword({ email, password });
          if (signInRes.error) throw signInRes.error;
        }
        
        setAuthMessage("Đăng ký và đăng nhập thành công!");
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
      // 1. Update Profile fields
      const updated = await api.updateMyProfile({ name: editName, phone: editPhone });
      setProfile(updated);
      
      // 2. Optional Password Update
      if (showPasswordChange) {
        if (newPassword.length < 6) {
          alert(language === "en" ? "Password must be at least 6 characters." : "Mật khẩu mới phải từ 6 ký tự trở lên.");
          setEditLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          alert(language === "en" ? "Passwords do not match." : "Mật khẩu xác nhận không khớp.");
          setEditLoading(false);
          return;
        }
        
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        
        alert(language === "en" ? "Password updated successfully!" : "Đổi mật khẩu thành công!");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordChange(false);
      }
      
      setIsEditing(false);
    } catch (err: any) {
      alert((language === "en" ? "Error" : "Lỗi") + ": " + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const res = await api.uploadAvatar(file);
      setProfile((prev: any) => ({ ...prev, avatar_url: res.avatar_url }));
    } catch (err: any) {
      alert("Lỗi tải ảnh đại diện: " + err.message);
    } finally {
      setAvatarLoading(false);
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

  // Gamification stats calculation dynamically from database rules
  const stampsCount = stamps.length;
  const favoritesCount = favorites.length;
  const itinerariesCount = itineraries.length;
  
  const xp = (stampsCount * 1000) + (favoritesCount * 100) + (itinerariesCount * 200);
  
  let level = 1;
  let title = language === "km" ? "អ្នកដំណើរមកពីចម្ងាយ" : language === "en" ? "Wanderer from Afar" : "Lữ Khách Phương Xa";
  let nextLevelXp = 1000;
  
  if (badges && badges.length > 0) {
    const sortedBadges = [...badges].sort((a, b) => a.xp_required - b.xp_required);
    
    let currentBadgeIndex = -1;
    for (let i = 0; i < sortedBadges.length; i++) {
      if (xp >= sortedBadges[i].xp_required) {
        currentBadgeIndex = i;
      }
    }
    
    if (currentBadgeIndex !== -1) {
      const activeBadge = sortedBadges[currentBadgeIndex];
      level = currentBadgeIndex + 1;
      title = language === "km" && activeBadge.title_km 
        ? activeBadge.title_km 
        : language === "en" && activeBadge.title_en 
          ? activeBadge.title_en 
          : activeBadge.title;
      
      if (currentBadgeIndex + 1 < sortedBadges.length) {
        nextLevelXp = sortedBadges[currentBadgeIndex + 1].xp_required;
      } else {
        nextLevelXp = activeBadge.xp_required;
      }
    } else if (sortedBadges.length > 0) {
      nextLevelXp = sortedBadges[0].xp_required || 1000;
    }
  }

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case "tam_linh": return t("places.tam_linh");
      case "phong_canh": return t("places.phong_canh");
      case "dich_vu": return t("places.dich_vu");
      default: return cat.replace("_", " ");
    }
  };

  return (
    <Page>
      <Header title={t("nav.profile")} showBackIcon={false} />
      <div className="page-container" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Hidden Avatar input */}
        <input 
          type="file" 
          ref={avatarInputRef} 
          onChange={handleAvatarChange} 
          accept="image/*" 
          style={{ display: "none" }} 
        />

        {/* User Card */}
        <div className="glass-card fade-in-up stagger-1" style={{ display: "flex", flexDirection: "column", gap: "16px", border: "1.5px solid var(--accent-gold)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%" }}>
              
              {/* Interactive Avatar Container */}
              <div 
                onClick={() => !avatarLoading && avatarInputRef.current?.click()}
                style={{
                  position: "relative",
                  cursor: avatarLoading ? "default" : "pointer",
                  transition: "all 0.2s"
                }}
                title={language === "en" ? "Change Avatar" : "Đổi ảnh đại diện"}
              >
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
                  fontSize: "20px",
                  overflow: "hidden"
                }}>
                  {avatarLoading ? (
                    <div style={{ fontSize: "10px", color: "var(--accent-gold)" }}>...</div>
                  ) : profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    profile.name ? profile.name.charAt(0).toUpperCase() : "U"
                  )}
                </div>
                {!avatarLoading && (
                  <div style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-2px",
                    backgroundColor: "var(--accent-gold)",
                    color: "var(--primary-navy)",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1.5px solid white",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
                  }}>
                    <Camera size={10} style={{ strokeWidth: 3 }} />
                  </div>
                )}
              </div>
              
              {!isEditing ? (
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--primary-navy)", margin: 0 }}>
                    {profile.name || (language === "en" ? "Guest Tourist" : language === "km" ? "ភ្ញៀវទេសចរ" : "Khách du lịch")}
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
                    placeholder={language === "en" ? "Full name" : language === "km" ? "ឈ្មោះពេញ" : "Họ và tên"}
                    style={{ padding: "6px 10px", fontSize: "13px" }}
                    required 
                  />
                  <input 
                    type="text" 
                    className="feedback-input" 
                    value={editPhone} 
                    onChange={e => setEditPhone(e.target.value)} 
                    placeholder={language === "en" ? "Phone number" : language === "km" ? "លេខទូរស័ព្ទ" : "Số điện thoại"}
                    style={{ padding: "6px 10px", fontSize: "13px" }}
                  />
                  
                  {/* Collapsible Password Change Section */}
                  <div style={{ marginTop: "6px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--primary-navy)", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={showPasswordChange} 
                        onChange={e => setShowPasswordChange(e.target.checked)} 
                      />
                      <span>{language === "en" ? "Change password" : language === "km" ? "ប្តូរលេខសម្ងាត់" : "Đổi mật khẩu"}</span>
                    </label>
                    
                    {showPasswordChange && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", paddingLeft: "16px", borderLeft: "2px solid var(--accent-gold)" }}>
                        <input 
                          type="password" 
                          className="feedback-input" 
                          value={newPassword} 
                          onChange={e => setNewPassword(e.target.value)} 
                          placeholder={language === "en" ? "New password (min 6 chars)" : language === "km" ? "លេខសម្ងាត់ថ្មី (យ៉ាងហោចណាស់ ៦ ខ្ទង់)" : "Mật khẩu mới (tối thiểu 6 ký tự)"}
                          style={{ padding: "6px 10px", fontSize: "12px" }}
                          required={showPasswordChange}
                        />
                        <input 
                          type="password" 
                          className="feedback-input" 
                          value={confirmPassword} 
                          onChange={e => setConfirmPassword(e.target.value)} 
                          placeholder={language === "en" ? "Confirm new password" : language === "km" ? "បញ្ជាក់លេខសម្ងាត់ថ្មី" : "Nhập lại mật khẩu mới"}
                          style={{ padding: "6px 10px", fontSize: "12px" }}
                          required={showPasswordChange}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                    <button className="submit-btn" type="submit" disabled={editLoading} style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", width: "auto" }}>
                      <Save size={14} /> {language === "en" ? "Save" : language === "km" ? "រក្សាទុក" : "Lưu"}
                    </button>
                    <button type="button" onClick={() => { setIsEditing(false); setShowPasswordChange(false); }} style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.15)", backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <X size={14} /> {language === "en" ? "Cancel" : language === "km" ? "បោះបង់" : "Hủy"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ background: "transparent", border: "none", color: "var(--accent-gold-dark)", cursor: "pointer", padding: "4px" }}
                aria-label={language === "en" ? "Edit Profile" : language === "km" ? "កែសម្រួលព័ត៌មាន" : "Sửa hồ sơ"}
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          {/* Gamification Stats Block (Premium UI) */}
          {profile && (
            <div style={{
              marginTop: "4px",
              padding: "12px",
              backgroundColor: "rgba(11,37,69,0.03)",
              borderRadius: "12px",
              border: "1px solid rgba(212,175,55,0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              {/* Title & Level */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Award size={16} style={{ color: "var(--accent-gold)" }} />
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--primary-navy)" }}>
                    {title}
                  </span>
                </div>
                <span style={{ 
                  fontSize: "11px", 
                  fontWeight: 800, 
                  color: "var(--primary-navy)",
                  backgroundColor: "rgba(212,175,55,0.15)",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border: "1px solid var(--accent-gold)"
                }}>
                  {language === "en" ? `Level ${level}` : language === "km" ? `កម្រិត ${level}` : `Cấp ${level}`}
                </span>
              </div>
              
              {/* XP Progress Bar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 700, color: "var(--light-text)" }}>
                  <span>XP: {xp} / {nextLevelXp}</span>
                  <span>{Math.round((xp / nextLevelXp) * 100)}%</span>
                </div>
                <div style={{ 
                  width: "100%", 
                  height: "8px", 
                  backgroundColor: "rgba(0,0,0,0.05)", 
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div style={{ 
                    width: `${Math.min(100, (xp / nextLevelXp) * 100)}%`, 
                    height: "100%", 
                    background: "linear-gradient(90deg, var(--accent-gold), #eab308)",
                    borderRadius: "4px",
                    transition: "width 0.5s ease-out"
                  }} />
                </div>
              </div>

              {/* Detailed Achievements counts */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(3, 1fr)", 
                gap: "8px", 
                fontSize: "10px", 
                fontWeight: 700, 
                color: "var(--primary-navy)",
                textAlign: "center",
                marginTop: "4px",
                borderTop: "1px dashed rgba(11,37,69,0.08)",
                paddingTop: "6px"
              }}>
                <div>
                  <span style={{ display: "block", fontSize: "12px", fontWeight: 850, color: "var(--accent-gold-dark)" }}>{stampsCount}/{allPlaces.length}</span>
                  <span style={{ color: "var(--light-text)" }}>{language === "en" ? "Stamps" : language === "km" ? "ត្រាសញ្ញា" : "Dấu ấn"}</span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "12px", fontWeight: 850, color: "var(--accent-gold-dark)" }}>{favoritesCount}</span>
                  <span style={{ color: "var(--light-text)" }}>{language === "en" ? "Favorites" : language === "km" ? "ចូលចិត្ត" : "Yêu thích"}</span>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "12px", fontWeight: 850, color: "var(--accent-gold-dark)" }}>{itinerariesCount}</span>
                  <span style={{ color: "var(--light-text)" }}>{language === "en" ? "Itineraries" : language === "km" ? "កម្មវិធីដំណើរ" : "Lịch trình"}</span>
                </div>
              </div>
              
              {/* How to level up tip */}
              <div style={{ 
                fontSize: "9px", 
                color: "var(--light-text)", 
                fontStyle: "italic", 
                textAlign: "center",
                marginTop: "2px"
              }}>
                {language === "en" 
                  ? "* Stamps = 1000 XP | Favorites = 100 XP | Itineraries = 200 XP" 
                  : language === "km"
                    ? "* ត្រាសញ្ញា = 1000 XP | ចូលចិត្ត = 100 XP | កម្មវិធីដំណើរ = 200 XP"
                    : "* Dấu ấn = 1000 XP | Yêu thích = 100 XP | Lịch trình = 200 XP"}
              </div>
            </div>
          )}

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
            {language === "en" 
              ? `Collected ${stamps.length}/${allPlaces.length} heritage stamps`
              : language === "km"
                ? `ប្រមូលបាន ${stamps.length}/${allPlaces.length} ត្រា`
                : `Đã tích lũy được ${stamps.length}/${allPlaces.length} dấu ấn`}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {allPlaces.map((place, idx) => {
              const collected = isPlaceStamped(place.slug);
              const localizedName = language === "km" && place.name_km 
                ? place.name_km 
                : language === "en" && place.name_en 
                  ? place.name_en 
                  : place.name;
              
              const displayName = localizedName.length > 18 
                ? localizedName.substring(0, 15) + "..." 
                : localizedName;

              return (
                <div 
                  key={place.id}
                  className={`fade-in-up stagger-${idx % 3 + 1}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "12px 6px",
                    borderRadius: "14px",
                    border: `1.5px solid ${collected ? "var(--accent-gold)" : "rgba(11,37,69,0.1)"}`,
                    background: collected ? "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))" : "rgba(0,0,0,0.02)",
                    position: "relative",
                    opacity: collected ? 1 : 0.65,
                    transition: "all 0.3s ease"
                  }}
                  title={localizedName}
                >
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: collected ? "var(--accent-gold)" : "#cbd5e1",
                    color: collected ? "var(--primary-navy)" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: collected ? "0 4px 8px rgba(212, 175, 55, 0.2)" : "none",
                    marginBottom: "6px"
                  }}>
                    {collected ? (
                      <Check size={20} style={{ strokeWidth: 3 }} />
                    ) : (
                      <Lock size={14} />
                    )}
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--primary-navy)", textAlign: "center", minHeight: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {displayName}
                  </span>
                  <span style={{ fontSize: "8px", color: "var(--light-text)", marginTop: "2px", textTransform: "uppercase", fontWeight: 650 }}>
                    {collected ? (language === "en" ? "STAMPED" : language === "km" ? "បានទទួល" : "ĐÃ CÓ") : (language === "en" ? "LOCKED" : language === "km" ? "មិនទាន់មាន" : "CHƯA CÓ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Heritage Journey Completed - Congrats Card */}
        {stamps.length >= 3 && (
          <div 
            className="glass-card fade-in-up" 
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              padding: "16px",
              borderRadius: "14px",
              border: "2.5px solid var(--accent-gold)",
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
                ? "HERITAGE JOURNEY PROGRESS" 
                : language === "km" 
                  ? "វឌ្ឍនភាពធ្វើដំណើរ" 
                  : "HÀNH TRÌNH DI SẢN XUẤT SẮC"}
            </h4>
            <p style={{ fontSize: "12px", color: "var(--cream-white)", margin: 0, lineHeight: "1.4" }}>
              {language === "en"
                ? `Congratulations! You have successfully visited and collected ${stamps.length} heritage stamps. Your journey is now preserved in your memory!`
                : language === "km"
                  ? `សូមអបអរសាទរ! អ្នកបានទៅទស្សនា និងប្រមូលត្រា ${stamps.length} ដោយជោគជ័យ។ ដំណើររបស់អ្នកត្រូវបានរក្សាទុក!`
                  : `Chúc mừng! Bạn đã hoàn thành xuất sắc và thu thập được ${stamps.length} dấu ấn di sản linh thiêng. Hành trình đầy ý nghĩa của bạn đã được lưu giữ trọn vẹn!`
              }
            </p>
          </div>
        )}

        {/* Heritage Explorer Leaderboard */}
        <div className="glass-card fade-in-up stagger-3">
          <h3 style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-navy)", fontSize: "15px", fontWeight: 800, marginBottom: "4px" }}>
            <Award size={18} style={{ color: "var(--accent-gold)" }} />
            <span>
              {language === "en" ? "Explorer Leaderboard" : language === "km" ? "តារាងពិន្ទុអ្នករុករក" : "Bảng Xếp Hạng Lữ Khách"}
            </span>
          </h3>
          <p style={{ fontSize: "11px", color: "var(--light-text)", marginBottom: "16px" }}>
            {language === "en" 
              ? "Top explorers based on stamps, favorites and itineraries" 
              : language === "km"
                ? "អ្នករុករកកំពូលផ្អែកលើត្រា ចំណូលចិត្ត និងការធ្វើដំណើរ"
                : "Top lữ khách tích cực khám phá, check-in di sản và thiết kế lộ trình"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {leaderboard.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--light-text)", margin: 0, textAlign: "center", fontStyle: "italic" }}>
                {language === "en" ? "No leaderboard data" : "Chưa có dữ liệu bảng xếp hạng"}
              </p>
            ) : (
              leaderboard.map((item, idx) => {
                const isCurrentUser = profile && item.id === profile.id;
                const rank = idx + 1;
                let rankBadgeColor = "";
                let rankTextColor = "var(--primary-navy)";
                if (rank === 1) { rankBadgeColor = "#ffd700"; rankTextColor = "#856404"; }
                else if (rank === 2) { rankBadgeColor = "#c0c0c0"; rankTextColor = "#495057"; }
                else if (rank === 3) { rankBadgeColor = "#cd7f32"; rankTextColor = "#721c24"; }

                return (
                  <div 
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      backgroundColor: isCurrentUser ? "rgba(212,175,55,0.12)" : "rgba(0,0,0,0.02)",
                      border: isCurrentUser ? "1.5px solid var(--accent-gold)" : "1px solid rgba(0,0,0,0.04)",
                      boxShadow: isCurrentUser ? "0 2px 8px rgba(212,175,55,0.15)" : "none",
                      transition: "all 0.2s"
                    }}
                  >
                    {/* Rank number or medal */}
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: rankBadgeColor || "transparent",
                      color: rankBadgeColor ? rankTextColor : "var(--light-text)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "12px",
                      flexShrink: 0
                    }}>
                      {rank}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: isCurrentUser ? "var(--accent-gold)" : "var(--primary-navy)",
                      color: isCurrentUser ? "var(--primary-navy)" : "var(--accent-gold)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "13px",
                      border: "1.5px solid var(--accent-gold)",
                      overflow: "hidden",
                      flexShrink: 0
                    }}>
                      {item.avatar_url ? (
                        <img src={item.avatar_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        item.name ? item.name.charAt(0).toUpperCase() : "U"
                      )}
                    </div>

                    {/* User details */}
                    <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <div style={{ 
                        fontSize: "13px", 
                        fontWeight: isCurrentUser ? 800 : 700, 
                        color: "var(--primary-navy)" 
                      }}>
                        {item.name || (language === "en" ? "Guest Tourist" : language === "km" ? "ភ្ញៀវទេសចរ" : "Khách du lịch")} {isCurrentUser && (language === "en" ? " (You)" : language === "km" ? " (អ្នក)" : " (Bạn)")}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--light-text)", display: "flex", gap: "8px", marginTop: "2px" }}>
                        <span>🏆 {item.stamps_count} {language === "en" ? "stamps" : language === "km" ? "ត្រា" : "dấu ấn"}</span>
                        <span>❤️ {item.favorites_count}</span>
                      </div>
                    </div>

                    {/* XP score */}
                    <div style={{ 
                      fontSize: "13px", 
                      fontWeight: 800, 
                      color: "var(--accent-gold-dark)",
                      flexShrink: 0
                    }}>
                      {item.total_xp.toLocaleString()} XP
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
                    <span style={{ fontSize: "11px", color: "var(--light-text)" }}>
                      {getCategoryName(fav.category)}
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
