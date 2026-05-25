import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Page } from "zmp-ui";
import { MapPin, Map } from "lucide-react";
import api, { TouristPlace } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

type CategoryFilter = "all" | "tam_linh" | "phong_canh" | "dich_vu";

export const PlacesPage: React.FC = () => {
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    setLoading(true);
    const filterCat = activeFilter === "all" ? undefined : activeFilter;
    api.getPlaces(filterCat).then((data) => {
      setPlaces(data);
      setLoading(false);
    });
  }, [activeFilter]);

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case "tam_linh": return t("places.tam_linh");
      case "phong_canh": return t("places.phong_canh");
      case "dich_vu": return t("places.dich_vu");
      default: return t("places.all");
    }
  };

  return (
    <Page>
      {/* Header */}
      <Header title={t("places.title")} showBackIcon={true} />

      {/* Category filters row */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        padding: "16px 16px 8px 16px", 
        overflowX: "auto",
        whiteSpace: "nowrap"
      }}>
        {(["all", "tam_linh", "phong_canh", "dich_vu"] as CategoryFilter[]).map((filter) => (
          <button
            key={filter}
            className="glass-card"
            style={{
              padding: "8px 16px",
              fontSize: "12.5px",
              fontWeight: 700,
              boxShadow: "none",
              backgroundColor: activeFilter === filter ? "var(--primary-navy)" : "var(--cream-white)",
              color: activeFilter === filter ? "var(--accent-gold)" : "var(--light-text)",
              border: activeFilter === filter ? "1px solid var(--accent-gold)" : "1px solid rgba(0,0,0,0.06)",
              borderRadius: "8px",
              cursor: "pointer"
            }}
            onClick={() => setActiveFilter(filter)}
          >
            {filter === "all" ? t("places.all") : getCategoryName(filter)}
          </button>
        ))}
      </div>

      {/* Places cards grid */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--light-text)", fontWeight: 600 }}>
            {t("common.loading")}
          </div>
        ) : places.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--light-text)" }}>
            {t("common.no_data")}
          </div>
        ) : (
          places.map((place, index) => (
            <Link 
              key={place.id}
              to={`/places/${place.slug}`}
              className="glass-card fade-in-up"
              style={{
                display: "flex",
                gap: "12px",
                textDecoration: "none",
                color: "var(--dark-text)",
                padding: "12px",
                animationDelay: `${index * 0.05}s`
              }}
            >
              {/* Thumbnail Image */}
              <div style={{ position: "relative", width: "90px", height: "90px", borderRadius: "10px", overflow: "hidden", flexShrink: 0 }}>
                <img 
                  src={place.image_url} 
                  alt={language === "en" && place.name_en ? place.name_en : place.name}
                  width={90}
                  height={90}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <span style={{ 
                   position: "absolute", 
                   top: "4px", 
                   left: "4px", 
                   fontSize: "9px", 
                   fontWeight: 700,
                   backgroundColor: "var(--primary-navy)",
                   color: "var(--accent-gold)",
                   padding: "2px 6px",
                   borderRadius: "4px"
                 }}>
                  {getCategoryName(place.category)}
                </span>
              </div>

              {/* Text Description */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 4px 0", color: "var(--primary-navy)" }}>
                    {language === "en" && place.name_en ? place.name_en : place.name}
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--light-text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {language === "en" && place.short_description_en ? place.short_description_en : place.short_description}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--light-text)", fontWeight: 600 }}>
                  <MapPin size={11} style={{ stroke: "var(--accent-gold)", strokeWidth: 3 }} aria-hidden="true" />
                  <span>
                    {language === "vi" ? "Xem thuyết minh & nghe audio guide" : "View details & listen to audio guide"}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Floating Map Toggle FAB */}
      <Link
        to="/map"
        className="floating-ai-btn pulse-gold-border"
        style={{
          position: "fixed",
          bottom: "80px",
          right: "20px",
          width: "auto",
          height: "48px",
          borderRadius: "24px",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
          zIndex: 99,
          boxShadow: "0 4px 16px rgba(11, 37, 69, 0.35)"
        }}
      >
        <Map size={20} />
        <span style={{ fontSize: "13px", fontWeight: 700 }}>
          {language === "vi" ? "Xem Bản Đồ" : "View Map"}
        </span>
      </Link>
    </Page>
  );
};

export default PlacesPage;
