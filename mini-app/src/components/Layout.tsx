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

  // Refs for the rewritten, jank-free viewport/keyboard handler.
  const lastHeightRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const kbStateRef = useRef<boolean>(false);

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

  // ---------------------------------------------------------------------------
  // Viewport + mobile keyboard handler (rewritten to remove the scroll-jank loop)
  //
  // Why the old version juddered: it called window.scrollTo(0,0) inside the
  // visualViewport "scroll"/"resize" listeners AND inside focusin (plus an extra
  // rAF). Each forced scroll re-fired the scroll event, which forced another
  // scroll -> a feedback loop that visibly shook the page whenever the keyboard
  // opened. It also toggled `keyboard-open` from two competing sources.
  //
  // New approach:
  //   * ONE source of truth for `keyboard-open`, derived from visualViewport,
  //     throttled via requestAnimationFrame and guarded by hysteresis so it
  //     never flickers.
  //   * NEVER force window scrolling. The page is pinned via CSS instead.
  //   * Only publish CSS vars when the value actually changed.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const KB_OPEN_THRESHOLD = 160; // px the viewport must shrink to count as "open"
    const KB_CLOSE_THRESHOLD = 100; // must recover past this to count as "closed"

    const applyKeyboardState = (open: boolean) => {
      if (open === kbStateRef.current) return;
      kbStateRef.current = open;
      document.documentElement.classList.toggle("keyboard-open", open);
      document.body.classList.toggle("keyboard-open", open);
    };

    const measure = () => {
      rafRef.current = null;
      const vv = window.visualViewport;
      const height = Math.round(vv ? vv.height : window.innerHeight);
      const offsetTop = Math.round(vv ? vv.offsetTop : 0);
      const offsetLeft = Math.round(vv ? vv.offsetLeft : 0);

      // Publish CSS vars only when the height actually moved (avoids churn).
      if (height !== lastHeightRef.current) {
        lastHeightRef.current = height;
        const root = document.documentElement.style;
        root.setProperty("--app-height", `${height}px`);
        root.setProperty("--app-top", `${offsetTop}px`);
        root.setProperty("--app-left", `${offsetLeft}px`);
      }

      // Keyboard state with hysteresis so it can't oscillate on the boundary.
      const shrink = window.innerHeight - height;
      if (!kbStateRef.current && shrink > KB_OPEN_THRESHOLD) {
        applyKeyboardState(true);
      } else if (kbStateRef.current && shrink < KB_CLOSE_THRESHOLD) {
        applyKeyboardState(false);
      }
    };

    const scheduleMeasure = () => {
      if (rafRef.current != null) return; // already scheduled this frame
      rafRef.current = requestAnimationFrame(measure);
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        !target ||
        (target.tagName !== "INPUT" &&
          target.tagName !== "TEXTAREA" &&
          target.tagName !== "SELECT")
      ) {
        return;
      }

      // The bottom chat input is pinned above the keyboard by CSS; do nothing.
      if (target.id === "chat-input") return;

      // For in-page form fields, gently bring the field into view AFTER the
      // keyboard animation settles. No window.scrollTo, no rAF loop.
      window.setTimeout(() => {
        if (document.activeElement === target) {
          target.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }, 300);
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (
          !active ||
          (active.tagName !== "INPUT" &&
            active.tagName !== "TEXTAREA" &&
            active.tagName !== "SELECT")
        ) {
          applyKeyboardState(false);
          scheduleMeasure();
        }
      }, 120);
    };

    const vv = window.visualViewport;
    vv?.addEventListener("resize", scheduleMeasure);
    vv?.addEventListener("scroll", scheduleMeasure);
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("orientationchange", scheduleMeasure);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    scheduleMeasure();

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      vv?.removeEventListener("resize", scheduleMeasure);
      vv?.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("orientationchange", scheduleMeasure);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
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

        <Link to="/" className={`site-brand ${path !== "/" && !menuOpen ? "desktop-only" : ""}`} aria-label={t("nav.home")}>
          <img src={logoImageUrl} alt={t("header.brand_name")} className="site-logo" />
          <span>
            <strong>{t("header.brand_name")}</strong>
            <small>{t("header.subtitle")}</small>
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
