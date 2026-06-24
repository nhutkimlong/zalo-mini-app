import React from "react";
import cx from "../utils/cx";
import styles from "../app.module.css";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonText: React.FC<SkeletonProps & { lines?: number; lastWidth?: string }> = ({
  lines = 3,
  lastWidth = "60%",
  style,
}) => (
  <div style={style}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={cx(styles, "skeleton skeleton-text")}
        style={{ width: i === lines - 1 ? lastWidth : "100%" }}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<SkeletonProps & { height?: number }> = ({
  height = 120,
  style,
}) => (
  <div className={cx(styles, "skeleton skeleton-card")} style={{ height, ...style }} />
);

export const SkeletonAvatar: React.FC<SkeletonProps> = ({ style }) => (
  <div className={cx(styles, "skeleton skeleton-avatar")} style={style} />
);

export const SkeletonPlaceCard: React.FC = () => (
  <div
    style={{
      borderRadius: 16,
      overflow: "hidden",
      background: "var(--cream-white)",
      border: "1px solid rgba(11, 37, 69, 0.08)",
    }}
  >
    <div className={cx(styles, "skeleton")} style={{ height: 140 }} />
    <div style={{ padding: "12px" }}>
      <div className={cx(styles, "skeleton skeleton-title")} style={{ width: "75%" }} />
      <div className={cx(styles, "skeleton skeleton-text")} style={{ width: "100%" }} />
      <div className={cx(styles, "skeleton skeleton-text")} style={{ width: "50%" }} />
    </div>
  </div>
);

export const SkeletonHomePage: React.FC = () => (
  <>
    <div className={cx(styles, "skeleton")} style={{ height: 260, borderRadius: 0 }} />
    <div style={{ padding: "12px 16px" }}>
      <div className={cx(styles, "skeleton skeleton-card")} style={{ height: 80 }} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "0 16px" }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={cx(styles, "skeleton")} style={{ height: 100, borderRadius: 16 }} />
      ))}
    </div>
  </>
);

export const SkeletonChatMessage: React.FC<{ isUser?: boolean }> = ({ isUser }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: isUser ? "flex-end" : "flex-start",
      gap: 10,
    }}
  >
    {!isUser && (
      <div className={cx(styles, "skeleton skeleton-avatar")} style={{ width: 36, height: 36 }} />
    )}
    <div
      className={cx(styles, "skeleton")}
      style={{
        height: 60,
        borderRadius: 16,
        maxWidth: "65%",
        width: isUser ? "55%" : "65%",
      }}
    />
  </div>
);

export default SkeletonText;
