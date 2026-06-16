import React from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface PageProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface HeaderProps {
  title?: React.ReactNode;
  showBackIcon?: boolean;
}

export const Page: React.FC<PageProps> = ({ children, className = "", style }) => {
  const location = useLocation();
  const routeName =
    location.pathname === "/"
      ? "home"
      : location.pathname
          .replace(/^\/+/, "")
          .replace(/\/+$/, "")
          .replace(/[^a-zA-Z0-9]+/g, "-") || "home";

  return (
    <section className={`web-page page-route-${routeName} ${className}`.trim()} style={style}>
      {children}
    </section>
  );
};

export const Header: React.FC<HeaderProps> = ({ title, showBackIcon = false }) => {
  const navigate = useNavigate();

  return (
    <header className="web-page-header">
      {showBackIcon && (
        <button
          type="button"
          className="web-back-button"
          onClick={() => navigate(-1)}
          aria-label="Quay lại"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
      )}
      <h1 className="web-page-title">{title}</h1>
    </header>
  );
};
