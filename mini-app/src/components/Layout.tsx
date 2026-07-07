import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Bot, Compass, AlertTriangle, User, Map, Menu, X, Newspaper, Info, ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import logoImageUrl from "../assets/logo.png";
import cx from "../utils/cx";
import styles from "../app.module.css";

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
  // Viewport + mobile keyboard handler
  //
  // KEY FIX (iOS Safari on HTTPS / Render):
  //   On HTTPS, iOS Safari can fire only a visualViewport "scroll" event (not
  //   "resize") when the keyboard opens/closes. The old code only measured on
  //   "resize", so --app-height was never updated → layout gap/break on prod.
  //
  // Strategy:
  //   1. Always scheduleMeasure on BOTH vv "resize" AND vv "scroll".
  //   2. --app-height = vv.height (the actual usable height after keyboard).
  //   3. Lock window scroll to 0 via a passive listener + rAF (avoids
  //      "Ignored attempt to cancel a touchmove event" warnings on iOS).
  //   4. Drop --app-top / --app-left — nothing in CSS uses them.
  //   5. Hysteresis thresholds prevent oscillation at the boundary.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const KB_OPEN_THRESHOLD = 150; // px the viewport must shrink to count as "open"
    const KB_CLOSE_THRESHOLD = 80;  // must recover past this to count as "closed"

    // Passive scroll lock — rAF so we don't block the scroll event on iOS
    let scrollLockRaf: number | null = null;
    const lockWindowScroll = () => {
      if (kbStateRef.current) return; // Do not fight scroll when keyboard is open
      if (scrollLockRaf != null) return;
      scrollLockRaf = requestAnimationFrame(() => {
        scrollLockRaf = null;
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0);
        }
      });
    };

    const applyKeyboardState = (open: boolean) => {
      if (open === kbStateRef.current) return;
      kbStateRef.current = open;
      document.documentElement.classList.toggle("keyboard-open", open);
      document.body.classList.toggle("keyboard-open", open);
    };

    const measure = () => {
      rafRef.current = null;
      const vv = window.visualViewport;
      // vv.height = actual usable height (shrinks when keyboard opens).
      // On iOS HTTPS this is correctly reported on BOTH resize AND scroll events.
      let height = Math.round(vv ? vv.height : window.innerHeight);
      const top = vv ? Math.round(vv.offsetTop) : 0;
      const left = vv ? Math.round(vv.offsetLeft) : 0;

      // Keyboard open/close detection with hysteresis.
      const shrink = window.innerHeight - height;
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const active = document.activeElement;
      const isInputFocused = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT");
      
      let isOpen = false;
      if (shrink > KB_OPEN_THRESHOLD) {
        isOpen = true;
      } else if (kbStateRef.current && shrink >= KB_CLOSE_THRESHOLD) {
        isOpen = true;
      } else if (isMobile && isInputFocused) {
        // Fallback for WebViews (e.g. Zalo) where visualViewport.height doesn't shrink on keyboard open
        const estimatedKbHeight = 290;
        height = window.innerHeight - estimatedKbHeight;
        isOpen = true;
      }

      // Always update --app-height so CSS layout tracks the real usable area.
      if (height !== lastHeightRef.current) {
        lastHeightRef.current = height;
        document.documentElement.style.setProperty("--app-height", `${height}px`);
      }

      // Update offsets to align fixed containers to the visual viewport
      document.documentElement.style.setProperty("--app-top", `${top}px`);
      document.documentElement.style.setProperty("--app-left", `${left}px`);

      applyKeyboardState(isOpen);
    };

    const scheduleMeasure = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(measure);
    };

    const handleFocusIn = () => {
      // Let the browser handle focus scrolling natively to avoid double-scroll jumping on iOS
      scheduleMeasure();
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
      }, 150);
    };

    const vv = window.visualViewport;
    // CRITICAL: listen to BOTH resize AND scroll on visualViewport.
    // On iOS HTTPS only a scroll event fires when keyboard opens.
    vv?.addEventListener("resize", scheduleMeasure);
    vv?.addEventListener("scroll", scheduleMeasure);
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("orientationchange", scheduleMeasure);
    // Passive scroll lock — does NOT block iOS touch scroll
    window.addEventListener("scroll", lockWindowScroll, { passive: true });
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    scheduleMeasure();

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (scrollLockRaf != null) cancelAnimationFrame(scrollLockRaf);
      vv?.removeEventListener("resize", scheduleMeasure);
      vv?.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("orientationchange", scheduleMeasure);
      window.removeEventListener("scroll", lockWindowScroll);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      document.documentElement.classList.remove("keyboard-open");
      document.body.classList.remove("keyboard-open");
    };
  }, []);

  const isFullscreenPage = path === "/map" || path === "/chat";

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

  // Lock scroll on fullscreen pages to prevent iOS focus-scrolling from breaking layouts
  useEffect(() => {
    const container = pageContainerRef.current;
    if (!container || !isFullscreenPage) return;

    const handleScroll = () => {
      if (container.scrollTop !== 0) {
        container.scrollTop = 0;
      }
      if (container.scrollLeft !== 0) {
        container.scrollLeft = 0;
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [isFullscreenPage]);

  const isLinkActive = (targetPath: string) => {
    if (targetPath === "/" && path === "/") return true;
    if (targetPath !== "/" && path.startsWith(targetPath)) return true;
    return false;
  };

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
    <div className={cx(styles, `app-layout-wrapper ${isFullscreenPage ? "is-fullscreen-route" : ""}`)}>
      <header className={cx(styles, `site-header ${path !== "/" ? "is-subpage-header" : ""}`)}>
        {path !== "/" && !menuOpen && (
          <button
            type="button"
            className={cx(styles, "layout-back-button mobile-only")}
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        )}

        <Link to="/" className={cx(styles, `site-brand ${path !== "/" && !menuOpen ? "desktop-only" : ""}`)} aria-label={t("nav.home")}>
          <img src={logoImageUrl} alt={t("header.brand_name")} className={cx(styles, "site-logo")} />
          <span>
            <strong>{t("header.brand_name")}</strong>
            <small>{t("header.subtitle")}</small>
          </span>
        </Link>

        {path !== "/" && !menuOpen && (
          <div className={cx(styles, "layout-mobile-title mobile-only")}>
            {getPageTitle()}
          </div>
        )}

        <nav className={cx(styles, "site-nav")} aria-label="Điều hướng chính">
          {primaryNavItems.map(({ to, icon: Icon, label, id }) => (
            <Link
              key={to}
              to={to}
              id={`${id}-desktop`}
              className={cx(styles, `site-nav-link ${isLinkActive(to) ? "is-active" : ""}`)}
              aria-current={isLinkActive(to) ? "page" : undefined}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className={cx(styles, "site-actions")}>
          <div className={cx(styles, "site-lang-toggle")} aria-label="Chọn ngôn ngữ">
            {(["vi", "en", "km"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={cx(styles, language === lang ? "active" : "")}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <Link to="/chat" className={cx(styles, "site-ai-button")}>
            <Bot size={17} aria-hidden="true" />
            <span>{t("nav.chat")}</span>
          </Link>

          <button
            type="button"
            className={cx(styles, "site-menu-button")}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className={cx(styles, "mobile-drawer")} aria-label="Menu di động">
          {navItems.map(({ to, icon: Icon, label, id }) => (
            <Link
              key={to}
              to={to}
              id={`${id}-drawer`}
              className={cx(styles, `mobile-drawer-link ${isLinkActive(to) ? "is-active" : ""}`)}
              aria-current={isLinkActive(to) ? "page" : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
          <div className={cx(styles, "mobile-drawer-lang")}>
            {(["vi", "en", "km"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={cx(styles, language === lang ? "active" : "")}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className={cx(styles, "main-content-area")}>
        <main
          ref={pageContainerRef}
          className={cx(styles, "app-scroll-container")}
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
