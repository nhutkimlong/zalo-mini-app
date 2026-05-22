import React, { createContext, useContext, useState } from "react";

export type Language = "vi" | "en";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  vi: {
    "nav.home": "Trang chủ",
    "nav.places": "Địa danh",
    "nav.chat": "Hỏi đáp AI",
    "nav.feedback": "Góp ý",
    "nav.announcements": "Bản tin",
    "nav.info": "Thông tin",
    "home.welcome": "Chào mừng đến với Núi Bà Đen",
    "home.subtitle": "Nóc nhà Nam Bộ - Điểm hẹn tâm linh & thiên nhiên kỳ vĩ",
    "home.quick_links": "Truy cập nhanh",
    "home.weather_warning": "Xem khuyến cáo thời tiết mới nhất",
    "home.visit_guide": "Hướng dẫn chi tiết tham quan di tích năm 2026",
    "places.title": "Khám Phá Địa Danh",
    "places.all": "Tất cả",
    "places.tam_linh": "Tâm Linh",
    "places.phong_canh": "Phong Cảnh",
    "places.dich_vu": "Cáp Treo & Dịch Vụ",
    "places.listen_guide": "Nghe thuyết minh di tích số",
    "places.stop_audio": "Dừng nghe",
    "places.detail": "Chi tiết",
    "chat.title": "Trợ Lý AI Núi Bà Đen",
    "chat.placeholder": "Hỏi tôi về giá vé, giờ mở cửa, trang phục, lịch sử...",
    "chat.send": "Gửi",
    "chat.suggested": "Câu hỏi thường gặp:",
    "feedback.title": "Phản Ánh & Góp Ý",
    "feedback.subtitle": "Ý kiến đóng góp giúp chúng tôi nâng cao chất lượng dịch vụ du lịch",
    "feedback.label.name": "Họ và tên của bạn",
    "feedback.label.phone": "Số điện thoại liên hệ",
    "feedback.label.type": "Loại góp ý phản ánh",
    "feedback.label.content": "Nội dung phản ánh chi tiết",
    "feedback.label.image": "Hình ảnh đính kèm (nếu có)",
    "feedback.submit": "Gửi góp ý của bạn",
    "feedback.success": "Gửi phản ánh thành công! Ban Quản lý sẽ sớm phản hồi.",
    "announcements.title": "Bản Tin & Cảnh Báo",
    "announcements.empty": "Không có thông báo mới nào",
    "info.title": "Hướng Dẫn Tham Quan",
    "info.ticket_title": "Bảng Giá Vé Cáp Treo Sun World",
    "info.opening_title": "Giờ Hoạt Động & Vận Hành",
    "info.rules_title": "Nội Quy Chiêm Bái & Lịch Sự",
    "info.history_title": "Lịch Sử & Sự Tích Linh Sơn Thánh Mẫu",
    "common.loading": "Đang tải dữ liệu...",
    "common.error": "Có lỗi xảy ra, vui lòng thử lại.",
    "common.no_data": "Không tìm thấy thông tin."
  },
  en: {
    "nav.home": "Home",
    "nav.places": "Places",
    "nav.chat": "AI Chat",
    "nav.feedback": "Feedback",
    "nav.announcements": "News",
    "nav.info": "Guide Info",
    "home.welcome": "Welcome to Ba Den Mountain",
    "home.subtitle": "The Roof of Southern Vietnam - Sacred Pilgrimage & Majestic Nature",
    "home.quick_links": "Quick Links",
    "home.weather_warning": "View latest weather advisory",
    "home.visit_guide": "Detailed visitor guide for 2026",
    "places.title": "Explore Attractions",
    "places.all": "All",
    "places.tam_linh": "Spiritual",
    "places.phong_canh": "Scenic",
    "places.dich_vu": "Cable & Services",
    "places.listen_guide": "Listen to digital guide",
    "places.stop_audio": "Stop audio",
    "places.detail": "Detail",
    "chat.title": "Ba Den AI Assistant",
    "chat.placeholder": "Ask about ticket prices, hours, dress code, history...",
    "chat.send": "Send",
    "chat.suggested": "Frequently Asked Questions:",
    "feedback.title": "Reports & Feedback",
    "feedback.subtitle": "Your feedback helps us improve our tourism quality",
    "feedback.label.name": "Your Full Name",
    "feedback.label.phone": "Contact Phone Number",
    "feedback.label.type": "Feedback Category",
    "feedback.label.content": "Detailed Description",
    "feedback.label.image": "Attach Photo (optional)",
    "feedback.submit": "Submit Feedback",
    "feedback.success": "Feedback sent successfully! The board will reply soon.",
    "announcements.title": "Announcements & Weather",
    "announcements.empty": "No new announcements available",
    "info.title": "Visitor Guide",
    "info.ticket_title": "Sun World Cable Car Ticket Prices",
    "info.opening_title": "Operating & Service Hours",
    "info.rules_title": "Worship Rules & Modesty Regulations",
    "info.history_title": "History & Legend of Linh Son Thanh Mau",
    "common.loading": "Loading data...",
    "common.error": "An error occurred, please try again.",
    "common.no_data": "No information found."
  }
};

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("zalo_mini_app_lang");
    return saved === "en" || saved === "vi" ? saved : "vi";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("zalo_mini_app_lang", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
