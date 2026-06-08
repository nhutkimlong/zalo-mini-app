import React, { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Volume2, 
  Sparkles, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  FileText, 
  Eye 
} from "lucide-react";
import adminApi from "../services/adminApi";

interface RichContentEditorProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
  placeholder?: string;
  lang: "vi" | "en" | "km";
  onTranslate?: () => void;
  translating?: boolean;
}

export const RichContentEditor: React.FC<RichContentEditorProps> = ({
  value,
  onChange,
  label,
  placeholder = "",
  lang,
  onTranslate,
  translating = false,
}) => {
  const [activeMode, setActiveMode] = useState<"write" | "preview">("write");
  const [generatingTts, setGeneratingTts] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Clear audio preview if text changes
  useEffect(() => {
    setAudioUrl(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.src = "";
    }
  }, [value]);

  const insertMarkdown = (syntax: "bold" | "italic" | "h1" | "h2" | "list") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = "";
    if (syntax === "bold") {
      replacement = `**${selected || "văn bản đậm"}**`;
    } else if (syntax === "italic") {
      replacement = `*${selected || "văn bản nghiêng"}*`;
    } else if (syntax === "h1") {
      replacement = `\n# ${selected || "Tiêu đề 1"}\n`;
    } else if (syntax === "h2") {
      replacement = `\n## ${selected || "Tiêu đề 2"}\n`;
    } else if (syntax === "list") {
      replacement = `\n- ${selected || "Mục danh sách"}`;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + replacement.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  };

  const handleGenerateTts = async () => {
    const textToGenerate = value.trim();
    if (!textToGenerate) {
      alert("Vui lòng nhập nội dung trước khi tạo thuyết minh AI.");
      return;
    }

    setGeneratingTts(true);
    try {
      const res = await adminApi.generateTts(textToGenerate, lang);
      if (res.url === "__base64__" && res.audio) {
        setAudioUrl(`data:audio/mp3;base64,${res.audio}`);
      } else {
        setAudioUrl(res.url);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi khi tạo thuyết minh TTS. Vui lòng kiểm tra lại API.");
    } finally {
      setGeneratingTts(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error("Audio play failed:", err);
          alert("Không thể phát file âm thanh.");
        });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100 || 0;
    setPlaybackProgress(progress);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setPlaybackDuration(audioRef.current.duration || 0);
  };

  const handleAudioSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !playbackDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    audioRef.current.currentTime = percent * playbackDuration;
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Basic Markdown to HTML parsing function
  const renderMarkdown = (md: string) => {
    if (!md || !md.trim()) {
      return `<p style="color: var(--text-light); font-style: italic;">Chưa có nội dung xem trước…</p>`;
    }

    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    html = html.replace(/^##\s+(.*?)$/gm, '<h2 style="font-size: 16px; font-weight: 700; color: var(--primary-navy); margin-top: 14px; margin-bottom: 8px; border-left: 3px solid var(--accent-gold); padding-left: 8px;">$1</h2>');
    html = html.replace(/^#\s+(.*?)$/gm, '<h1 style="font-size: 18px; font-weight: 800; color: var(--primary-navy); margin-top: 18px; margin-bottom: 10px; border-bottom: 1px solid var(--border-slate); padding-bottom: 4px;">$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: var(--text-dark);">$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');
    
    // Lists
    html = html.replace(/^\-\s+(.*?)$/gm, '<li style="margin-left: 20px; list-style-type: disc; margin-bottom: 4px; padding-left: 2px;">$1</li>');

    // Paragraph split
    const lines = html.split("\n");
    let inList = false;
    const finalBlocks: string[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        if (inList) {
          finalBlocks.push("</ul>");
          inList = false;
        }
        finalBlocks.push("<br/>");
        return;
      }

      if (trimmed.startsWith("<li")) {
        if (!inList) {
          finalBlocks.push('<ul style="margin-bottom: 12px; display: flex; flexDirection: column; gap: 4px;">');
          inList = true;
        }
        finalBlocks.push(line);
      } else {
        if (inList) {
          finalBlocks.push("</ul>");
          inList = false;
        }
        if (trimmed.startsWith("<h")) {
          finalBlocks.push(line);
        } else {
          finalBlocks.push(`<p style="margin-bottom: 10px; line-height: 1.6; color: var(--text-dark); text-align: justify;">${line}</p>`);
        }
      }
    });

    if (inList) {
      finalBlocks.push("</ul>");
    }

    return finalBlocks.join("\n");
  };

  return (
    <div 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "8px", 
        border: "1px solid var(--border-slate)",
        borderRadius: "10px",
        overflow: "hidden",
        backgroundColor: "var(--cream-white)"
      }}
    >
      {/* Editor Header / Toolbar */}
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          backgroundColor: "#f8fafc",
          padding: "8px 12px",
          borderBottom: "1px solid var(--border-slate)"
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary-navy)" }}>{label}</span>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* Write / Preview Tab switcher */}
          <div 
            style={{ 
              display: "flex", 
              backgroundColor: "rgba(11, 37, 69, 0.05)", 
              padding: "2px", 
              borderRadius: "6px" 
            }}
          >
            <button
              type="button"
              onClick={() => setActiveMode("write")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                border: "none",
                borderRadius: "4px",
                fontSize: "11.5px",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: activeMode === "write" ? "var(--cream-white)" : "transparent",
                color: activeMode === "write" ? "var(--primary-navy)" : "var(--text-light)",
                boxShadow: activeMode === "write" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
              }}
            >
              <FileText size={12} />
              <span>Soạn thảo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("preview")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                border: "none",
                borderRadius: "4px",
                fontSize: "11.5px",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: activeMode === "preview" ? "var(--cream-white)" : "transparent",
                color: activeMode === "preview" ? "var(--primary-navy)" : "var(--text-light)",
                boxShadow: activeMode === "preview" ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
              }}
            >
              <Eye size={12} />
              <span>Xem trước</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formatting and Actions Sub-Toolbar */}
      {activeMode === "write" && (
        <div 
          style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "4px 12px",
            borderBottom: "1px solid var(--border-slate)",
            backgroundColor: "#fdfdfd",
            flexWrap: "wrap",
            gap: "8px"
          }}
        >
          {/* Formatting buttons */}
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              type="button"
              title="Chữ đậm (Ctrl+B)"
              onClick={() => insertMarkdown("bold")}
              style={{ padding: "4px 8px", background: "none", border: "1px solid var(--border-slate)", borderRadius: "4px", cursor: "pointer", display: "flex", color: "var(--text-dark)" }}
            >
              <Bold size={13} />
            </button>
            <button
              type="button"
              title="Chữ nghiêng (Ctrl+I)"
              onClick={() => insertMarkdown("italic")}
              style={{ padding: "4px 8px", background: "none", border: "1px solid var(--border-slate)", borderRadius: "4px", cursor: "pointer", display: "flex", color: "var(--text-dark)" }}
            >
              <Italic size={13} />
            </button>
            <button
              type="button"
              title="Tiêu đề chính"
              onClick={() => insertMarkdown("h1")}
              style={{ padding: "4px 8px", background: "none", border: "1px solid var(--border-slate)", borderRadius: "4px", cursor: "pointer", display: "flex", color: "var(--text-dark)" }}
            >
              <Heading1 size={13} />
            </button>
            <button
              type="button"
              title="Tiêu đề phụ"
              onClick={() => insertMarkdown("h2")}
              style={{ padding: "4px 8px", background: "none", border: "1px solid var(--border-slate)", borderRadius: "4px", cursor: "pointer", display: "flex", color: "var(--text-dark)" }}
            >
              <Heading2 size={13} />
            </button>
            <button
              type="button"
              title="Danh sách mục"
              onClick={() => insertMarkdown("list")}
              style={{ padding: "4px 8px", background: "none", border: "1px solid var(--border-slate)", borderRadius: "4px", cursor: "pointer", display: "flex", color: "var(--text-dark)" }}
            >
              <List size={13} />
            </button>
          </div>

          {/* AI translation & TTS Actions */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {onTranslate && (
              <button
                type="button"
                onClick={onTranslate}
                disabled={translating}
                className="btn btn-secondary btn-xs"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 600
                }}
              >
                <Sparkles size={11} style={{ color: "var(--accent-gold)" }} />
                <span>{translating ? "Đang dịch…" : "AI Dịch tự động"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGenerateTts}
              disabled={generatingTts}
              className="btn btn-primary btn-xs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: "var(--primary-navy)",
                color: "var(--cream-white)",
                borderColor: "var(--accent-gold)"
              }}
            >
              <Volume2 size={11} />
              <span>{generatingTts ? "Đang tạo…" : "Tạo thuyết minh AI (TTS)"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Editor Body */}
      <div style={{ position: "relative", minHeight: "180px" }}>
        {activeMode === "write" ? (
          <textarea
            ref={textareaRef}
            className="form-textarea"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              border: "none",
              borderRadius: "0",
              resize: "vertical",
              minHeight: "180px",
              margin: "0",
              padding: "12px",
              fontSize: "13px",
              fontFamily: "var(--font-mono, monospace)",
              lineHeight: "1.6"
            }}
          />
        ) : (
          <div 
            style={{
              padding: "16px",
              minHeight: "180px",
              maxHeight: "350px",
              overflowY: "auto",
              backgroundColor: "#fafbfd",
              color: "var(--text-dark)",
              borderTop: "none"
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          />
        )}
      </div>

      {/* Custom TTS Audio Preview Bar */}
      {audioUrl && (
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            borderTop: "1px solid var(--border-slate)",
            backgroundColor: "rgba(212, 175, 55, 0.06)",
            fontSize: "12px"
          }}
        >
          <audio 
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />

          <button
            type="button"
            onClick={togglePlay}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "var(--primary-navy)",
              border: "1px solid var(--accent-gold)",
              color: "var(--accent-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
            }}
          >
            {isPlaying ? <Pause size={12} fill="var(--accent-gold)" /> : <Play size={12} fill="var(--accent-gold)" />}
          </button>

          <span style={{ color: "var(--primary-navy)", fontWeight: 700, fontSize: "11px", whiteSpace: "nowrap" }}>
            Nghe thuyết minh ({lang === "vi" ? "VI" : lang === "en" ? "EN" : "KM"})
          </span>

          {/* Timeline progress slider */}
          <div 
            onClick={handleAudioSeek}
            style={{
              flex: 1,
              height: "6px",
              backgroundColor: "rgba(11, 37, 69, 0.1)",
              borderRadius: "3px",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div 
              style={{
                width: `${playbackProgress}%`,
                height: "100%",
                backgroundColor: "var(--accent-gold)",
                borderRadius: "3px"
              }}
            />
          </div>

          <span style={{ color: "var(--text-light)", fontSize: "10.5px", fontFamily: "monospace", whiteSpace: "nowrap" }}>
            {audioRef.current ? formatTime(audioRef.current.currentTime) : "0:00"} / {formatTime(playbackDuration)}
          </span>
        </div>
      )}
    </div>
  );
};
