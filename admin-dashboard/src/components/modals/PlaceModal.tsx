import React, { useState, useEffect, useRef } from "react";
import adminApi, { AdminPlace } from "../../services/adminApi";

interface PlaceModalProps {
  onClose: () => void;
  onSave: (data: {
    name: string;
    name_en?: string;
    category: string;
    short_description: string;
    short_description_en?: string;
    full_description: string;
    full_description_en?: string;
    image_url: string;
    audio_url?: string | null;
    audio_url_en?: string | null;
    audio_enabled?: boolean;
    latitude: number;
    longitude: number;
    display_order?: number;
  }) => void;
  selectedItem: AdminPlace | null;
  modalType: "add" | "edit" | null;
}

export const PlaceModal: React.FC<PlaceModalProps> = ({
  onClose,
  onSave,
  selectedItem,
  modalType,
}) => {
  // Form states
  const [plName, setPlName] = useState("");
  const [plNameEn, setPlNameEn] = useState("");
  const [plCategory, setPlCategory] = useState("tam_linh");
  const [plShort, setPlShort] = useState("");
  const [plShortEn, setPlShortEn] = useState("");
  const [plFull, setPlFull] = useState("");
  const [plFullEn, setPlFullEn] = useState("");
  const [plImage, setPlImage] = useState("");
  const [plAudio, setPlAudio] = useState("");
  const [plAudioEn, setPlAudioEn] = useState("");
  const [plAudioEnabled, setPlAudioEnabled] = useState(false);
  const [plLat, setPlLat] = useState(11.378345);
  const [plLng, setPlLng] = useState(106.168924);
  const [plDisplayOrder, setPlDisplayOrder] = useState<number>(0);

  // AI translation & upload states
  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  // Leaflet Map states & refs
  const [adminLeafletLoaded, setAdminLeafletLoaded] = useState(false);
  const adminMapDivRef = useRef<HTMLDivElement | null>(null);
  const adminMapInstanceRef = useRef<any>(null);
  const adminMarkerRef = useRef<any>(null);

  const getOptionalUrlValue = (value: string) => {
    const trimmed = value.trim();
    return trimmed && trimmed.toLowerCase() !== "none" ? trimmed : null;
  };

  const handleTranslate = async (
    sourceText: string,
    fieldToSet: "plNameEn" | "plShortEn" | "plFullEn"
  ) => {
    if (!sourceText) {
      alert("Vui lòng nhập nội dung tiếng Việt trước khi dịch!");
      return;
    }
    setTranslatingField(fieldToSet);
    try {
      const res = await adminApi.translateText(sourceText, "en");
      if (fieldToSet === "plNameEn") setPlNameEn(res.translated_text);
      else if (fieldToSet === "plShortEn") setPlShortEn(res.translated_text);
      else if (fieldToSet === "plFullEn") setPlFullEn(res.translated_text);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Lỗi khi dịch tự động.");
    } finally {
      setTranslatingField(null);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldToSet: "plImage" | "plAudio" | "plAudioEn"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingFile(fieldToSet);
    try {
      const res = await adminApi.uploadFile(file);
      if (fieldToSet === "plImage") setPlImage(res.url);
      else if (fieldToSet === "plAudio") setPlAudio(res.url);
      else if (fieldToSet === "plAudioEn") setPlAudioEn(res.url);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi tải file lên hệ thống.");
    } finally {
      setUploadingFile(null);
    }
  };

  // Initialize form fields
  useEffect(() => {
    if (modalType === "edit" && selectedItem) {
      setPlName(selectedItem.name || "");
      setPlNameEn(selectedItem.name_en || "");
      setPlCategory(selectedItem.category || "tam_linh");
      setPlShort(selectedItem.short_description || "");
      setPlShortEn(selectedItem.short_description_en || "");
      setPlFull(selectedItem.full_description || "");
      setPlFullEn(selectedItem.full_description_en || "");
      setPlImage(selectedItem.image_url || "");
      setPlAudio(selectedItem.audio_url || "");
      setPlAudioEn(selectedItem.audio_url_en || "");
      setPlAudioEnabled(!!selectedItem.audio_enabled);
      setPlLat(selectedItem.latitude || 11.378345);
      setPlLng(selectedItem.longitude || 106.168924);
      setPlDisplayOrder(selectedItem.display_order ?? 0);
    } else {
      setPlName("");
      setPlNameEn("");
      setPlCategory("tam_linh");
      setPlShort("");
      setPlShortEn("");
      setPlFull("");
      setPlFullEn("");
      setPlImage("");
      setPlAudio("");
      setPlAudioEn("");
      setPlAudioEnabled(false);
      setPlLat(11.378345);
      setPlLng(106.168924);
      setPlDisplayOrder(0);
    }
  }, [modalType, selectedItem]);

  // Load Leaflet Script and CSS
  useEffect(() => {
    const L = (window as any).L;
    if (L) {
      setAdminLeafletLoaded(true);
      return;
    }

    // Append Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.crossOrigin = "";
    document.head.appendChild(link);

    // Append Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.crossOrigin = "";
    script.onload = () => {
      setAdminLeafletLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      // Clean up map instance when modal closes / unmounts
      if (adminMapInstanceRef.current) {
        adminMapInstanceRef.current.remove();
        adminMapInstanceRef.current = null;
        adminMarkerRef.current = null;
      }
    };
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!adminLeafletLoaded || !adminMapDivRef.current || adminMapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const map = L.map(adminMapDivRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([plLat || 11.378345, plLng || 106.168924], 15);

    adminMapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      minZoom: 13
    }).addTo(map);

    const marker = L.marker([plLat || 11.378345, plLng || 106.168924], {
      draggable: true
    }).addTo(map);

    adminMarkerRef.current = marker;

    // Listen to marker drag events to update fields
    marker.on("dragend", () => {
      const position = marker.getLatLng();
      setPlLat(Number(position.lat.toFixed(6)));
      setPlLng(Number(position.lng.toFixed(6)));
    });

    // Listen to map clicks to update marker and fields
    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      setPlLat(Number(lat.toFixed(6)));
      setPlLng(Number(lng.toFixed(6)));
      marker.setLatLng([lat, lng]);
    });
  }, [adminLeafletLoaded]);

  // Synchronize manual inputs updates -> map marker moves in real time!
  useEffect(() => {
    const map = adminMapInstanceRef.current;
    const marker = adminMarkerRef.current;
    if (!map || !marker) return;

    const lat = Number(plLat);
    const lng = Number(plLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      const currentPos = marker.getLatLng();
      if (currentPos.lat !== lat || currentPos.lng !== lng) {
        marker.setLatLng([lat, lng]);
        map.setView([lat, lng], map.getZoom(), { animate: true });
      }
    }
  }, [plLat, plLng]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plAudioEnabled && !getOptionalUrlValue(plAudio)) {
      alert("Vui lòng nhập URL Audio Thuyết Minh Số (VI) trước khi bật tính năng âm thanh.");
      return;
    }
    onSave({
      name: plName,
      name_en: plNameEn,
      category: plCategory,
      short_description: plShort,
      short_description_en: plShortEn,
      full_description: plFull,
      full_description_en: plFullEn,
      image_url: plImage,
      audio_url: getOptionalUrlValue(plAudio),
      audio_url_en: getOptionalUrlValue(plAudioEn),
      audio_enabled: plAudioEnabled,
      latitude: Number(plLat),
      longitude: Number(plLng),
      display_order: Number(plDisplayOrder)
    });
  };

  return (
    <div className="modal-content">
      <header className="modal-header">
        <h3>{modalType === "add" ? "Thêm địa danh mới" : "Chỉnh sửa địa danh"}</h3>
        <button type="button" className="btn btn-secondary btn-xs" onClick={onClose}>✕</button>
      </header>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Tên địa danh di tích (VI)</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={plName} 
              onChange={e => setPlName(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Tên địa danh di tích (EN)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs" 
                style={{ padding: "2px 8px", marginBottom: "4px" }}
                disabled={translatingField === "plNameEn"}
                onClick={() => handleTranslate(plName, "plNameEn")}
              >
                {translatingField === "plNameEn" ? "Đang dịch..." : "Dịch tự động AI"}
              </button>
            </div>
            <input 
              type="text" 
              className="form-input" 
              value={plNameEn} 
              onChange={e => setPlNameEn(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Thứ tự hiển thị ưu tiên (1 - Lên đầu, số nhỏ hơn hiển thị trước)</label>
            <input 
              type="number" 
              className="form-input" 
              min="0"
              required 
              value={plDisplayOrder} 
              onChange={e => setPlDisplayOrder(Number(e.target.value))} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phân mục</label>
            <select 
              className="form-select" 
              value={plCategory} 
              onChange={e => setPlCategory(e.target.value)}
            >
              <option value="tam_linh">Tâm Linh / Tôn Giáo</option>
              <option value="phong_canh">Phong Cảnh / Đỉnh Núi</option>
              <option value="dich_vu">Cáp Treo / Dịch Vụ</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Mô tả ngắn gọn (VI)</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={plShort} 
              onChange={e => setPlShort(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Mô tả ngắn gọn (EN)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs" 
                style={{ padding: "2px 8px", marginBottom: "4px" }}
                disabled={translatingField === "plShortEn"}
                onClick={() => handleTranslate(plShort, "plShortEn")}
              >
                {translatingField === "plShortEn" ? "Đang dịch..." : "Dịch tự động AI"}
              </button>
            </div>
            <input 
              type="text" 
              className="form-input" 
              value={plShortEn} 
              onChange={e => setPlShortEn(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Lịch sử thuyết minh đầy đủ (VI)</label>
            <textarea 
              className="form-textarea" 
              required 
              rows={4}
              value={plFull} 
              onChange={e => setPlFull(e.target.value)}
            />
          </div>
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Lịch sử thuyết minh đầy đủ (EN)</label>
              <button 
                type="button" 
                className="btn btn-secondary btn-xs" 
                style={{ padding: "2px 8px", marginBottom: "4px" }}
                disabled={translatingField === "plFullEn"}
                onClick={() => handleTranslate(plFull, "plFullEn")}
              >
                {translatingField === "plFullEn" ? "Đang dịch..." : "Dịch tự động AI"}
              </button>
            </div>
            <textarea 
              className="form-textarea" 
              rows={4}
              value={plFullEn} 
              onChange={e => setPlFullEn(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">URL ảnh bìa địa danh</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={plImage} 
                onChange={e => setPlImage(e.target.value)} 
                style={{ flex: 1 }}
              />
              <label className="btn btn-secondary btn-xs" style={{ cursor: "pointer", whiteSpace: "nowrap", padding: "8px 12px", margin: 0, display: "flex", alignItems: "center" }}>
                {uploadingFile === "plImage" ? "Đang tải..." : "Tải ảnh lên"}
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: "none" }} 
                  disabled={uploadingFile !== null}
                  onChange={e => handleFileUpload(e, "plImage")} 
                />
              </label>
            </div>
          </div>
          <div className="form-group" style={{ flexDirection: "row", gap: "8px", alignItems: "center" }}>
            <input
              type="checkbox"
              id="pl_audio_enabled"
              checked={plAudioEnabled}
              onChange={e => setPlAudioEnabled(e.target.checked)}
            />
            <label htmlFor="pl_audio_enabled" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
              Bật tính năng âm thanh cho di tích này
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">URL Audio Thuyết Minh Số (VI)</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                className="form-input"
                value={plAudio}
                onChange={e => setPlAudio(e.target.value)}
                placeholder="None hoặc để trống nếu chưa có audio"
                style={{ flex: 1 }}
              />
              <label className="btn btn-secondary btn-xs" style={{ cursor: "pointer", whiteSpace: "nowrap", padding: "8px 12px", margin: 0, display: "flex", alignItems: "center" }}>
                {uploadingFile === "plAudio" ? "Đang tải..." : "Tải nhạc lên"}
                <input 
                  type="file" 
                  accept="audio/*" 
                  style={{ display: "none" }} 
                  disabled={uploadingFile !== null}
                  onChange={e => handleFileUpload(e, "plAudio")} 
                />
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">URL Audio Thuyết Minh Số (EN)</label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input 
                type="text" 
                className="form-input" 
                value={plAudioEn} 
                onChange={e => setPlAudioEn(e.target.value)} 
                style={{ flex: 1 }}
              />
              <label className="btn btn-secondary btn-xs" style={{ cursor: "pointer", whiteSpace: "nowrap", padding: "8px 12px", margin: 0, display: "flex", alignItems: "center" }}>
                {uploadingFile === "plAudioEn" ? "Đang tải..." : "Tải nhạc lên"}
                <input 
                  type="file" 
                  accept="audio/*" 
                  style={{ display: "none" }} 
                  disabled={uploadingFile !== null}
                  onChange={e => handleFileUpload(e, "plAudioEn")} 
                />
              </label>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="form-group">
              <label className="form-label">Vĩ độ (Latitude)</label>
              <input 
                type="number" 
                step="0.000001" 
                className="form-input" 
                required 
                value={plLat} 
                onChange={e => setPlLat(Number(e.target.value))} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Kinh độ (Longitude)</label>
              <input 
                type="number" 
                step="0.000001" 
                className="form-input" 
                required 
                value={plLng} 
                onChange={e => setPlLng(Number(e.target.value))} 
              />
            </div>
          </div>
          
          {/* Interactive Map Selector for Admin */}
          <div className="form-group" style={{ marginTop: "10px" }}>
            <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Bản đồ chọn tọa độ thực địa</span>
              <span style={{ fontSize: "11px", color: "var(--accent-gold)", fontWeight: "normal" }}>
                (Bấm vào bản đồ hoặc kéo marker để chọn tọa độ)
              </span>
            </label>
            <div 
              ref={adminMapDivRef} 
              style={{ 
                width: "100%", 
                height: "220px", 
                borderRadius: "10px", 
                border: "1px solid rgba(0,0,0,0.12)",
                marginTop: "4px"
              }} 
            />
          </div>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary">Lưu thông tin địa danh</button>
        </footer>
      </form>
    </div>
  );
};
