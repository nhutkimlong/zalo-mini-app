import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Page } from "../components/WebPrimitives";
import { MapPin, Map } from "lucide-react";
import api, { TouristPlace } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { useDragScroll } from "../hooks/useDragScroll";
import cx from "../utils/cx";
import styles from "../app.module.css";

type CategoryFilter = "all" | "tam_linh" | "phong_canh" | "dich_vu";

const SkeletonCard = () => (
  <div className={cx(styles, "glass-card place-skeleton-card")}>
    <div className={cx(styles, "skeleton place-skeleton-img")} />
    <div className={cx(styles, "place-skeleton-info")}>
      <div className={cx(styles, "skeleton place-skeleton-title")} />
      <div className={cx(styles, "skeleton place-skeleton-desc")} />
      <div className={cx(styles, "skeleton place-skeleton-meta")} />
    </div>
  </div>
);

export const PlacesPage: React.FC = () => {
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();
  const tabsRef = useDragScroll();

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
      <Header title={t("places.title")} showBackIcon={true} />

      <div className={cx(styles, "places-filter-container")} ref={tabsRef}>
        {(["all", "tam_linh", "phong_canh", "dich_vu"] as CategoryFilter[]).map((filter) => (
          <button
            key={filter}
            className={cx(styles, `filter-btn ${activeFilter === filter ? "active" : ""}`)}
            onClick={() => setActiveFilter(filter)}
          >
            {filter === "all" ? t("places.all") : getCategoryName(filter)}
          </button>
        ))}
      </div>

      <div className={cx(styles, "places-list-container")}>
        {loading ? (
          [1, 2, 3].map((i) => <SkeletonCard key={i} />)
        ) : places.length === 0 ? (
          <div className={cx(styles, "empty-state-text")}>
            {t("common.no_data")}
          </div>
        ) : (
          places.map((place, index) => {
            const localizedName = language === "km" && place.name_km ? place.name_km : language === "en" && place.name_en ? place.name_en : place.name;
            const localizedDesc = language === "km" && place.short_description_km ? place.short_description_km : language === "en" && place.short_description_en ? place.short_description_en : place.short_description;
            return (
              <Link 
                key={place.id}
                to={`/places/${place.slug}`}
                className={cx(styles, "glass-card place-card-link fade-in-up")}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={cx(styles, "place-card-img-wrapper")}>
                  <img src={place.image_url} alt={localizedName} className={cx(styles, "place-card-img")} />
                </div>
                <div className={cx(styles, "place-card-info")}>
                  <h3 className={cx(styles, "place-card-title")}>{localizedName}</h3>
                  <p className={cx(styles, "place-card-desc")}>{localizedDesc}</p>
                  <div className={cx(styles, "place-card-meta")}>
                    <MapPin size={12} />
                    <span>{getCategoryName(place.category)}</span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <Link
        to="/map"
        className={cx(styles, "place-floating-map-btn")}
      >
        <Map size={20} />
        <span>
          {language === "km" ? "មើលផែនទី" : language === "vi" ? "Xem Bản Đồ" : "View Map"}
        </span>
      </Link>
    </Page>
  );
};

export default PlacesPage;
