import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header, Page } from "zmp-ui";
import { AlertTriangle, CheckCircle, Image, MapPin } from "lucide-react";
import { getUserInfo, getLocation } from "zmp-sdk/apis";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

type ReportType = "ve_sinh" | "gia_ca" | "an_ninh" | "thai_do" | "ha_tang" | "cheo_keo" | "gop_y" | "khac";

export const FeedbackPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reportType, setReportType] = useState<ReportType>("ve_sinh");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Geolocation integration
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  
  // Success submission state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  
  // 1. Prefill traveler name on mount using Zalo profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { userInfo } = await getUserInfo({
          autoRequestPermission: true,
          avatarType: "normal"
        });
        if (userInfo && userInfo.name) {
          setName(userInfo.name);
        }
      } catch (error) {
        console.warn("Could not prefill user name natively in FeedbackPage:", error);
      }
    };
    fetchProfile();
  }, []);

  // 2. Native Geolocation integration
  const handleGpsToggle = async () => {
    if (!gpsEnabled) {
      try {
        const data = await getLocation({});
        if (data && data.latitude && data.longitude) {
          setCoords({
            lat: Number(data.latitude),
            lng: Number(data.longitude)
          });
          setGpsEnabled(true);
        } else {
          throw new Error("Invalid location details");
        }
      } catch (err) {
        console.warn("Native GPS getLocation failed:", err);
        alert(language === "en" 
          ? "Unable to get location. Please allow GPS access and try again." 
          : "Không thể lấy vị trí. Vui lòng cấp quyền truy cập GPS và thử lại."
        );
      }
    } else {
      setCoords({});
      setGpsEnabled(false);
    }
  };

  const handlePhotoSelect = async () => {
    document.getElementById("file-upload")?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImageFile(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let uploadedUrl: string | undefined = undefined;
      
      if (selectedFile) {
        try {
          uploadedUrl = await api.uploadImage(selectedFile);
        } catch (uploadErr: any) {
          console.error("Storage upload failed, fallback to text-only submission:", uploadErr);
          alert(language === "en" 
            ? "Image upload failed. We will submit your feedback text without the image." 
            : "Tải ảnh lên thất bại. Chúng tôi sẽ gửi phản ánh của bạn dưới dạng văn bản không có ảnh."
          );
        }
      }

      const res = await api.submitFeedback({
        reporter_name: name || (language === "en" ? "Anonymous Tourist" : "Du khách ẩn danh"),
        phone: phone || undefined,
        report_type: reportType,
        content: content,
        image_url: uploadedUrl,
        latitude: coords.lat,
        longitude: coords.lng
      });
      
      setTrackingId(res.id);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission failed:", error);
      alert(language === "en" 
        ? "Could not submit feedback. Please check your connection and try again." 
        : "Không thể gửi phản ánh. Vui lòng kiểm tra kết nối mạng và thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReportTypeName = (tType: ReportType) => {
    if (language === "en") {
      switch (tType) {
        case "ve_sinh": return "Sanitation & Environment";
        case "gia_ca": return "Pricing & Services";
        case "cheo_keo": return "Solicitation & Disturbances";
        case "an_ninh": return "Security & Order";
        case "thai_do": return "Staff Service Attitude";
        case "ha_tang": return "Infrastructure & Signage";
        case "gop_y": return "General Tourism Feedback";
        default: return "Other Issues";
      }
    } else {
      switch (tType) {
        case "ve_sinh": return "Vệ sinh môi trường";
        case "gia_ca": return "Niêm yết giá, giá dịch vụ";
        case "cheo_keo": return "Chèo kéo khách du lịch";
        case "an_ninh": return "An ninh trật tự khu di tích";
        case "thai_do": return "Thái độ nhân viên phục vụ";
        case "ha_tang": return "Hạ tầng đường đi, biển báo";
        case "gop_y": return "Góp ý thông tin du lịch chung";
        default: return "Phản ánh vấn đề khác";
      }
    }
  };

  if (isSubmitted) {
    return (
      <Page>
        <Header
          title={language === "en" ? "Feedback Sent Successfully" : "Gửi phản ánh thành công"}
          showBackIcon={true}
        />

        <div style={{ padding: "30px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <CheckCircle size={60} style={{ color: "#00C853" }} />
          <h2 style={{ fontSize: "18px", color: "var(--primary-navy)", fontWeight: 700 }}>
            {language === "en" ? "Submission Successful" : "Tiếp nhận thông tin thành công"}
          </h2>
          <p style={{ fontSize: "13.5px", color: "var(--light-text)", lineHeight: 1.6 }}>
            {language === "en"
              ? "Thank you for your feedback. Black Lady Mountain Relic Board has received your report and will coordinate with professional units to resolve it as soon as possible."
              : "Cảm ơn quý khách đã gửi phản ánh kiến nghị. Ban quản lý Khu du lịch Núi Bà Đen đã tiếp nhận thông tin và sẽ điều phối đơn vị nghiệp vụ xử lý sớm nhất."}
          </p>

          <div className="glass-card" style={{ width: "100%", border: "1px dashed var(--accent-gold)" }}>
            <div style={{ fontSize: "12px", color: "var(--light-text)", marginBottom: "4px" }}>
              {language === "en" ? "Reference Code:" : "Mã hồ sơ tiếp nhận:"}
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--primary-navy)", fontFamily: "monospace" }}>{trackingId}</div>
          </div>

          <Link to="/" className="submit-btn" style={{ textDecoration: "none", textAlign: "center", display: "block", marginTop: "16px" }}>
            {language === "en" ? "Back to Homepage" : "Quay lại trang chủ"}
          </Link>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      {/* Header */}
      <Header
        showBackIcon={true}
        title={
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <AlertTriangle size={20} style={{ color: "var(--accent-gold)" }} />
            <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>
              {t("feedback.title")}
            </span>
          </div> as any
        }
      />

      {/* Form Content */}
      <form onSubmit={handleSubmit} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        
        {/* Intro */}
        <div className="glass-card" style={{ background: "rgba(217, 83, 79, 0.05)", borderLeft: "4px solid var(--alert-red)" }}>
          <p style={{ fontSize: "12.5px", color: "var(--dark-text)", margin: 0, lineHeight: 1.5 }}>
            {language === "en"
              ? "Visitors can report issues directly regarding sanitation, pricing, security, solicitation, or infrastructure. The Board will receive and handle it immediately."
              : "Du khách có thể phản ánh trực tiếp các vấn đề về vệ sinh, giá cả, an ninh trật tự, chèo kéo hoặc hạ tầng. BQL sẽ tiếp nhận và phản hồi ngay lập tức."}
          </p>
        </div>

        {/* Inputs */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
              {language === "en" ? "Visitor Name (Optional)" : "Họ tên du khách (Tùy chọn)"}
            </label>
            <input 
              type="text" 
              className="feedback-input" 
              placeholder={language === "en" ? "Enter your name..." : "Nhập họ và tên..."} 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
              {language === "en" ? "Contact Phone Number" : "Số điện thoại liên hệ"}
            </label>
            <input 
              type="tel" 
              className="feedback-input" 
              placeholder={language === "en" ? "Enter your phone number..." : "Nhập số điện thoại..."} 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
              {language === "en" ? "Feedback Category" : "Loại phản ánh kiến nghị"}
            </label>
            <select 
              className="feedback-input" 
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              style={{ appearance: "auto" }}
            >
              <option value="ve_sinh">{getReportTypeName("ve_sinh")}</option>
              <option value="gia_ca">{getReportTypeName("gia_ca")}</option>
              <option value="cheo_keo">{getReportTypeName("cheo_keo")}</option>
              <option value="an_ninh">{getReportTypeName("an_ninh")}</option>
              <option value="thai_do">{getReportTypeName("thai_do")}</option>
              <option value="ha_tang">{getReportTypeName("ha_tang")}</option>
              <option value="gop_y">{getReportTypeName("gop_y")}</option>
              <option value="khac">{getReportTypeName("khac")}</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
              {language === "en" ? "Detailed Description *" : "Nội dung chi tiết phản ánh *"}
            </label>
            <textarea 
              className="feedback-input" 
              rows={4}
              placeholder={language === "en" ? "Describe details of the event, location, time..." : "Mô tả chi tiết sự việc, địa điểm, thời gian phát sinh..."} 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* Photo upload */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px" }}>
              {language === "en" ? "Attach Photo Evidence" : "Ảnh đính kèm minh chứng"}
            </label>
            <div style={{ position: "relative", display: "flex", gap: "10px", alignItems: "center" }}>
              <input 
                type="file" 
                id="file-upload" 
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <button 
                type="button"
                onClick={handlePhotoSelect}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "6px", 
                  padding: "10px 16px", 
                  border: "1px dashed rgba(11,37,69,0.3)", 
                  borderRadius: "8px", 
                  fontSize: "12.5px", 
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: "rgba(11,37,69,0.02)",
                  color: "inherit",
                  font: "inherit"
                }}
              >
                <Image size={16} aria-hidden="true" />
                <span>
                  {imageFile 
                    ? (language === "en" ? "Change photo" : "Đổi ảnh") 
                    : (language === "en" ? "Select photo" : "Chọn ảnh chụp")}
                </span>
              </button>
              {imageFile && <span style={{ fontSize: "12px", color: "green", fontWeight: 600 }}>✓ {imageFile}</span>}
            </div>
          </div>

          {/* Geolocation */}
          <div style={{ 
            borderTop: "1px solid rgba(0,0,0,0.05)", 
            paddingTop: "12px", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center" 
          }}>
            <div>
              <h4 style={{ fontSize: "13px", fontWeight: 700 }}>
                {language === "en" ? "Attach Event Location Coordinates" : "Đính kèm tọa độ vị trí sự việc"}
              </h4>
              <p style={{ fontSize: "11px", color: "var(--light-text)", margin: 0 }}>
                {gpsEnabled && coords.lat 
                  ? `${language === "en" ? "Coordinates:" : "Tọa độ:"} ${coords.lat.toFixed(6)}, ${coords.lng?.toFixed(6)}` 
                  : (language === "en" ? "Automatically acquire your current GPS coordinates" : "Tự động lấy vị trí GPS hiện tại của bạn")}
              </p>
            </div>
            <button 
              type="button"
              onClick={handleGpsToggle}
              style={{
                border: "none",
                borderRadius: "30px",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: gpsEnabled ? "var(--primary-navy)" : "rgba(11, 37, 69, 0.05)",
                color: gpsEnabled ? "var(--accent-gold)" : "var(--light-text)",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <MapPin size={12} />
              <span>
                {gpsEnabled 
                  ? (language === "en" ? "Attached" : "Đang đính kèm") 
                  : (language === "en" ? "Get Location" : "Lấy vị trí")}
              </span>
            </button>
          </div>

        </div>

        {/* Submit */}
        <button 
          type="submit" 
          className="submit-btn" 
          style={{ marginTop: "8px", opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (language === "en" ? "Submitting..." : "Đang gửi...") 
            : (language === "en" ? "Submit Feedback" : "Gửi Phản Ánh")}
        </button>

      </form>
    </Page>
  );
};

export default FeedbackPage;
