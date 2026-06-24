import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Header, Page } from "../components/WebPrimitives";
import { AlertTriangle, CheckCircle, Image, MapPin } from "lucide-react";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import cx from "../utils/cx";
import styles from "../app.module.css";

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

  // 2. Native Geolocation integration
  const handleGpsToggle = async () => {
    if (!gpsEnabled) {
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (!window.isSecureContext && !isLocalhost) {
        alert(
          language === "km"
            ? "ការកំណត់ទីតាំង GPS តម្រូវឱ្យមានការតភ្ជាប់សុវត្ថិភាព (HTTPS)។ សូមចូលប្រើប្រាស់តាមរយៈ HTTPS។"
            : language === "en"
              ? "GPS geolocation requires a secure connection (HTTPS). Please access via HTTPS."
              : "Định vị GPS yêu cầu kết nối bảo mật (HTTPS). Vui lòng truy cập qua địa chỉ HTTPS."
        );
        return;
      }

      try {
        let latitude: number | undefined;
        let longitude: number | undefined;

        // Try Permissions API query
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const status = await navigator.permissions.query({ name: "geolocation" });
            if (status.state === "denied") {
              alert(
                language === "km"
                  ? "សិទ្ធិចូលប្រើប្រាស់ទីតាំងត្រូវបានរារាំង។ សូមបើកសិទ្ធិទីតាំងនៅក្នុងការកំណត់កម្មវិធីរុករករបស់អ្នក ដើម្បីប្រើប្រាស់មុខងារនេះ។"
                  : language === "en"
                    ? "Location access is blocked. Please enable location permissions in your browser settings to use this feature."
                    : "Quyền truy cập vị trí đã bị chặn. Vui lòng cấp quyền truy cập vị trí trong cài đặt trang web của trình duyệt để sử dụng tính năng này."
              );
              return;
            }
          } catch (e) {
            console.warn("Permissions API query failed:", e);
          }
        }

        // Try HTML5 Browser Geolocation
        if (navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 });
            });
            latitude = pos.coords.latitude;
            longitude = pos.coords.longitude;
            console.log("Acquired location via HTML5 browser geolocation:", latitude, longitude);
          } catch (geoError) {
            console.warn("Browser Geolocation failed/timed out:", geoError);
            if (!isLocalhost) {
              throw geoError;
            }
          }
        } else {
          if (!isLocalhost) {
            throw new Error("Geolocation not supported by this browser");
          }
        }

        // Default mock only on localhost
        if (latitude === undefined || longitude === undefined) {
          if (isLocalhost) {
            console.warn("Defaulting to Mount Ba Den coordinates for local development.");
            latitude = 11.375641;
            longitude = 106.174648;
          } else {
            throw new Error("GPS position could not be retrieved");
          }
        }

        setCoords({
          lat: latitude,
          lng: longitude
        });
        setGpsEnabled(true);
      } catch (err: any) {
        console.warn("GPS getLocation failed:", err);
        
        const isPermissionError = err && (err.code === 1 || err.code === -301 || err.code === 301 || String(err.message).toLowerCase().includes("denied") || String(err.message).toLowerCase().includes("permission"));
        
        if (isPermissionError) {
          alert(
            language === "km"
              ? "សិទ្ធិ GPS ត្រូវបានបដិសេធ។ សូមអនុញ្ញាតសិទ្ធិចូលប្រើប្រាស់ទីតាំងនៅក្នុងការកំណត់កម្មវិធីរុករករបស់អ្នក ដើម្បីប្រើប្រាស់មុខងារនេះ។"
              : language === "en"
                ? "GPS permission denied. Please allow location access in your browser settings to use this feature."
                : "Quyền định vị bị từ chối. Vui lòng cấp quyền truy cập vị trí trên trình duyệt của bạn để sử dụng tính năng này."
          );
        } else {
          alert(
            language === "km"
              ? "មិនអាចទទួលបានទីតាំងទេ។ សូមអនុញ្ញាតឱ្យចូលប្រើ GPS ហើយព្យាយាមម្តងទៀត។"
              : language === "en"
                ? "Unable to get location. Please allow GPS access and try again."
                : "Không thể lấy vị trí. Vui lòng cấp quyền truy cập GPS và thử lại."
          );
        }
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
          alert(language === "km"
            ? "ការផ្ទុករូបភាពឡើងបានបរាជ័យ។ យើងខ្ញុំនឹងផ្ញើមតិយោបល់របស់អ្នកជាអក្សរដោយគ្មានរូបភាព។"
            : language === "en"
              ? "Image upload failed. We will submit your feedback text without the image."
              : "Tải ảnh lên thất bại. Chúng tôi sẽ gửi phản ánh của bạn dưới dạng văn bản không có ảnh."
          );
        }
      }

      const res = await api.submitFeedback({
        reporter_name: name || (language === "km" ? "ភ្ញៀវទេសចរលាក់មុខ" : language === "en" ? "Anonymous Tourist" : "Du khách ẩn danh"),
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
      alert(language === "km"
        ? "មិនអាចផ្ញើមតិយោបល់បានទេ។ សូមពិនិត្យការតភ្ជាប់បណ្តាញរបស់អ្នក ហើយព្យាយាមម្តងទៀត។"
        : language === "en"
          ? "Could not submit feedback. Please check your connection and try again."
          : "Không thể gửi phản ánh. Vui lòng kiểm tra kết nối mạng và thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReportTypeName = (tType: ReportType) => {
    if (language === "km") {
      switch (tType) {
        case "ve_sinh": return "អនាម័យ និងបរិស្ថាន";
        case "gia_ca": return "តម្លៃ និងសេវាកម្ម";
        case "cheo_keo": return "ការបង្ខំ និងរំខាន";
        case "an_ninh": return "សន្តិសុខ និងសណ្តាប់ធ្នាប់";
        case "thai_do": return "ឥរិយាបថបុគ្គលិក";
        case "ha_tang": return "ហេដ្ឋារចនាសម្ព័ន្ធ និងផ្លាកសញ្ញា";
        case "gop_y": return "មតិទូទៅ";
        default: return "បញ្ហាផ្សេងៗ";
      }
    } else if (language === "en") {
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
          title={language === "km" ? "បានផ្ញើមតិយោបល់ដោយជោគជ័យ" : language === "en" ? "Feedback Sent Successfully" : "Gửi phản ánh thành công"}
          showBackIcon={true}
        />

        <div className={cx(styles, "feedback-success-wrapper")}>
          <CheckCircle size={60} className={cx(styles, "feedback-success-icon")} />
          <h2 className={cx(styles, "feedback-success-title")}>
            {language === "km" ? "ការបញ្ជូនបានជោគជ័យ" : language === "en" ? "Submission Successful" : "Tiếp nhận thông tin thành công"}
          </h2>
          <p className={cx(styles, "feedback-success-desc")}>
            {language === "km"
              ? "សូមអរគុណចំពោះការផ្តល់មតិយោបល់របស់អ្នក។ គណៈគ្រប់គ្រងភ្នំ Ba Den បានទទួលរបាយការណ៍របស់អ្នក ហើយនឹងសហការជាមួយអង្គភាពជំនាញដើម្បីដោះស្រាយឱ្យបានឆាប់តាមដែលអាចធ្វើទៅបាន។"
              : language === "en"
                ? "Thank you for your feedback. Black Lady Mountain Relic Board has received your report and will coordinate with professional units to resolve it as soon as possible."
                : "Cảm ơn quý khách đã gửi phản ánh kiến nghị. Ban quản lý Khu du lịch Núi Bà Đen đã tiếp nhận thông tin và sẽ điều phối đơn vị nghiệp vụ xử lý sớm nhất."}
          </p>

          <div className={cx(styles, "glass-card feedback-success-card")}>
            <div className={cx(styles, "feedback-success-card-label")}>
              {language === "km" ? "លេខកូដយោង៖" : language === "en" ? "Reference Code:" : "Mã hồ sơ tiếp nhận:"}
            </div>
            <div className={cx(styles, "feedback-success-card-code")}>{trackingId}</div>
          </div>

          <Link to="/" className={cx(styles, "submit-btn feedback-success-back-btn")}>
            {language === "km" ? "ត្រឡប់ទៅទំព័រដើម" : language === "en" ? "Back to Homepage" : "Quay lại trang chủ"}
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
          <div className={cx(styles, "feedback-header-title")}>
            <AlertTriangle size={20} style={{ color: "var(--site-gold)" }} />
            <span>
              {t("feedback.title")}
            </span>
          </div> as any
        }
      />

      {/* Form Content */}
      <form onSubmit={handleSubmit} className={cx(styles, "feedback-form")}>
        
        {/* Intro */}
        <div className={cx(styles, "glass-card feedback-notice-card")}>
          <p className={cx(styles, "feedback-notice-text")}>
            {language === "km"
              ? "ភ្ញៀវទេសចរអាចរាយការណ៍ដោយផ្ទាល់អំពីបញ្ហាពាក់ព័ន្ធនឹងអនាម័យ តម្លៃ សន្តិសុខ ការរំខាន ឬហេដ្ឋារចនាសម្ព័ន្ធ។ គណៈគ្រប់គ្រងនឹងទទួលយក និងដោះស្រាយភ្លាមៗ។"
              : language === "en"
                ? "Visitors can report issues directly regarding sanitation, pricing, security, solicitation, or infrastructure. The Board will receive and handle it immediately."
                : "Du khách có thể phản ánh trực tiếp các vấn đề về vệ sinh, giá cả, an ninh trật tự, chèo kéo hoặc hạ tầng. BQL sẽ tiếp nhận và phản hồi ngay lập tức."}
          </p>
        </div>

        {/* Inputs */}
        <div className={cx(styles, "glass-card feedback-form-card")}>
          
          <div>
            <label className={cx(styles, "feedback-form-label")}>
              {language === "km" ? "ឈ្មោះភ្ញៀវទេសចរ (មិនបង្ខំ)" : language === "en" ? "Visitor Name (Optional)" : "Họ tên du khách (Tùy chọn)"}
            </label>
            <input 
              type="text" 
              className={cx(styles, "feedback-input")} 
              placeholder={language === "km" ? "បញ្ចូលឈ្មោះរបស់អ្នក..." : language === "en" ? "Enter your name..." : "Nhập họ và tên..."} 
              value={name}
              onChange={(e) => setName(e.target.value)}
              enterKeyHint="next"
            />
          </div>

          <div>
            <label className={cx(styles, "feedback-form-label")}>
              {language === "km" ? "លេខទូរស័ព្ទទំនាក់ទំនង" : language === "en" ? "Contact Phone Number" : "Số điện thoại liên hệ"}
            </label>
            <input 
              type="tel" 
              className={cx(styles, "feedback-input")} 
              placeholder={language === "km" ? "បញ្ចូលលេខទូរស័ព្ទរបស់អ្នក..." : language === "en" ? "Enter your phone number..." : "Nhập số điện thoại..."} 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              enterKeyHint="next"
            />
          </div>

          <div>
            <label className={cx(styles, "feedback-form-label")}>
              {language === "km" ? "ប្រភេទមតិយោបល់" : language === "en" ? "Feedback Category" : "Loại phản ánh kiến nghị"}
            </label>
            <select 
              className={cx(styles, "feedback-input")} 
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              style={{ appearance: "none", WebkitAppearance: "none" }}
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
            <label className={cx(styles, "feedback-form-label")}>
              {language === "km" ? "ការពិពណ៌នាលម្អិត *" : language === "en" ? "Detailed Description *" : "Nội dung chi tiết phản ánh *"}
            </label>
            <textarea 
              className={cx(styles, "feedback-input")} 
              rows={4}
              placeholder={language === "km" ? "ពិពណ៌នាអំពីព័ត៌មានលម្អិតនៃព្រឹត្តិការណ៍ ទីតាំង ពេលវេលា..." : language === "en" ? "Describe details of the event, location, time..." : "Mô tả chi tiết sự việc, địa điểm, thời gian phát sinh..."} 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              enterKeyHint="done"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className={cx(styles, "feedback-form-label")}>
              {language === "km" ? "ភ្ជាប់ភស្តុតាងរូបថត" : language === "en" ? "Attach Photo Evidence" : "Ảnh đính kèm minh chứng"}
            </label>
            <div className={cx(styles, "feedback-photo-row")}>
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
                className={cx(styles, "feedback-photo-btn")}
              >
                <Image size={16} aria-hidden="true" />
                <span>
                  {imageFile 
                    ? (language === "km" ? "ប្តូររូបថត" : language === "en" ? "Change photo" : "Đổi ảnh") 
                    : (language === "km" ? "ជ្រើសរើសរូបថត" : language === "en" ? "Select photo" : "Chọn ảnh chụp")}
                </span>
              </button>
              {imageFile && <span className={cx(styles, "feedback-photo-status")}>✓ {imageFile}</span>}
            </div>
          </div>

          {/* Geolocation */}
          <div className={cx(styles, "feedback-gps-row")}>
            <div>
              <h4 className={cx(styles, "feedback-gps-heading")}>
                {language === "km" ? "ភ្ជាប់កូអរដោនេទីតាំង" : language === "en" ? "Attach Event Location Coordinates" : "Đính kèm tọa độ vị trí sự việc"}
              </h4>
              <p className={cx(styles, "feedback-gps-desc")}>
                {gpsEnabled && coords.lat 
                  ? `${language === "km" ? "កូអរដោនេ៖" : language === "en" ? "Coordinates:" : "Tọa độ:"} ${coords.lat.toFixed(6)}, ${coords.lng?.toFixed(6)}` 
                  : (language === "km" ? "ទទួលបានកូអរដោនេ GPS បច្ចុប្បន្នរបស់អ្នកដោយស្វ័យប្រវត្តិ" : language === "en" ? "Automatically acquire your current GPS coordinates" : "Tự động lấy vị trí GPS hiện tại của bạn")}
              </p>
            </div>
            <button 
              type="button"
              onClick={handleGpsToggle}
              className={cx(styles, `feedback-gps-btn ${gpsEnabled ? "is-active" : "is-inactive"}`)}
              style={{
                border: "none",
                borderRadius: "30px",
                padding: "8px 12px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <MapPin size={12} />
              <span>
                {gpsEnabled 
                  ? (language === "km" ? "បានភ្ជាប់" : language === "en" ? "Attached" : "Đang đính kèm") 
                  : (language === "km" ? "យកទីតាំង" : language === "en" ? "Get Location" : "Lấy vị trí")}
              </span>
            </button>
          </div>

        </div>

        {/* Submit */}
        <button 
          type="submit" 
          className={cx(styles, "submit-btn")} 
          style={{ marginTop: "8px", opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (language === "km" ? "កំពុងផ្ញើ..." : language === "en" ? "Submitting..." : "Đang gửi...") 
            : (language === "km" ? "ផ្ញើមតិយោបល់" : language === "en" ? "Submit Feedback" : "Gửi Phản Ánh")}
        </button>

      </form>
    </Page>
  );
};

export default FeedbackPage;
