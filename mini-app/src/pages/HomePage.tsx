import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bot, Compass, Info, FileText, Map, Bell,
  PhoneCall, ChevronRight, Sun, Cloud, CloudRain,
  Wind, Thermometer, User
} from "lucide-react";
import { Page } from "../components/WebPrimitives";
import api, { Announcement, supabase } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import heroImageUrl from "../assets/hero.webp";

export const HomePage: React.FC = () => {
  const [tickerAnns, setTickerAnns] = useState<Announcement[]>([]);
  const { language, t } = useLanguage();
  const [realtime, setRealtime] = useState<any>(null);
  const [homeUser, setHomeUser] = useState<{ email?: string; name?: string; avatar_url?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [anns, status] = await Promise.allSettled([
          api.getAnnouncements(),
          api.getRealtimeStatus(),
        ]);
        if (anns.status === "fulfilled" && anns.value?.length > 0) {
          setTickerAnns(anns.value);
        }
        if (status.status === "fulfilled") {
          setRealtime(status.value);
        }
      } catch (err) {
        console.warn("[HomePage] Data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const applyHomeUser = async (user: any) => {
      if (!user) {
        setHomeUser(null);
        return;
      }

      try {
        const profile = await api.getMyProfile();
        setHomeUser({
          email: user.email,
          name: profile?.name || (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : undefined),
          avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
        });
      } catch (err) {
        console.warn("[HomePage] Profile load error:", err);
        setHomeUser({
          email: user.email,
          name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name : undefined,
          avatar_url: user.user_metadata?.avatar_url || null,
        });
      }
    };

    const readSession = async () => {
      const { data } = await supabase.auth.getSession();
      await applyHomeUser(data.session?.user);
    };

    readSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      await applyHomeUser(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getWeatherIcon = (status: string) => {
    switch (status) {
      case "sunny": return <Sun size={20} style={{ color: "var(--site-gold)" }} />;
      case "cloudy": return <Cloud size={20} style={{ color: "var(--site-muted)" }} />;
      case "rainy": return <CloudRain size={20} style={{ color: "var(--site-blue)" }} />;
      case "windy": return <Wind size={20} style={{ color: "var(--site-jade)" }} />;
      default: return <Sun size={20} style={{ color: "var(--site-gold)" }} />;
    }
  };

  const menuItems = [
    {
      to: "/info",
      icon: Info,
      label: t("nav.info"),
      id: "menu-info",
    },
    {
      to: "/places",
      icon: Compass,
      label: t("nav.places"),
      id: "menu-places",
    },
    {
      to: "/digital-guide",
      icon: FileText,
      label: language === "km" ? "មគ្គុទ្ទេសក៍" : language === "en" ? "Digital Guide" : "Thuyết minh",
      id: "menu-guide",
    },
    {
      to: "/map",
      icon: Map,
      label: language === "km" ? "ផែនទី" : language === "en" ? "Digital Map" : "Bản đồ số",
      id: "menu-map",
    },
    {
      to: "/announcements",
      icon: Bell,
      label: language === "km" ? "ព្រឹត្តិការណ៍" : language === "en" ? "News" : "Tin tức",
      id: "menu-announcements",
    },
    {
      to: "/profile",
      icon: User,
      label: language === "km" ? "គណនី" : language === "en" ? "My Profile" : "Tài khoản",
      id: "menu-profile",
    },
  ];

  const hotlines = [
    {
      label: language === "vi" ? "An ninh, trật tự" : language === "km" ? "សន្តិសុខ" : "Security",
      phone: "02763823378",
      display: "0276.3823.378",
      className: "hotline-navy",
    },
    {
      label: language === "vi" ? "Dịch vụ du lịch" : language === "km" ? "ទេសចរណ៍" : "Tourism",
      phone: "02763823757",
      display: "0276.3823.757",
      className: "hotline-navy",
    },
    {
      label: language === "vi" ? "Cứu nạn, cứu hộ" : language === "km" ? "សង្គ្រោះ" : "Rescue",
      phone: "02763875678",
      display: "0276.387.5678",
      className: "hotline-red",
    },
    {
      label: language === "vi" ? "PCCC" : language === "km" ? "ពន្លត់ភ្លើង" : "Fire safety",
      phone: "02763822015",
      display: "0276.3822.015",
      className: "hotline-red",
    },
  ];

  return (
    <Page>
      <div className={`home-layout-container ${loading ? "is-loading-data" : ""}`}>
        {/* Cột chính (trái trên Desktop) */}
        <div className="home-main-col">
          {/* Hero Banner */}
          <div
            className="home-banner"
            style={{ backgroundImage: `url("${heroImageUrl}")` }}
            role="img"
            aria-label={language === "en" ? "Black Lady Mountain scenic view" : "Cảnh quan Núi Bà Đen"}
          >
            <div className="banner-content">
              <div className="banner-title">
                {language === "km" ? (
                  <>
                    <span className="banner-label">តំបន់ទេសចរណ៍ជាតិ</span>
                    <span className="banner-main-name">ភ្នំបាដេន</span>
                  </>
                ) : language === "en" ? (
                  <>
                    <span className="banner-label">NATIONAL TOURIST AREA</span>
                    <span className="banner-main-name">BLACK LADY MOUNTAIN</span>
                  </>
                ) : (
                  <>
                    <span className="banner-label">KHU DU LỊCH QUỐC GIA</span>
                    <span className="banner-main-name">NÚI BÀ ĐEN</span>
                  </>
                )}
              </div>
              <div className="banner-sub">
                {language === "km"
                  ? "រឿងព្រេងស័ក្តិសិទ្ធិ • ដំបូលនៃភាគខាងត្បូងវៀតណាម ៩៨៦ម"
                  : language === "en"
                    ? "Sacred Legend • Roof of Southern Vietnam 986m"
                    : "Huyền thoại linh thiêng • Nóc nhà Nam Bộ 986m"}
              </div>
            </div>
          </div>

          {/* Announcement Ticker */}
          {tickerAnns.length > 0 && (
            <Link
              to="/announcements"
              className="ticker-container"
              style={{ textDecoration: "none", display: "flex" }}
              aria-label={language === "en" ? "View latest announcements" : "Xem thông báo mới nhất"}
            >
              <Bell size={15} style={{ stroke: "var(--accent-gold)", flexShrink: 0 }} aria-hidden="true" />
              <div className="ticker-wrapper">
                <div className="ticker-text">
                  {tickerAnns.map((ann, idx) => (
                    <span key={ann.id ?? idx}>
                      <span style={{ fontWeight: 700, color: "var(--alert-red)" }}>[HOT] </span>
                      {language === "km" && ann.title_km
                        ? ann.title_km
                        : language === "en" && ann.title_en
                          ? ann.title_en
                          : ann.title}
                      {idx < tickerAnns.length - 1 && (
                        <span style={{ margin: "0 16px", opacity: 0.4 }}>·</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          )}

          {/* Bento Menu Grid (3-column) */}
          <div className="menu-grid-container">
            <div
              className="menu-grid"
              role="navigation"
              aria-label={language === "en" ? "Main navigation" : "Menu chính"}
            >
              {menuItems.map(({ to, icon: Icon, label, id }, idx) => (
                <Link
                  key={to}
                  to={to}
                  id={id}
                  className={`menu-card fade-in-up stagger-${Math.min(idx + 3, 5)}`}
                >
                  <div className="menu-icon-container">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Cột bổ trợ (phải trên Desktop) */}
        <div className="home-sidebar-col">
          {/* Weather Widget + AI CTA Row */}
          <div className="home-widgets-container">
            {/* Realtime Weather */}
            {realtime && (
              <div className="glass-card home-weather-card fade-in-up stagger-1">
                <div className="home-weather-temp-info">
                  <Thermometer size={16} style={{ color: "var(--site-gold)" }} />
                  <span>{t("realtime.weather")}:</span>
                  <span className="home-weather-temp-value">{realtime.weather_temp}°C</span>
                </div>
                <div className="home-weather-status-info">
                  {getWeatherIcon(realtime.weather_status)}
                  <span className="home-weather-status-text">
                    {realtime.weather_status}
                  </span>
                </div>
              </div>
            )}

            <Link
              to="/profile"
              id="home-profile-entry"
              className={`glass-card home-profile-card fade-in-up stagger-2 ${homeUser ? "is-signed-in" : "is-signed-out"}`}
              aria-label={homeUser
                ? language === "km" ? "បើកប្រវត្តិរូបផ្ទាល់ខ្លួន" : language === "en" ? "Open your profile" : "Mở hồ sơ cá nhân"
                : language === "km" ? "ចូលគណនី ឬ ចុះឈ្មោះ" : language === "en" ? "Log in or sign up" : "Đăng nhập hoặc đăng ký"}
            >
              <div className="home-profile-card-top">
                <div className="home-profile-icon">
                  {homeUser?.avatar_url ? (
                    <img src={homeUser.avatar_url} alt="User Avatar" className="home-profile-avatar-img" />
                  ) : (
                    <User size={18} aria-hidden="true" />
                  )}
                </div>
                <div className="home-profile-copy">
                  <h3 className="home-profile-title">
                    {homeUser
                      ? language === "km" ? "ប្រវត្តិរូបអ្នកទេសចរ" : language === "en" ? "Your visitor profile" : "Hồ sơ du khách"
                      : language === "km" ? "ចូល / ចុះឈ្មោះ" : language === "en" ? "Log in / Sign up" : "Đăng nhập / Đăng ký"}
                  </h3>
                  <p className="home-profile-desc">
                    {homeUser
                      ? (homeUser.name || homeUser.email || (language === "km" ? "បានចូលគណនី" : language === "en" ? "Signed in" : "Đã đăng nhập"))
                      : language === "km"
                        ? "បង្កើតគណនីដើម្បីរក្សាទុកការចូលចិត្ត ត្រានិងប្រវត្តិនៃការធ្វើដំណើរ។"
                        : language === "en"
                          ? "Create an account to save favorites, stamps and trip history."
                          : "Tạo tài khoản để lưu yêu thích, dấu ấn và lịch sử hành trình."}
                  </p>
                </div>
              </div>
              <div className="home-profile-action-row">
                <span className="home-profile-status">
                  {homeUser
                    ? language === "km" ? "បានចូលគណនី" : language === "en" ? "Signed in" : "Đã đăng nhập"
                    : language === "km" ? "មិនទាន់ចូលគណនី" : language === "en" ? "Not signed in" : "Chưa đăng nhập"}
                </span>
                <span className="home-profile-action">
                  {homeUser
                    ? language === "km" ? "មើលប្រវត្តិរូប" : language === "en" ? "View profile" : "Xem hồ sơ"
                    : language === "km" ? "ចាប់ផ្តើមឥឡូវនេះ" : language === "en" ? "Start now" : "Bắt đầu ngay"}
                  <ChevronRight size={15} aria-hidden="true" />
                </span>
              </div>
            </Link>

            {/* AI Chat CTA */}
            <Link
              to="/chat"
              id="home-ai-cta"
              className="ai-cta-card fade-in-up stagger-3"
              aria-label={language === "vi" ? "Trò chuyện với Trợ lý Du lịch AI" : "Chat with AI Tour Guide"}
            >
              <div className="home-ai-cta-content">
                <div className="home-ai-cta-left">
                  <div className="home-ai-cta-icon-wrapper">
                    <Bot size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="home-ai-cta-title">
                      {language === "km" ? "សួរនាំជំនួយការ AI" : language === "en" ? "Ask AI Tour Guide" : "Hỏi Trợ lý Du lịch AI"}
                    </h3>
                    <p className="home-ai-cta-desc">
                      {language === "km"
                        ? "ព័ត៌មានគ្រប់ប្រភេទអំពីភ្នំបាដេន"
                        : language === "en"
                          ? "Ask anything about Black Lady Mountain"
                          : "Hỏi mọi thứ về Núi Bà Đen"}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: "var(--site-gold)", flexShrink: 0 }} aria-hidden="true" />
              </div>
            </Link>
          </div>

          {/* Emergency Hotlines */}
          <div className="home-hotlines-container">
            <div className="glass-card home-hotlines-card fade-in-up stagger-5">
              <div>
                <h4 className="home-hotlines-title">
                  {language === "km" ? "ខ្សែទូរស័ព្ទទាន់ហេតុការណ៍" : language === "en" ? "Tourist Support Hotlines" : "Đường dây nóng hỗ trợ"}
                </h4>
                <p className="home-hotlines-desc">
                  {language === "km" ? "ប៉ះដើម្បីទូរស័ព្ទ" : language === "en" ? "Tap to call support" : "Nhấn để gọi hỗ trợ nhanh"}
                </p>
              </div>

              <div className="home-hotlines-grid">
                {hotlines.map((hotline) => (
                  <a
                    key={hotline.phone}
                    href={`tel:${hotline.phone}`}
                    id={`hotline-${hotline.phone}`}
                    className={`home-hotline-item ${hotline.className}`}
                  >
                    <span className="home-hotline-label">
                      <PhoneCall size={12} aria-hidden="true" />
                      {hotline.label}
                    </span>
                    <span className="home-hotline-number">
                      {hotline.display}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default HomePage;
