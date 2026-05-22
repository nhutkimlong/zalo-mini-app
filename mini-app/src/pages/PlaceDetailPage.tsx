import React, { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, MessageSquare, Tag } from "lucide-react";
import api, { TouristPlace, getAudioGuideUrl, hasAudioGuide } from "../services/api";
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
  const [duration, setDuration] = useState("03:15");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (slug) {
      api.getPlaceBySlug(slug).then((data) => {
        setPlace(data);
        setLoading(false);
      });
    }
  }, [slug]);

  // Handle active audio URL changes (VI/EN toggle)
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
        // Fallback simulate
        setIsPlaying(true);
      });
    }
  };

  // Ticker simulation fallback if no audio URL is present or fails to play
  useEffect(() => {
    let interval: any;
    if (isPlaying && place && !hasAudioGuide(place, language)) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          const next = prev + 0.5;
          const totalSecs = Math.floor((next / 100) * 195); // 195s = 3m15s
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          setCurrentTime(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
          return next;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, place, language]);

  const handleReset = () => {
    setProgress(0);
    setCurrentTime("00:00");
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
  };

  const handleAskAI = () => {
    if (place) {
      const placeName = language === "en" && place.name_en ? place.name_en : place.name;
      const question = language === "en" 
        ? `Tell me about the history and details of ${placeName}`
        : `Hãy kể sự tích và thông tin chi tiết về ${placeName}`;
      
      localStorage.setItem("preloaded_question", question);
      localStorage.setItem("preloaded_question_language", language);
      navigate("/chat");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px", color: "var(--light-text)", fontWeight: 600 }}>
        {t("common.loading")}
      </div>
    );
  }

  if (!place) {
    return (
      <div style={{ textAlign: "center", padding: "80px" }}>
        <h3>{t("common.no_data")}</h3>
        <Link to="/places" style={{ color: "var(--primary-navy)", fontWeight: 700 }}>
          {language === "en" ? "Back to list" : "Quay lại danh sách"}
        </Link>
      </div>
    );
  }

  const localizedName = language === "en" && place.name_en ? place.name_en : place.name;
  const localizedDescription = language === "en" && place.full_description_en 
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
    <div>
      {/* Header */}
      <header className="app-header">
        <Link to="/places" style={{ color: "var(--cream-white)" }}>
          <ArrowLeft size={22} style={{ color: "var(--accent-gold)" }} />
        </Link>
        <h1 style={{ margin: 0, fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {localizedName}
        </h1>
      </header>

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
                  {language === "en" ? "Automated Audio Guide" : "Thuyết minh số tự động (Audio Guide)"}
                </h3>
                <p style={{ fontSize: "11px", opacity: 0.8, margin: 0 }}>
                  {language === "en" ? "Listen to the historical narration of this attraction" : "Nghe diễn giải câu chuyện lịch sử di tích"}
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
                {isPlaying ? (language === "en" ? "Playing..." : "Đang phát...") : (language === "en" ? "Play Narration" : "Phát Thuyết Minh")}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Description Text details */}
      <div style={{ padding: "0 16px 20px 16px" }}>
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ fontSize: "16px", color: "var(--primary-navy)", fontWeight: 700, borderBottom: "1px solid rgba(0,0,0,0.06)", paddingBottom: "6px" }}>
            {language === "en" ? "History & Narration" : "Lịch sử & Diễn giải di tích"}
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
            <MessageSquare size={16} />
            <span>{language === "en" ? "Ask AI Assistant about this" : "Hỏi Trợ lý AI về điểm này"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailPage;
