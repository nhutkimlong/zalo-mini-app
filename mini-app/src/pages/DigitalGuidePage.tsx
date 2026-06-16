import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header, Page } from "../components/WebPrimitives";
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
        title={language === "km" ? "បណ្ណាល័យសំឡេងណែនាំឌីជីថល" : language === "en" ? "Digital Audio Guides Library" : "Kho thuyết minh số di tích"}
        showBackIcon={true}
      />

      <div className="guide-container">
        <div className="glass-card guide-intro-card">
          <Volume2 size={18} style={{ color: "var(--site-gold)", flexShrink: 0, marginTop: "2px" }} />
          <p className="guide-intro-text">
            {language === "km"
              ? "ប្រព័ន្ធរៀបរាប់ឌីជីថលស្វ័យប្រវត្តិ (Audio Guide) ផ្តល់នូវព័ត៌មានស្រាវជ្រាវប្រវត្តិសាស្ត្រត្រឹមត្រូវអំពីទីកន្លែងសក្ការៈបូជា និងព្រះវិហារនៅតំបន់កេរដំណែលជាតិភ្នំ Ba Den ខេត្ត Tây Ninh។ សូមដោតកាសរបស់អ្នកដើម្បីទទួលបានបទពិសោធន៍ល្អបំផុត។"
              : language === "en"
                ? "The automated digital narration system (Audio Guide) provides accurate historical research information about the pilgrimage sites and temples at the Tay Ninh Black Lady Mountain National Relic Area. Please plug in your headphones for the best experience."
                : "Hệ thống thuyết minh số tự động (Audio Guide) cung cấp thông tin lịch sử khảo cứu chính xác về các địa điểm hành hương, đền đài tại Khu di tích Quốc gia Núi Bà Đen Tây Ninh. Du khách vui lòng cắm tai nghe để có trải nghiệm tốt nhất."}
          </p>
        </div>

        {/* Audio Guides List */}
        <div className="guide-list">
          {loading ? (
            <div className="empty-state-text">
              {language === "km" ? "កំពុងទាញយកបញ្ជីសំឡេងណែនាំ..." : language === "en" ? "Loading audio guides list..." : "Đang tải danh sách thuyết minh..."}
            </div>
          ) : (() => {
            const audioPlaces = places.filter((place) => hasAudioGuide(place, language));
            if (audioPlaces.length === 0) {
              return (
                <div className="empty-state-text">
                  {language === "km" ? "មិនទាន់មានសំឡេងណែនាំនៅឡើយទេ។" : language === "en" ? "No audio guides are available yet." : "Chưa có bài thuyết minh số khả dụng."}
                </div>
              );
            }
            return audioPlaces.map((place, index) => {
              const localizedName = language === "km" && place.name_km ? place.name_km : language === "en" && place.name_en ? place.name_en : place.name;
              return (
                <div 
                  key={place.id}
                  className="glass-card guide-card-item fade-in-up"
                  style={{
                    animationDelay: `${index * 0.05}s`
                  }}
                >
                  {(() => {
                    const hasAudio = hasAudioGuide(place, language);
                    return (
                      <>
                        <div className="guide-card-left">
                          <div className={`guide-icon-circle ${hasAudio ? "has-audio" : "no-audio"}`}>
                            <Headphones size={20} style={{ color: hasAudio ? "var(--site-navy)" : "#888" }} aria-hidden="true" />
                          </div>
                          <div>
                            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--site-navy)", margin: "0 0 2px 0" }}>
                              {localizedName}
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--site-muted)" }}>
                              <BookOpen size={10} aria-hidden="true" />
                              <span>
                                {language === "km"
                                  ? `មេរៀនស្តាប់ណែនាំ • ${durations[place.id] || "--:--"} នាទី`
                                  : language === "en"
                                    ? `Audio guide narration • ${durations[place.id] || "--:--"} mins`
                                    : `Bài nghe thuyết minh • ${durations[place.id] || "--:--"} phút`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {hasAudio ? (
                          <Link 
                            to={`/places/${place.slug}`}
                            className="guide-play-btn"
                            aria-label={language === "km" ? `ស្តាប់សំឡេងណែនាំ ${localizedName}` : language === "en" ? `Listen to ${localizedName} audio guide` : `Nghe thuyết minh di tích ${localizedName}`}
                          >
                            <Play size={16} style={{ fill: "var(--site-gold)", marginLeft: "2px" }} aria-hidden="true" />
                          </Link>
                        ) : (
                          <span className="guide-no-audio-badge">
                            {language === "km" ? "គ្មានសំឡេង" : language === "en" ? "No audio" : "Chưa có audio"}
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
