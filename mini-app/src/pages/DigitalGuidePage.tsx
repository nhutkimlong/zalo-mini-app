import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Page } from "zmp-ui";
import { Headphones, Play, BookOpen, Volume2 } from "lucide-react";
import api, { TouristPlace, hasAudioGuide, getAudioGuideUrl } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export const DigitalGuidePage: React.FC = () => {
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [durations, setDurations] = useState<{ [placeId: string]: string }>({});
  const { language } = useLanguage();

  useEffect(() => {
    api.getPlaces().then((data) => {
      setPlaces(data);
      setLoading(false);

      // Load actual durations dynamically from audio metadata
      data.forEach((place) => {
        const audioUrl = getAudioGuideUrl(place, language);
        if (audioUrl) {
          const audio = new Audio(audioUrl);
          const onLoadedMetadata = () => {
            const mins = Math.floor(audio.duration / 60);
            const secs = Math.floor(audio.duration % 60);
            setDurations((prev) => ({
              ...prev,
              [place.id]: `${mins}:${secs.toString().padStart(2, "0")}`
            }));
          };
          audio.addEventListener("loadedmetadata", onLoadedMetadata);
          audio.load();
        }
      });
    });
  }, [language]);

  return (
    <Page>
      {/* Header */}
      <Header
        title={language === "en" ? "Digital Audio Guides Library" : "Kho thuyết minh số di tích"}
        showBackIcon={true}
      />

      <div style={{ padding: "16px" }}>
        <div className="glass-card" style={{ background: "rgba(11, 37, 69, 0.03)", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <Volume2 size={18} style={{ color: "var(--accent-gold)", flexShrink: 0, marginTop: "2px" }} />
          <p style={{ fontSize: "13px", color: "var(--light-text)", margin: 0, lineHeight: 1.6 }}>
            {language === "en"
              ? "The automated digital narration system (Audio Guide) provides accurate historical research information about the pilgrimage sites and temples at the Tay Ninh Black Lady Mountain National Relic Area. Please plug in your headphones for the best experience."
              : "Hệ thống thuyết minh số tự động (Audio Guide) cung cấp thông tin lịch sử khảo cứu chính xác về các địa điểm hành hương, đền đài tại Khu di tích Quốc gia Núi Bà Đen Tây Ninh. Du khách vui lòng cắm tai nghe để có trải nghiệm tốt nhất."}
          </p>
        </div>

        {/* Audio Guides List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--light-text)" }}>
              {language === "en" ? "Loading audio guides list..." : "Đang tải danh sách thuyết minh..."}
            </div>
          ) : (() => {
            const audioPlaces = places.filter((place) => hasAudioGuide(place, language));
            if (audioPlaces.length === 0) {
              return (
                <div style={{ textAlign: "center", padding: "30px", color: "var(--light-text)" }}>
                  {language === "en" ? "No audio guides are available yet." : "Chưa có bài thuyết minh số khả dụng."}
                </div>
              );
            }
            return audioPlaces.map((place, index) => {
              const localizedName = language === "en" && place.name_en ? place.name_en : place.name;
              return (
                <div 
                  key={place.id}
                  className="glass-card fade-in-up"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    animationDelay: `${index * 0.05}s`
                  }}
                >
                  {(() => {
                    const hasAudio = hasAudioGuide(place, language);
                    return (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, marginRight: "12px" }}>
                          <div style={{ 
                            width: "42px", 
                            height: "42px", 
                            borderRadius: "50%", 
                            backgroundColor: hasAudio ? "rgba(212,175,55,0.15)" : "rgba(0,0,0,0.06)", 
                            color: hasAudio ? "var(--primary-navy)" : "#888", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            flexShrink: 0,
                            opacity: hasAudio ? 1 : 0.6
                          }}>
                            <Headphones size={20} style={{ color: hasAudio ? "var(--primary-navy)" : "#888" }} aria-hidden="true" />
                          </div>
                          <div>
                            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary-navy)", margin: "0 0 2px 0" }}>
                              {localizedName}
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--light-text)" }}>
                              <BookOpen size={10} aria-hidden="true" />
                              <span>
                                {language === "en"
                                  ? `Audio guide narration • ${durations[place.id] || "--:--"} mins`
                                  : `Bài nghe thuyết minh • ${durations[place.id] || "--:--"} phút`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {hasAudio ? (
                          <Link 
                            to={`/places/${place.slug}`}
                            style={{
                              backgroundColor: "var(--primary-navy)",
                              color: "var(--accent-gold)",
                              border: "1px solid var(--accent-gold)",
                              borderRadius: "50%",
                              width: "44px",
                              height: "44px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textDecoration: "none",
                              boxShadow: "0 2px 4px rgba(11, 37, 69, 0.2)",
                              cursor: "pointer",
                              flexShrink: 0
                            }}
                            aria-label={language === "en" ? `Listen to ${localizedName} audio guide` : `Nghe thuyết minh di tích ${localizedName}`}
                          >
                            <Play size={16} style={{ fill: "var(--accent-gold)", marginLeft: "2px" }} aria-hidden="true" />
                          </Link>
                        ) : (
                          <span style={{
                            backgroundColor: "rgba(0, 0, 0, 0.05)",
                            border: "1px solid rgba(0, 0, 0, 0.1)",
                            color: "#888",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "6px 12px",
                            borderRadius: "14px",
                            flexShrink: 0,
                            display: "inline-block"
                          }}>
                            {language === "en" ? "No audio" : "Chưa có audio"}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </Page>
  );
};

export default DigitalGuidePage;
