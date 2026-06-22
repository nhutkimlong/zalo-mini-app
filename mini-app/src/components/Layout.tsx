import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Bot, Compass, AlertTriangle, User, Map, Menu, X, Newspaper, Info, ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import logoImageUrl from "../assets/logo.png";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageContainerRef = useRef<HTMLElement>(null);

  const lastHeightRef = useRef<number>(0);
  const lastTopRef = useRef<number>(0);
  const lastLeftRef = useRef<number>(0);
  const lastKeyboardOpenRef = useRef<boolean>(false);

  const getPageTitle = () => {
    if (path === "/") return "";
    if (path === "/places") return t("places.title");
    if (path.startsWith("/places/")) return language === "km" ? "ព័ត៌មានលម្អិត" : language === "en" ? "Attraction Detail" : "Chi tiết địa danh";
    if (path === "/info") return t("info.title");
    if (path === "/digital-guide") return language === "km" ? "មគ្គុទ្ទេសក៍" : language === "en" ? "Digital Guide" : "Thuyết minh số";
    if (path === "/feedback") return t("feedback.title");
    if (path === "/announcements") return t("announcements.title");
    if (path === "/map") return language === "km" ? "ផែនទី" : language === "en" ? "Digital Map" : "Bản đồ số";
    if (path === "/profile") return t("profile.title");
    if (path === "/chat") return language === "vi" ? "Trợ lý AI" : language === "en" ? "AI Assistant" : "ជំនួយការ AI";
    return "";
  };

  // Dynamic viewport height (handles iOS toolbar & keyboard)
  useEffect(() => {
    const updateHeight = () => {
      const vv = window.visualViewport;
      const height = vv ? vv.height : window.innerHeight;
      const offsetTop = vv ? vv.offsetTop : 0;
      const offsetLeft = vv ? vv.offsetLeft : 0;

      if (
        height !== lastHeightRef.current ||
        offsetTop !== lastTopRef.current ||
        offsetLeft !== lastLeftRef.current
      ) {
        lastHeightRef.current = height;
        lastTopRef.current = offsetTop;
        lastLeftRef.current = offsetLeft;

        document.documentElement.style.setProperty("--app-height", `${height}px`);
        document.documentElement.style.setProperty("--app-top", `${offsetTop}px`);
        document.documentElement.style.setProperty("--app-left", `${offsetLeft}px`);
      }

      // Detect keyboard open (visual viewport height shrinks significantly)
      const isKeyboardOpen = vv ? vv.height < window.innerHeight - 140 : false;
      if (isKeyboardOpen !== lastKeyboardOpenRef.current) {
        lastKeyboardOpenRef.current = isKeyboardOpen;
        if (isKeyboardOpen) {
          document.documentElement.classList.add("keyboard-open");
          document.body.classList.add("keyboard-open");
        } else {
          document.documentElement.classList.remove("keyboard-open");
          document.body.classList.remove("keyboard-open");
        }
      }
    };

    const handleViewportChange = () => {
      updateHeight();
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };

    const handleWindowScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        document.documentElement.classList.add("keyboard-open");
        document.body.classList.add("keyboard-open");

        // Force an immediate layout update
        window.scrollTo(0, 0);
        updateHeight();

        // Exclude the bottom chat input from scrollIntoView
        if (target.id === "chat-input") {
          return;
        }

        // Instantly snap scroll position on focus to avoid WebKit page panning
        const container = target.closest(".app-scroll-container");
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const relativeTop = targetRect.top - containerRect.top + container.scrollTop;
          const targetScrollTop = relativeTop - 40; // Align input 40px from the top of scroll container

          container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: "auto" // Instant alignment!
          });
        }
        
        // Final sanity-lock scroll check
        requestAnimationFrame(() => {
          window.scrollTo(0, 0);
        });
      }
    };

    const handleFocusOut = () => {
      // Return window scroll back to 0 when input loses focus
      setTimeout(() => {
        const active = document.activeElement;
        if (
          !active ||
          (active.tagName !== "INPUT" &&
            active.tagName !== "TEXTAREA" &&
            active.tagName !== "SELECT")
        ) {
          window.scrollTo(0, 0);
          document.documentElement.classList.remove("keyboard-open");
          document.body.classList.remove("keyboard-open");
          updateHeight();
        }
      }, 100);
    };

    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleWindowScroll);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    updateHeight();

    return () => {
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
      window.visualViewport?.removeEventListener("scroll", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleWindowScroll);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      // Clean up classes on unmount
      document.documentElement.classList.remove("keyboard-open");
      document.body.classList.remove("keyboard-open");
    };
  }, []);

  // Scroll to top & manage dark body on route change
  useEffect(() => {
    if (pageContainerRef.current) {
      pageContainerRef.current.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
    setMenuOpen(false);

    const isDarkPage = path === "/chat" || path === "/map";
    if (isDarkPage) {
      document.documentElement.classList.add("dark-body-bg");
      document.body.classList.add("dark-body-bg");
    } else {
      document.documentElement.classList.remove("dark-body-bg");
      document.body.classList.remove("dark-body-bg");
    }
  }, [location.pathname, path]);

  const isLinkActive = (targetPath: string) => {
    if (targetPath === "/" && path === "/") return true;
    if (targetPath !== "/" && path.startsWith(targetPath)) return true;
    return false;
  };

  const isFullscreenPage = path === "/map" || path === "/chat";

  const primaryNavItems = [
    { to: "/", icon: Home, label: t("nav.home"), id: "nav-home" },
    { to: "/places", icon: Compass, label: t("nav.places"), id: "nav-places" },
    { to: "/map", icon: Map, label: t("nav.map"), id: "nav-map" },
    { to: "/info", icon: Info, label: t("nav.info"), id: "nav-info" },
    { to: "/announcements", icon: Newspaper, label: t("nav.announcements"), id: "nav-announcements" },
  ];

  const utilityNavItems = [
    { to: "/chat", icon: Bot, label: t("nav.chat"), id: "nav-chat" },
    { to: "/feedback", icon: AlertTriangle, label: t("nav.feedback"), id: "nav-feedback" },
    { to: "/profile", icon: User, label: t("nav.profile"), id: "nav-profile" },
  ];

  const navItems = [...primaryNavItems, ...utilityNavItems];

  return (
    <div className={`app-layout-wrapper ${isFullscreenPage ? "is-fullscreen-route" : ""}`}>
      <header className={`site-header ${path !== "/" ? "is-subpage-header" : ""}`}>
        {path !== "/" && !menuOpen && (
          <button
            type="button"
            className="layout-back-button mobile-only"
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        )}

        <Link to="/" className={`site-brand ${path !== "/" && !menuOpen ? "desktop-only" : ""}`} aria-label="Trang chủ Núi Bà Đen">
          <img src={logoImageUrl} alt="Núi Bà Đen" className="site-logo" />
          <span>
            <strong>Núi Bà Đen</strong>
            <small>Travel Assistant</small>
          </span>
        </Link>

        {path !== "/" && !menuOpen && (
          <div className="layout-mobile-title mobile-only">
            {getPageTitle()}
          </div>
        )}

        <nav className="site-nav" aria-label="Điều hướng chính">
          {primaryNavItems.map(({ to, icon: Icon, label, id }) => (
            <Link
              key={to}
              to={to}
              id={`${id}-desktop`}
              className={`site-nav-link ${isLinkActive(to) ? "is-active" : ""}`}
              aria-current={isLinkActive(to) ? "page" : undefined}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="site-actions">
          <div className="site-lang-toggle" aria-label="Chọn ngôn ngữ">
            {(["vi", "en", "km"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={language === lang ? "active" : ""}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <Link to="/chat" className="site-ai-button">
            <Bot size={17} aria-hidden="true" />
            <span>{t("nav.chat")}</span>
          </Link>

          <button
            type="button"
            className="site-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="mobile-drawer" aria-label="Menu di động">
          {navItems.map(({ to, icon: Icon, label, id }) => (
            <Link
              key={to}
              to={to}
              id={`${id}-drawer`}
              className={`mobile-drawer-link ${isLinkActive(to) ? "is-active" : ""}`}
              aria-current={isLinkActive(to) ? "page" : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
          <div className="mobile-drawer-lang">
            {(["vi", "en", "km"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={language === lang ? "active" : ""}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className="main-content-area">
        <main
          ref={pageContainerRef}
          className="app-scroll-container"
          style={
            isFullscreenPage
              ? { paddingBottom: 0, height: "100%", overflow: "hidden" }
              : {}
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
