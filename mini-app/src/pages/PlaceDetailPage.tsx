import React, { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Header, Page } from "zmp-ui";
import { Play, Pause, RotateCcw, Volume2, Bot, Tag, Heart, MapPin, Check, AlertCircle, Sparkles } from "lucide-react";
import api, { TouristPlace, getAudioGuideUrl, hasAudioGuide, supabase } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

export const PlaceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [place, setPlace] = useState<TouristPlace | null>(null);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();
  
  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [currentTime, setCurrentTime] = useState("00:00");
  const [duration, setDuration] = useState("--:--");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Favorites State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // GPS Check-in State
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null); // in meters
  const [gpsLoading, setGpsLoading] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState<"none" | "checking" | "success" | "too_far">("none");
  const [checkinMessage, setCheckinMessage] = useState("");
  const [stampsCount, setStampsCount] = useState(0);
  const [rewardGranted, setRewardGranted] = useState(false);
  const [alreadyStamped, setAlreadyStamped] = useState(false);

  // 1. Fetch place by slug
  useEffect(() => {
    if (slug) {
      api.getPlaceBySlug(slug).then((data) => {
        setPlace(data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [slug]);

  // 2. Check Auth session & Favorites status & Stamp status on place load
  const checkAuthAndData = async () => {
    if (!place) return;
    try {
      const sessionRes = await supabase.auth.getSession();
      if (sessionRes.data.session) {
        setIsLoggedIn(true);
        
        // Check if favorited
        const favs = await api.getMyFavorites();
        setIsFavorited(favs.some(f => f.id === place.id));

        // Check if already stamped
        const stamps = await api.getMyStamps();
        const hasStamp = stamps.some(s => s.place_slug === place.slug);
        setAlreadyStamped(hasStamp);
        if (hasStamp) {
          setStampsCount(stamps.length);
        }
      }
    } catch (err) {
      console.warn("[Detail] Failed to check auth details:", err);
    }
  };

  useEffect(() => {
    if (place) {
      checkAuthAndData();
      requestUserLocation();
    }
  }, [place]);

  // 3. Request User GPS location & calculate distance
  const requestUserLocation = () => {
    if (!navigator.geolocation || !place) return;
    setGpsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        
        // Calculate distance
        const dist = calculateDistance(latitude, longitude, place.latitude, place.longitude);
        setDistance(dist);
        setGpsLoading(false);
      },
      (error) => {
        console.warn("[GPS] Location permission denied or unavailable:", error);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Haversine distance calculator
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000.0; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2.0) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2.0) ** 2;
    const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
    return R * c;
  };

  // 4. Handle active audio URL changes (VI/EN/KM toggle)
  useEffect(() => {
    if (!place) return () => {};
    
    // Stop any existing playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime("00:00");
    }

    const audioUrl = getAudioGuideUrl(place, language);
    if (audioUrl) {
      const audioObj = new Audio(audioUrl);
      audioRef.current = audioObj;

      const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      };

      const onTimeUpdate = () => {
        if (audioObj.duration) {
          const currentProgress = (audioObj.currentTime / audioObj.duration) * 100;
          setProgress(currentProgress);
          setCurrentTime(formatTime(audioObj.currentTime));
        }
      };

      const onLoadedMetadata = () => {
        setDuration(formatTime(audioObj.duration));
      };

      const onEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime("00:00");
      };

      audioObj.addEventListener("timeupdate", onTimeUpdate);
      audioObj.addEventListener("loadedmetadata", onLoadedMetadata);
      audioObj.addEventListener("ended", onEnded);

      return () => {
        audioObj.pause();
        audioObj.removeEventListener("timeupdate", onTimeUpdate);
        audioObj.removeEventListener("loadedmetadata", onLoadedMetadata);
        audioObj.removeEventListener("ended", onEnded);
      };
    } else {
      audioRef.current = null;
      return () => {};
    }
  }, [place, language]);

  const handlePlayPause = () => {
    if (!place) return;
    const hasAudio = hasAudioGuide(place, language);
    if (!hasAudio || !audioRef.current) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error("Audio playback error:", e);
        alert(language === "en" ? "Cannot play audio guide." : language === "km" ? "មិនអាចចាក់សំឡេងណែនាំបានទេ។" : "Không thể phát âm thanh thuyết minh.");
      });
    }
  };

  const handleReset = () => {
    setProgress(0);
    setCurrentTime("00:00");
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      alert(language === "en" ? "Please log in first!" : language === "km" ? "សូមចូលគណនីជាមុនសិន!" : "Vui lòng đăng nhập tài khoản trước!");
      navigate("/profile");
      return;
    }
    if (!place) return;
    
    setFavLoading(true);
    try {
      const res = await api.toggleFavorite(place.id);
      setIsFavorited(res.favorited);
    } catch (err: any) {
      console.error(err);
      alert("Lỗi thả tim: " + err.message);
    } finally {
      setFavLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!isLoggedIn) {
      alert(language === "en" ? "Please log in to check in and collect stamps!" : language === "km" ? "សូមចូលគណនីដើម្បី Check-in យកត្រា!" : "Vui lòng đăng nhập trước khi check-in nhận dấu ấn!");
      navigate("/profile");
      return;
    }
    if (!place || !userCoords) return;

    setCheckinStatus("checking");
    try {
      const res = await api.checkinPlace(place.slug, userCoords.latitude, userCoords.longitude);
      if (res.status === "success") {
        setCheckinStatus("success");
        setAlreadyStamped(true);
        setStampsCount(res.total_stamps);
        setRewardGranted(res.reward_granted);
        setCheckinMessage(res.message);
      } else {
        setCheckinStatus("too_far");
        setCheckinMessage(res.message);
      }
    } catch (err: any) {
      setCheckinStatus("too_far");
      setCheckinMessage(err.message || "Lỗi check-in GPS.");
    }
  };

  const handleAskAI = () => {
    if (place) {
      const placeName = language === "km" && place.name_km ? place.name_km : language === "en" && place.name_en ? place.name_en : place.name;
      const question = language === "km"
        ? `សូមប្រាប់ខ្ញុំអំពីប្រវត្តិ និងព័ត៌មានលម្អិតរបស់ ${placeName}`
        : language === "en" 
          ? `Tell me about the history and details of ${placeName}`
          : `Hãy kể sự tích và thông tin chi tiết về ${placeName}`;
      
      localStorage.setItem("preloaded_question", question);
      localStorage.setItem("preloaded_question_language", language);
      navigate("/chat");
    }
  };

  if (loading) {
    return (
      <Page>
        <Header title={t("nav.places")} showBackIcon={true} />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 120px)", color: "var(--primary-navy)" }}>
          <div className="common-loading">{t("common.loading")}</div>
        </div>
      </Page>
    );
  }

  if (!place) {
    return (
      <Page>
        <Header title={t("nav.places")} showBackIcon={true} />
        <div style={{ textAlign: "center", padding: "80px" }}>
          <h3>{t("common.no_data")}</h3>
          <Link to="/places" style={{ color: "var(--primary-navy)", fontWeight: 700 }}>
            {language === "en" ? "Back to list" : "Quay lại danh sách"}
          </Link>
        </div>
      </Page>
    );
  }

  const localizedName = language === "km" && place.name_km
    ? place.name_km
    : language === "en" && place.name_en
      ? place.name_en
      : place.name;

  const localizedDescription = language === "km" && place.full_description_km
    ? place.full_description_km
    : language === "km" && place.short_description_km
      ? place.short_description_km
      : language === "en" && place.full_description_en 
        ? place.full_description_en 
        : language === "en" && place.short_description_en 
          ? place.short_description_en 
          : place.full_description || place.short_description;

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
      <Header 
        title={localizedName} 
        showBackIcon={true} 
      />

      {/* Hero Image */}
      <div style={{ width: "100%", height: "220px", overflow: "hidden", position: "relative" }}>
        <img 
          src={place.image_url} 
          alt={localizedName} 
          width={375}
          height={220}
          loading="eager"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* Floating Heart Favorite Button */}
        <button
          onClick={handleToggleFavorite}
          disabled={favLoading}
          style={{ 
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "rgba(11, 37, 69, 0.75)", 
            border: "1px solid var(--accent-gold)", 
            cursor: "pointer", 
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isFavorited ? "var(--alert-red)" : "var(--cream-white)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            zIndex: 10
          }}
          aria-label="Thả tim lưu địa danh"
        >
          <Heart size={20} fill={isFavorited ? "var(--alert-red)" : "transparent"} />
        </button>

        <div style={{ 
          position: "absolute", 
          bottom: "16px", 
          left: "16px",
          backgroundColor: "rgba(11, 37, 69, 0.8)",
          border: "1px solid var(--accent-gold)",
          color: "var(--accent-gold)",
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: "6px"
        }}>
          <Tag size={12} aria-hidden="true" />
          <span>{getCategoryName(place.category)}</span>
        </div>
      </div>

      {/* GPS Check-in Area for Stamp Rally */}
      <div style={{ padding: "16px 16px 0 16px" }}>
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary-navy)", fontWeight: 800, fontSize: "14px" }}>
              <MapPin size={18} style={{ color: "var(--accent-gold)" }} />
              <span>{language === "en" ? "GPS Heritage Check-in" : language === "km" ? "Check-in បេតិកភណ្ឌ GPS" : "Check-in GPS Di Sản"}</span>
            </div>
            
            {distance !== null && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--light-text)" }}>
                Cách bạn: {distance < 1000 ? `${distance.toFixed(0)}m` : `${(distance / 1000).toFixed(1)}km`}
              </span>
            )}
          </div>

          {alreadyStamped ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontSize: "13px", fontWeight: 700, backgroundColor: "rgba(16,185,129,0.08)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(16,185,129,0.2)" }}>
              <Check size={18} style={{ strokeWidth: 3 }} />
              <span>{t("place.checkin.already")} ({t("profile.stamps_collected").replace("{count}", stampsCount.toString())})</span>
            </div>
          ) : (
            <>
              {distance !== null && distance <= 100.0 ? (
                <button
                  onClick={handleCheckin}
                  disabled={checkinStatus === "checking"}
                  className="submit-btn"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px" }}
                >
                  <MapPin size={16} />
                  <span>{checkinStatus === "checking" ? "..." : t("place.checkin.btn")}</span>
                </button>
              ) : (
                <div style={{
                  padding: "10px",
                  border: "1.5px dashed rgba(11,37,69,0.2)",
                  borderRadius: "10px",
                  backgroundColor: "rgba(0,0,0,0.01)",
                  fontSize: "12px",
                  color: "var(--light-text)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  lineHeight: "1.4"
                }}>
                  <AlertCircle size={16} style={{ color: "var(--alert-orange)", flexShrink: 0 }} />
                  <span>
                    {gpsLoading ? (
                      language === "en"
                        ? "Detecting GPS position..."
                        : language === "km"
                          ? "កំពុងស្វែងរកទីតាំង GPS..."
                          : "Đang xác định vị trí GPS của bạn..."
                    ) : distance === null ? (
                      language === "en" 
                        ? "Unable to detect GPS position. Please allow location access." 
                        : language === "km" 
                          ? "មិនអាចរកទីតាំង GPS បានទេ។ សូមអនុញ្ញាតឲ្យបើក GPS។" 
                          : "Không thể lấy vị trí GPS. Hãy kiểm tra cài đặt vị trí để check-in."
                    ) : t("place.checkin.too_far").replace("{dist}", distance.toFixed(0))}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Success Check-in Pop-up Notification */}
          {checkinStatus === "success" && (
            <div className="fade-in-up" style={{ padding: "12px", backgroundColor: "rgba(16, 185, 129, 0.08)", color: "#10b981", borderRadius: "10px", border: "1.5px solid rgba(16, 185, 129, 0.3)", fontSize: "12.5px" }}>
              <div style={{ fontWeight: 800, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", color: "#10b981" }}>
                <Sparkles size={16} style={{ color: "var(--accent-gold)" }} />
                <span>{t("place.checkin.success")}</span>
              </div>
              <p style={{ margin: "4px 0 0 0", opacity: 0.9, color: "var(--primary-navy)" }}>
                {checkinMessage}
              </p>
              {rewardGranted && (
                <div style={{ marginTop: "8px", padding: "8px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "8px", fontWeight: 700, fontSize: "12px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <Sparkles size={14} style={{ color: "var(--accent-gold)" }} />
                  <span>
                    {language === "en" 
                      ? "You have collected all heritage stamps! Memory unlocked!"
                      : language === "km"
                        ? "អ្នកបានប្រមូលត្រាបេតិកភណ្ឌទាំងអស់ហើយ! ការចងចាំត្រូវបានដោះសោ!"
                        : "Bạn đã thu thập đủ toàn bộ dấu ấn di sản! Mở khóa kỷ niệm hành trình!"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audio Guide Player — only shown when place has audio_url */}
      {(() => {
        const audioUrl = getAudioGuideUrl(place, language);
        if (!audioUrl) return null;
        return (
          <div className="audio-player-card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Volume2 size={20} style={{ color: "var(--accent-gold)" }} aria-hidden="true" />
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
                  {language === "en" ? "Automated Audio Guide" : language === "km" ? "មគ្គុទ្ទេសក៍សំឡេងស្វ័យប្រវត្ត" : "Thuyết minh số tự động (Audio Guide)"}
                </h3>
                <p style={{ fontSize: "11px", opacity: 0.8, margin: 0 }}>
                  {language === "en" ? "Listen to the historical narration of this attraction" : language === "km" ? "ស្តាប់ការនិទានប្រវត្តិនៃទីកន្លែងទាក់ទាញនេះ" : "Nghe diễn giải câu chuyện lịch sử di tích"}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "16px" }}>
              <span style={{ fontSize: "11px", fontFamily: "monospace" }}>{currentTime}</span>
              <div style={{ flex: 1, height: "6px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", backgroundColor: "var(--accent-gold)", borderRadius: "3px" }} />
              </div>
              <span style={{ fontSize: "11px", fontFamily: "monospace" }}>{duration}</span>
            </div>

            {/* Controls */}
            <div className="audio-controls">
              <button
                className="audio-btn"
                onClick={handleReset}
                style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label={language === "en" ? "Restart audio narration" : "Nghe lại từ đầu"}
              >
                <RotateCcw size={20} aria-hidden="true" />
              </button>

              <button
                className="audio-btn audio-play-pause"
                onClick={handlePlayPause}
                aria-label={isPlaying ? (language === "en" ? "Pause" : "Tạm dừng") : (language === "en" ? "Play" : "Phát")}
              >
                {isPlaying
                  ? <Pause size={22} style={{ fill: "var(--primary-navy)" }} aria-hidden="true" />
                  : <Play size={22} style={{ fill: "var(--primary-navy)", marginLeft: "2px" }} aria-hidden="true" />}
              </button>

              <button
                className="audio-btn"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  padding: "0 16px",
                  borderRadius: "22px",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "44px"
                }}
                onClick={handlePlayPause}
                aria-label={isPlaying ? (language === "en" ? "Stop" : "Dừng") : (language === "en" ? "Play Narration" : "Nghe thuyết minh")}
              >
                {isPlaying ? (language === "en" ? "Playing..." : "Đang phát...") : (language === "en" ? "Play Narration" : language === "km" ? "ចាក់សំឡេង" : "Phát Thuyết Minh")}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Description Text details */}
      <div style={{ padding: "16px 16px 20px 16px" }}>
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ fontSize: "16px", color: "var(--primary-navy)", fontWeight: 700, borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "6px" }}>
            {language === "en" ? "History & Narration" : language === "km" ? "ប្រវត្តិ និងការអធិប្បាយ" : "Lịch sử & Diễn giải di tích"}
          </h2>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--dark-text)", whiteSpace: "pre-line" }}>
            {localizedDescription}
          </p>

          {/* Deep link button to chat */}
          <button 
            onClick={handleAskAI}
            style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              backgroundColor: "var(--cream-white)",
              color: "var(--primary-navy)",
              border: "2px solid var(--accent-gold)",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <Bot size={16} />
            <span>
              {language === "km" 
                ? `សួរជំនួយការ AI អំពីចំណុចនេះ` 
                : language === "en" 
                  ? "Ask AI Assistant about this" 
                  : "Hỏi Trợ lý AI về điểm này"}
            </span>
          </button>
        </div>
      </div>
    </Page>
  );
};

export default PlaceDetailPage;
