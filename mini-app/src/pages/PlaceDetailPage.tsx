import React, { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Header, Page } from "../components/WebPrimitives";
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
  const requestUserLocation = (isManual: boolean = false) => {
    if (!place) return;
    
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!window.isSecureContext && !isLocalhost) {
      if (isManual) {
        alert(
          language === "en"
            ? "GPS geolocation requires a secure connection (HTTPS). Please access via HTTPS."
            : "Định vị GPS yêu cầu kết nối bảo mật (HTTPS). Vui lòng truy cập qua địa chỉ HTTPS."
        );
      }
      setDistance(null);
      setGpsLoading(false);
      return;
    }

    setGpsLoading(true);

    // Try Permissions API query
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" }).then((status) => {
        if (status.state === "denied") {
          if (isManual) {
            alert(
              language === "en"
                ? "Location access is blocked. Please enable location permissions in your browser settings to use this feature."
                : "Quyền truy cập vị trí đã bị chặn. Vui lòng cấp quyền truy cập vị trí trong cài đặt trang web của trình duyệt để sử dụng tính năng này."
            );
          }
          setDistance(null);
          setGpsLoading(false);
        } else {
          triggerLocationRequest(isLocalhost, isManual);
        }
      }).catch((e) => {
        console.warn("Permissions API query failed:", e);
        triggerLocationRequest(isLocalhost, isManual);
      });
    } else {
      triggerLocationRequest(isLocalhost, isManual);
    }
  };

  const triggerLocationRequest = (isLocalhost: boolean, isManual: boolean) => {
    if (!navigator.geolocation || !place) {
      if (isManual) {
        alert(language === "en" ? "Geolocation is not supported by your browser." : "Định vị GPS không được trình duyệt của bạn hỗ trợ.");
      }
      setDistance(null);
      setGpsLoading(false);
      return;
    }

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
        
        // Fallback to Mount Ba Den coordinates ONLY on localhost for development testing
        if (isLocalhost) {
          console.warn("[GPS] Localhost fallback: Defaulting to Mount Ba Den coordinates.");
          const mockLat = 11.375641;
          const mockLng = 106.174648;
          setUserCoords({ latitude: mockLat, longitude: mockLng });
          const dist = calculateDistance(mockLat, mockLng, place.latitude, place.longitude);
          setDistance(dist);
        } else {
          setDistance(null);
          if (isManual) {
            const isPermissionError = error && (error.code === 1 || String(error.message).toLowerCase().includes("denied"));
            if (isPermissionError) {
              alert(
                language === "en"
                  ? "Location permission denied. Please allow location access in your browser settings."
                  : "Quyền định vị bị từ chối. Vui lòng cấp quyền truy cập vị trí trên trình duyệt để sử dụng tính năng này."
              );
            } else {
              alert(
                language === "en"
                  ? "GPS access failed. Please ensure location services are enabled."
                  : "Lỗi truy cập định vị GPS. Vui lòng kiểm tra dịch vụ vị trí của thiết bị."
              );
            }
          }
        }
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && audioRef.current.duration) {
      const seekValue = parseFloat(e.target.value);
      const newTime = (seekValue / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(seekValue);
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
        setRewardGranted(res.reward_granted);
      } else {
        setCheckinStatus("too_far");
      }
    } catch (err: any) {
      setCheckinStatus("too_far");
    }
  };

  const handleAskAI = () => {
    if (place) {
      const placeName = language === "km" && place.name_km ? place.name_km : language === "en" && place.name_en ? place.name_en : place.name;
      const isSpiritual = place.category === "tam_linh";
      let question = "";
      if (language === "km") {
        question = isSpiritual 
          ? `សូមប្រាប់ខ្ញុំអំពីប្រវត្តិ និងព័ត៌មានលម្អិតរបស់ ${placeName}`
          : `សូមផ្តល់ព័ត៌មានលម្អិតអំពី ${placeName}`;
      } else if (language === "en") {
        question = isSpiritual
          ? `Tell me about the history and details of ${placeName}`
          : `Tell me detailed information about ${placeName}`;
      } else {
        question = isSpiritual
          ? `Hãy kể sự tích và thông tin chi tiết về ${placeName}`
          : `Hãy cung cấp thông tin chi tiết về ${placeName}`;
      }
      
      localStorage.setItem("preloaded_question", question);
      localStorage.setItem("preloaded_question_language", language);
      navigate("/chat");
    }
  };

  if (loading) {
    return (
      <Page>
        <Header title={t("nav.places")} showBackIcon={true} />
        <div className="detail-loader-container">
          <div className="common-loading">{t("common.loading")}</div>
        </div>
      </Page>
    );
  }

  if (!place) {
    return (
      <Page>
        <Header title={t("nav.places")} showBackIcon={true} />
        <div className="detail-empty-container">
          <h3>{t("common.no_data")}</h3>
          <Link to="/places" className="detail-empty-back-link">
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
      <div className="detail-hero-wrapper">
        <img 
          src={place.image_url} 
          alt={localizedName} 
          width={375}
          height={220}
          loading="eager"
          className="detail-hero-img"
        />

        {/* Floating Heart Favorite Button */}
        <button
          onClick={handleToggleFavorite}
          disabled={favLoading}
          className={`detail-fav-btn ${isFavorited ? "is-favorited" : ""}`}
          aria-label="Thả tim lưu địa danh"
        >
          <Heart size={20} fill={isFavorited ? "var(--alert-red)" : "transparent"} />
        </button>

        <div className="detail-category-badge">
          <Tag size={12} aria-hidden="true" />
          <span>{getCategoryName(place.category)}</span>
        </div>
      </div>

      {/* GPS Check-in Area for Stamp Rally */}
      {isLoggedIn && (
      <div className="detail-gps-container">
        <div className="glass-card detail-card-content">
          <div className="detail-gps-header">
            <div className="detail-gps-title-wrapper">
              <MapPin size={18} className="gold-text-icon" />
              <span>{language === "en" ? "GPS Heritage Check-in" : language === "km" ? "Check-in បេតិកភណ្ឌ GPS" : "Check-in GPS Di Sản"}</span>
            </div>
            
            {distance !== null && (
              <span className="detail-gps-distance-text">
                Cách bạn: {distance < 1000 ? `${distance.toFixed(0)}m` : `${(distance / 1000).toFixed(1)}km`}
              </span>
            )}
          </div>

          {alreadyStamped && checkinStatus !== "success" ? (
            <div className="detail-gps-success-box">
              <Check size={18} className="stroke-width-3" />
              <span>{t("place.checkin.already")}</span>
            </div>
          ) : (
            <>
              {distance !== null && distance <= 100.0 ? (
                <button
                  onClick={handleCheckin}
                  disabled={checkinStatus === "checking"}
                  className="submit-btn detail-checkin-btn-content"
                >
                  <MapPin size={16} />
                  <span>{checkinStatus === "checking" ? "..." : t("place.checkin.btn")}</span>
                </button>
              ) : (
                <div className="detail-gps-status-box">
                  <div className="detail-gps-status-left">
                    <AlertCircle size={16} className="alert-orange-icon" />
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
                  {!gpsLoading && (
                    <button
                      type="button"
                      onClick={() => requestUserLocation(true)}
                      className="detail-gps-refresh-btn"
                    >
                      {language === "en" ? "Refresh" : language === "km" ? "ធ្វើបច្ចុប្បន្នភាព" : "Cập nhật"}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Success Check-in Pop-up Notification */}
          {checkinStatus === "success" && (
            <div className="detail-gps-success-box fade-in-up">
              <div className="detail-checkin-success-header">
                <Sparkles size={16} className="gold-text-icon" />
                <span>{t("place.checkin.success")}</span>
              </div>
              {rewardGranted && (
                <div className="detail-gps-success-reward">
                  <Sparkles size={14} className="gold-text-icon" />
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
      )}

      {/* Audio Guide Player — only shown when place has audio_url */}
      {(() => {
        const audioUrl = getAudioGuideUrl(place, language);
        if (!audioUrl) return null;
        return (
          <div className="audio-player-card">
            <div className="detail-audio-header">
              <Volume2 size={20} className="gold-text-icon" aria-hidden="true" />
              <div>
                <h3 className="detail-audio-title">
                  {language === "en" ? "Automated Audio Guide" : language === "km" ? "មគ្គុទ្ទេសក៍សំឡេងស្វ័យប្រវត្ត" : "Thuyết minh số tự động (Audio Guide)"}
                </h3>
                <p className="detail-audio-subtitle">
                  {language === "en" ? "Listen to the historical narration of this attraction" : language === "km" ? "ស្តាប់ការនិទានប្រវត្តិនៃទីកន្លែងទាក់ទាញនេះ" : "Nghe diễn giải câu chuyện lịch sử di tích"}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="detail-audio-progress-bar">
              <span className="detail-audio-time-label">{currentTime}</span>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={progress}
                onChange={handleSeek}
                className="audio-slider-input"
                style={{
                  background: `linear-gradient(to right, var(--site-gold) 0%, var(--site-gold) ${progress}%, rgba(255, 255, 255, 0.2) ${progress}%, rgba(255, 255, 255, 0.2) 100%)`
                }}
              />
              <span className="detail-audio-time-label">{duration}</span>
            </div>

            {/* Controls */}
            <div className="audio-controls">
              <button
                className="audio-btn detail-audio-reset-btn"
                onClick={handleReset}
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
                  ? <Pause size={22} className="fill-navy" aria-hidden="true" />
                  : <Play size={22} className="fill-navy margin-left-2" aria-hidden="true" />}
              </button>

              <button
                className="audio-btn detail-audio-play-text-btn"
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
      <div className="detail-section-wrapper">
        <div className="glass-card detail-card-content">
          <h2 className="detail-section-title">
            {language === "en" ? "History & Narration" : language === "km" ? "ប្រវត្តិ និងការអធិប្បាយ" : "Lịch sử & Diễn giải di tích"}
          </h2>
          <p className="detail-body-text">
            {localizedDescription}
          </p>

          {/* Deep link button to chat */}
          <button 
            onClick={handleAskAI}
            className="detail-ai-ask-btn"
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
