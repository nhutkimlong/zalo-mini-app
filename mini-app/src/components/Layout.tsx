import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Bot, Compass, AlertTriangle, User } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;
  const { t } = useLanguage();

  const isLinkActive = (targetPath: string) => {
    if (targetPath === "/" && path === "/") return true;
    if (targetPath !== "/" && path.startsWith(targetPath)) return true;
    return false;
  };

  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pageContainerRef.current) {
      pageContainerRef.current.scrollTo(0, 0);
    }
    const zauiPages = document.querySelectorAll('.zaui-page');
    zauiPages.forEach(page => {
      page.scrollTo(0, 0);
    });
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const showBottomNav = path !== "/chat" && path !== "/map";

  return (
    <div ref={pageContainerRef} className="page-container" style={showBottomNav ? {} : { paddingBottom: 0, height: "100dvh", overflow: "hidden" }}>
      {/* Dynamic Content */}
      <main style={showBottomNav ? { minHeight: "calc(100dvh - 60px)" } : { height: "100dvh", overflow: "hidden" }}>
        {children}
      </main>

      {/* Elegant Bottom Navigation Bar */}
      {showBottomNav && (
        <nav className="bottom-nav">
          <Link to="/" className={`nav-item ${isLinkActive("/") ? "nav-item-active" : ""}`} aria-label={t("nav.home")}>
            <Home size={22} aria-hidden="true" />
            <span>{t("nav.home")}</span>
          </Link>
          
          <Link to="/chat" className={`nav-item ${isLinkActive("/chat") ? "nav-item-active" : ""}`} aria-label={t("nav.chat")}>
            <Bot size={22} aria-hidden="true" />
            <span>{t("nav.chat")}</span>
          </Link>

          <Link to="/places" className={`nav-item ${isLinkActive("/places") ? "nav-item-active" : ""}`} aria-label={t("nav.places")}>
            <Compass size={22} aria-hidden="true" />
            <span>{t("nav.places")}</span>
          </Link>

          <Link to="/feedback" className={`nav-item ${isLinkActive("/feedback") ? "nav-item-active" : ""}`} aria-label={t("nav.feedback")}>
            <AlertTriangle size={22} aria-hidden="true" />
            <span>{t("nav.feedback")}</span>
          </Link>

          <Link to="/profile" className={`nav-item ${isLinkActive("/profile") ? "nav-item-active" : ""}`} aria-label={t("nav.profile")}>
            <User size={22} aria-hidden="true" />
            <span>{t("nav.profile")}</span>
          </Link>
        </nav>
      )}
    </div>
  );
};

export default Layout;
