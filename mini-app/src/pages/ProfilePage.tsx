import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { User, LogOut, Award, Heart, Check, Lock, Edit2, Save, X, Phone, Mail, Camera } from "lucide-react";
import { Header, Page } from "../components/WebPrimitives";
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
  const [authFieldErrors, setAuthFieldErrors] = useState<Record<string, string>>({});
  const [profileNotice, setProfileNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
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

  const authSubmitLabel = authLoading
    ? language === "en" ? "Processing..." : "Đang xử lý..."
    : authMode === "login"
      ? language === "en" ? "Log In" : "Đăng nhập"
      : language === "en" ? "Create Account" : "Tạo tài khoản";

  const switchAuthMode = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthError("");
    setAuthMessage("");
    setAuthFieldErrors({});
  };

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const prof = await api.getMyProfile();
      setProfile(prof);
      setEditName(prof ? prof.name || "" : "");
      setEditPhone(prof ? prof.phone || "" : "");
      
      // Fetch favorites, stamps, itineraries, badge rules, leaderboard, and all places concurrently
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
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const nextErrors: Record<string, string> = {};

    if (authMode === "signup" && trimmedName.length < 2) {
      nextErrors.name = language === "en" ? "Enter your full name." : "Vui lòng nhập họ và tên.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = language === "en" ? "Enter a valid email address." : "Email chưa đúng định dạng.";
    }

    if (password.length < 6) {
      nextErrors.password = language === "en" ? "Password must be at least 6 characters." : "Mật khẩu tối thiểu 6 ký tự.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setAuthFieldErrors(nextErrors);
      setAuthError(language === "en" ? "Please check the highlighted fields." : "Vui lòng kiểm tra các trường được đánh dấu.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");
    setAuthFieldErrors({});
    
    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
        if (error) throw error;
        setAuthMessage("Đăng nhập thành công!");
      } else {
        const signUpRes = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { name: trimmedName }
          }
        });
        if (signUpRes.error) throw signUpRes.error;
        
        if (!signUpRes.data.session) {
          setAuthMode("login");
          setAuthMessage(language === "en"
            ? "Account created. Please check your email if confirmation is required, then log in."
            : "Tài khoản đã được tạo. Nếu hệ thống yêu cầu xác nhận, vui lòng kiểm tra email rồi đăng nhập.");
          return;
        }
        
        setAuthMessage("Đăng ký và đăng nhập thành công!");
      }
    } catch (err: any) {
      setAuthError(err.message || "Đã xảy ra lỗi khi xác thực.");
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
    setProfileNotice(null);
    
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
      setProfileNotice({ type: "success", message: language === "en" ? "Profile updated successfully." : "Đã cập nhật hồ sơ." });
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
      setProfileNotice({ type: "success", message: language === "en" ? "Avatar updated." : "Đã cập nhật ảnh đại diện." });
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

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case "tam_linh": return t("places.tam_linh");
      case "phong_canh": return t("places.phong_canh");
      case "dich_vu": return t("places.dich_vu");
      default: return cat.replace("_", " ");
    }
  };

  if (loading) {
    return (
      <Page>
        <Header title={t("nav.profile")} showBackIcon={false} />
        <div className="profile-loading-box">
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
        <div className="profile-logged-out-wrapper">
          
          <div className="glass-card fade-in-up stagger-1 profile-intro-card">
            <div className="profile-intro-header">
              <div className="profile-intro-icon-circle">
                <User size={20} />
              </div>
              <div>
                <h2 className="profile-intro-title">{t("profile.title")}</h2>
                <p className="profile-intro-subtitle">{t("profile.logged_out")}</p>
              </div>
            </div>
            
            <p className="profile-intro-desc">
              {language === "km" 
                ? "សូមចូលគណនីរបស់អ្នកដើម្បីចូលរួមដំណើរការប្រមូលត្រាសញ្ញាបេតិកភណ្ឌ (Stamp Rally) និងចូលចិត្តទីកន្លែងដែលអ្នកស្រឡាញ់ដើម្បីរក្សាទុកការចងចាំដ៏ល្អរបស់អ្នក!"
                : language === "en"
                  ? "Log in to participate in the Heritage Stamp Rally and save your favorite landmarks to keep beautiful memories!"
                  : "Đăng nhập để tham gia Hành trình sưu tập dấu ấn di sản (Stamp Rally) và thả tim lưu trữ địa danh yêu thích để lưu giữ những kỷ niệm đẹp!"
              }
            </p>
          </div>

          <div className="glass-card fade-in-up stagger-2 profile-auth-card">
            <div className="profile-auth-tabs">
              <button 
                type="button"
                onClick={() => switchAuthMode("login")}
                className={`profile-auth-tab-btn ${authMode === "login" ? "is-active" : ""}`}
              >
                {language === "en" ? "LOG IN" : "ĐĂNG NHẬP"}
              </button>
              <button 
                type="button"
                onClick={() => switchAuthMode("signup")}
                className={`profile-auth-tab-btn ${authMode === "signup" ? "is-active" : ""}`}
              >
                {language === "en" ? "SIGN UP" : "ĐĂNG KÝ KHÁCH"}
              </button>
            </div>

            {authError && (
              <div className="profile-auth-form-error" role="alert" aria-live="polite">
                {authError}
              </div>
            )}

            {authMessage && (
              <div className="profile-auth-form-message" role="status" aria-live="polite">
                {authMessage}
              </div>
            )}

            <form onSubmit={handleAuth} className="profile-auth-form" noValidate>
              {authMode === "signup" && (
                <div>
                  <label className="profile-auth-label">
                    {language === "en" ? "FULL NAME" : "HỌ VÀ TÊN"}
                  </label>
                  <input 
                    id="profile-auth-name"
                    type="text" 
                    name="name"
                    className="feedback-input" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    autoComplete="name"
                    aria-invalid={!!authFieldErrors.name}
                    placeholder={language === "en" ? "John Doe" : "Nguyễn Văn A"}
                    required 
                    enterKeyHint="next"
                  />
                  {authFieldErrors.name && <div className="profile-auth-field-error">{authFieldErrors.name}</div>}
                </div>
              )}
              
              <div>
                <label className="profile-auth-label">
                  EMAIL
                </label>
                <input 
                  id="profile-auth-email"
                  type="email" 
                  name="email"
                  className="feedback-input" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  autoComplete="email"
                  inputMode="email"
                  spellCheck={false}
                  aria-invalid={!!authFieldErrors.email}
                  placeholder="name@example.com"
                  required 
                  enterKeyHint="next"
                />
                {authFieldErrors.email && <div className="profile-auth-field-error">{authFieldErrors.email}</div>}
              </div>

              <div>
                <label className="profile-auth-label">
                  {language === "en" ? "PASSWORD" : "MẬT KHẨU"}
                </label>
                <input 
                  id="profile-auth-password"
                  type="password" 
                  name={authMode === "login" ? "current-password" : "new-password"}
                  className="feedback-input" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                  aria-invalid={!!authFieldErrors.password}
                  placeholder="••••••••"
                  required 
                  enterKeyHint="done"
                />
                {authFieldErrors.password && <div className="profile-auth-field-error">{authFieldErrors.password}</div>}
              </div>

              <button className="submit-btn profile-auth-submit-btn" type="submit" disabled={authLoading}>
                {authSubmitLabel}
              </button>
            </form>

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

  return (
    <Page>
      <Header title={t("nav.profile")} showBackIcon={false} />
      <div className="profile-page-container">
        
        {/* Hidden Avatar input */}
        <input 
          type="file" 
          ref={avatarInputRef} 
          onChange={handleAvatarChange} 
          accept="image/*" 
          className="hidden-input" 
        />

        {profileNotice && (
          <div
            className={`profile-notice profile-notice-${profileNotice.type}`}
            role={profileNotice.type === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {profileNotice.message}
          </div>
        )}

        {/* User Card */}
        <div className="glass-card fade-in-up stagger-1 profile-user-card">
          <div className="profile-user-card-top">
            <div className="profile-user-card-info-row">
              
              {/* Interactive Avatar Container */}
              <button 
                type="button"
                onClick={() => !avatarLoading && avatarInputRef.current?.click()}
                className={`profile-avatar-wrapper ${avatarLoading ? "is-loading" : ""}`}
                disabled={avatarLoading}
                aria-label={language === "en" ? "Change avatar" : "Đổi ảnh đại diện"}
                title={language === "en" ? "Change Avatar" : "Đổi ảnh đại diện"}
              >
                <div className="profile-avatar-circle">
                  {avatarLoading ? (
                    <div className="profile-avatar-loading-text">...</div>
                  ) : profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="profile-avatar-img" />
                  ) : (
                    profile.name ? profile.name.charAt(0).toUpperCase() : "U"
                  )}
                </div>
                {!avatarLoading && (
                  <div className="profile-avatar-camera-badge">
                    <Camera size={10} className="stroke-width-3" />
                  </div>
                )}
              </button>
              
              {!isEditing ? (
                <div className="profile-details-wrapper">
                  <h3 className="profile-details-name">
                    {profile.name || (language === "en" ? "Guest Tourist" : language === "km" ? "ភ្ញៀវទេសចរ" : "Khách du lịch")}
                  </h3>
                  <div className="profile-details-contacts">
                    {profile.phone && (
                      <span className="profile-details-contact-item">
                        <Phone size={12} /> {profile.phone}
                      </span>
                    )}
                    {profile.email && (
                      <span className="profile-details-contact-item">
                        <Mail size={12} /> {profile.email}
                      </span>
                    )}
                  </div>
                  <span className="profile-details-badge">
                    {profile.link_type || "Email / Supabase"}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="profile-edit-form">
                  <input 
                    type="text" 
                    className="feedback-input profile-edit-input" 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    placeholder={language === "en" ? "Full name" : language === "km" ? "ឈ្មោះពេញ" : "Họ và tên"}
                    required 
                    enterKeyHint="next"
                  />
                  <input 
                    type="text" 
                    className="feedback-input profile-edit-input" 
                    value={editPhone} 
                    onChange={e => setEditPhone(e.target.value)} 
                    placeholder={language === "en" ? "Phone number" : language === "km" ? "លេខទូរស័ព្ទ" : "Số điện thoại"}
                    enterKeyHint="next"
                  />
                  
                  {/* Collapsible Password Change Section */}
                  <div className="profile-pw-checkbox-wrapper">
                    <label className="profile-pw-label">
                      <input 
                        type="checkbox" 
                        checked={showPasswordChange} 
                        onChange={e => setShowPasswordChange(e.target.checked)} 
                      />
                      <span>{language === "en" ? "Change password" : language === "km" ? "ប្តូរលេខសម្ងាត់" : "Đổi mật khẩu"}</span>
                    </label>
                    
                    {showPasswordChange && (
                      <div className="profile-pw-fields">
                        <input 
                          type="password" 
                          className="feedback-input profile-pw-input" 
                          value={newPassword} 
                          onChange={e => setNewPassword(e.target.value)} 
                          placeholder={language === "en" ? "New password (min 6 chars)" : language === "km" ? "លេខសម្ងាត់ថ្មី (យ៉ាងហោចណាស់ ៦ ខ្ទង់)" : "Mật khẩu mới (tối thiểu 6 ký tự)"}
                          required={showPasswordChange}
                          enterKeyHint="next"
                        />
                        <input 
                          type="password" 
                          className="feedback-input profile-pw-input" 
                          value={confirmPassword} 
                          onChange={e => setConfirmPassword(e.target.value)} 
                          placeholder={language === "en" ? "Confirm new password" : language === "km" ? "បញ្ជាក់លេខសម្ងាត់ថ្មី" : "Nhập lại mật khẩu mới"}
                          required={showPasswordChange}
                          enterKeyHint="done"
                        />
                      </div>
                    )}
                  </div>

                  <div className="profile-edit-actions">
                    <button className="submit-btn profile-save-btn" type="submit" disabled={editLoading}>
                      <Save size={14} /> {language === "en" ? "Save" : language === "km" ? "រក្សាទុក" : "Lưu"}
                    </button>
                    <button type="button" onClick={() => { setIsEditing(false); setShowPasswordChange(false); }} className="profile-cancel-btn">
                      <X size={14} /> {language === "en" ? "Cancel" : language === "km" ? "បោះបង់" : "Hủy"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="profile-edit-btn"
                aria-label={language === "en" ? "Edit Profile" : language === "km" ? "កែសម្រួលព័ត៌មាន" : "Sửa hồ sơ"}
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          {/* Gamification Stats Block (Premium UI) */}
          {profile && (
            <div className="profile-journey-stats-card">
              {/* Title & Level */}
              <div className="profile-journey-stats-header">
                <div className="profile-journey-title-wrapper">
                  <Award size={16} className="gold-text-icon" />
                  <span className="profile-xp-title">
                    {title}
                  </span>
                </div>
                <span className="profile-journey-level-badge">
                  {language === "en" ? `Level ${level}` : language === "km" ? `កម្រិត ${level}` : `Cấp ${level}`}
                </span>
              </div>
              
              {/* XP Progress Bar */}
              <div className="profile-xp-progress-wrapper">
                <div className="profile-xp-text-row">
                  <span>XP: {xp} / {nextLevelXp}</span>
                  <span>{Math.round((xp / nextLevelXp) * 100)}%</span>
                </div>
                <div className="profile-xp-progress-bar">
                  <div 
                    className="profile-xp-progress-fill" 
                    style={{ width: `${Math.min(100, (xp / nextLevelXp) * 100)}%` }} 
                  />
                </div>
              </div>

              {/* Detailed Achievements counts */}
              <div className="profile-achievements-row">
                <div>
                  <span className="profile-achievement-val">{stampsCount}/{allPlaces.length}</span>
                  <span className="profile-achievement-label">{language === "en" ? "Stamps" : language === "km" ? "ត្រាសញ្ញា" : "Dấu ấn"}</span>
                </div>
                <div>
                  <span className="profile-achievement-val">{favoritesCount}</span>
                  <span className="profile-achievement-label">{language === "en" ? "Favorites" : language === "km" ? "ចូលចិត្ត" : "Yêu thích"}</span>
                </div>
                <div>
                  <span className="profile-achievement-val">{itinerariesCount}</span>
                  <span className="profile-achievement-label">{language === "en" ? "Itineraries" : language === "km" ? "កម្មវិធីដំណើរ" : "Lịch trình"}</span>
                </div>
              </div>
              
              {/* How to level up tip */}
              <div className="profile-achievement-tip">
                {language === "en" 
                  ? "* Stamps = 1000 XP | Favorites = 100 XP | Itineraries = 200 XP" 
                  : language === "km"
                    ? "* ត្រាសញ្ញា = 1000 XP | ចូលចិត្ត = 100 XP | កម្មវិធីដំណើរ = 200 XP"
                    : "* Dấu ấn = 1000 XP | Yêu thích = 100 XP | Lịch trình = 200 XP"}
              </div>
            </div>
          )}

          <div className="profile-signout-row">
            <button onClick={handleSignOut} className="profile-signout-btn">
              <LogOut size={14} />
              {t("profile.logout_btn")}
            </button>
          </div>
        </div>

        {/* Stamp Rally Collection Card */}
        <div className="glass-card fade-in-up stagger-2">
          <h3 className="profile-section-title">
            <Award size={18} className="gold-text-icon" />
            <span>{t("profile.stamps")}</span>
          </h3>
          <p className="profile-section-subtitle">
            {language === "en" 
              ? `Collected ${stamps.length}/${allPlaces.length} heritage stamps`
              : language === "km"
                ? `ប្រមូលបាន ${stamps.length}/${allPlaces.length} ត្រា`
                : `Đã tích lũy được ${stamps.length}/${allPlaces.length} dấu ấn`}
          </p>

          <div className="profile-stamp-grid">
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
                  className={`profile-stamp-card fade-in-up stagger-${idx % 3 + 1} ${collected ? "is-collected" : "is-locked"}`}
                  title={localizedName}
                >
                  <div className={`profile-stamp-badge-circle ${collected ? "is-collected" : "is-locked"}`}>
                    {collected ? (
                      <Check size={20} className="stroke-width-3" />
                    ) : (
                      <Lock size={14} />
                    )}
                  </div>
                  <span className="profile-stamp-name">
                    {displayName}
                  </span>
                  <span className="profile-stamp-status-badge">
                    {collected ? (language === "en" ? "STAMPED" : language === "km" ? "បានទទួល" : "ĐÃ CÓ") : (language === "en" ? "LOCKED" : language === "km" ? "មិនទាន់មាន" : "CHƯA CÓ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Heritage Journey Completed - Congrats Card */}
        {stamps.length >= 3 && (
          <div className="glass-card fade-in-up profile-journey-complete-card">
            <div className="profile-journey-icon-circle">
              <Award size={30} />
            </div>
            <h4 className="profile-journey-title">
              {language === "en" 
                ? "HERITAGE JOURNEY PROGRESS" 
                : language === "km" 
                  ? "វឌ្ឍនភាពធ្វើដំណើរ" 
                  : "HÀNH TRÌNH DI SẢN XUẤT SẮC"}
            </h4>
            <p className="profile-journey-desc">
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
          <h3 className="profile-section-title">
            <Award size={18} className="gold-text-icon" />
            <span>
              {language === "en" ? "Explorer Leaderboard" : language === "km" ? "តារាងពិន្ទុអ្នករុករក" : "Bảng Xếp Hạng Lữ Khách"}
            </span>
          </h3>
          <p className="profile-section-subtitle">
            {language === "en" 
              ? "Top explorers based on stamps, favorites and itineraries" 
              : language === "km"
                ? "អ្នករុករកកំពូលផ្អែកលើត្រា ចំណូលចិត្ត និងការធ្វើដំណើរ"
                : "Top lữ khách tích cực khám phá, check-in di sản và thiết kế lộ trình"}
          </p>

          <div className="profile-leaderboard-list">
            {leaderboard.length === 0 ? (
              <p className="profile-leaderboard-empty">
                {language === "en" ? "No leaderboard data" : "Chưa có dữ liệu bảng xếp hạng"}
              </p>
            ) : (
              leaderboard.map((item, idx) => {
                const isCurrentUser = profile && item.id === profile.id;
                const rank = idx + 1;
                let rankBadgeColor = "";
                let rankTextColor = "var(--site-navy)";
                if (rank === 1) { rankBadgeColor = "#ffd700"; rankTextColor = "#856404"; }
                else if (rank === 2) { rankBadgeColor = "#c0c0c0"; rankTextColor = "#495057"; }
                else if (rank === 3) { rankBadgeColor = "#cd7f32"; rankTextColor = "#721c24"; }

                return (
                  <div 
                    key={item.id}
                    className={`profile-leaderboard-item ${isCurrentUser ? "is-current" : ""}`}
                  >
                    {/* Rank number or medal */}
                    <div 
                      className="profile-leaderboard-rank"
                      style={{
                        backgroundColor: rankBadgeColor || "transparent",
                        color: rankBadgeColor ? rankTextColor : "var(--site-muted)"
                      }}
                    >
                      {rank}
                    </div>

                    {/* Avatar */}
                    <div className={`profile-leaderboard-avatar ${isCurrentUser ? "is-current" : ""}`}>
                      {item.avatar_url ? (
                        <img src={item.avatar_url} alt={item.name} className="profile-avatar-img" />
                      ) : (
                        item.name ? item.name.charAt(0).toUpperCase() : "U"
                      )}
                    </div>

                    {/* User details */}
                    <div className="profile-leaderboard-info">
                      <div className={`profile-leaderboard-name ${isCurrentUser ? "is-current" : ""}`}>
                        {item.name || (language === "en" ? "Guest Tourist" : language === "km" ? "ភ្ញៀវទេសចរ" : "Khách du lịch")} {isCurrentUser && (language === "en" ? " (You)" : language === "km" ? " (អ្នក)" : " (Bạn)")}
                      </div>
                      <div className="profile-leaderboard-stats">
                        <span>🏆 {item.stamps_count} {language === "en" ? "stamps" : language === "km" ? "ត្រា" : "dấu ấn"}</span>
                        <span>❤️ {item.favorites_count}</span>
                      </div>
                    </div>

                    {/* XP score */}
                    <div className="profile-leaderboard-xp">
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
          <h3 className="profile-section-title">
            <Heart size={18} className="gold-fill-icon" />
            <span>{t("profile.favorites")}</span>
          </h3>

          {favorites.length === 0 ? (
            <p className="profile-section-subtitle margin-0">
              {t("profile.no_favorites")}
            </p>
          ) : (
            <div className="profile-favorites-list">
              {favorites.map((fav) => (
                <Link 
                  key={fav.id}
                  to={`/places/${fav.slug}`}
                  className="profile-favorite-item"
                >
                  <img 
                    src={fav.image_url} 
                    alt={fav.name} 
                    className="profile-favorite-img"
                  />
                  <div className="profile-favorite-info">
                    <h4 className="profile-favorite-name">
                      {language === "km" && fav.name_km 
                        ? fav.name_km 
                        : language === "en" && fav.name_en 
                          ? fav.name_en 
                          : fav.name}
                    </h4>
                    <span className="profile-favorite-category">
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
