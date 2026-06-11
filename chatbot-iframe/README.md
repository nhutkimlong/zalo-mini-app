# Standalone Chatbot AI - Núi Bà Đen

Đây là phiên bản rút gọn và độc lập của Chatbot AI Núi Bà Đen, được thiết kế để có thể nhúng vào các website khác qua `iframe`.

## Cách sử dụng

### 1. Chạy cục bộ (Local Development)
Do sử dụng ES Modules, bạn cần chạy qua một web server thay vì mở trực tiếp file HTML.
Bạn có thể dùng bất kỳ công cụ nào như:
- `npx serve .`
- Hoặc dùng Live Server trong VS Code.

### 2. Nhúng vào Website khác (Iframe)
Dùng đoạn mã sau để nhúng chatbot vào trang web của bạn:

```html
<iframe 
  src="path/to/chatbot/index.html" 
  width="100%" 
  height="600px" 
  style="border:none; border-radius: 20px; shadow: 0 4px 6px rgba(0,0,0,0.1);"
></iframe>
```

## Tính năng
- 💬 **Trò chuyện với AI**: Giải đáp thắc mắc về Núi Bà Đen.
- 🗺️ **Lập lịch trình**: Tự động tạo kế hoạch tham quan dựa trên yêu cầu.
- 🎤 **Hỗ trợ giọng nói**: Nhấn icon micro để nói thay vì gõ (Yêu cầu trình duyệt hỗ trợ).
- 📱 **Mobile Optimized**: Giao diện mượt mà, thân thiện với điện thoại.

## Cấu hình
Các thông số API (Gemini, Supabase) được cấu hình trong file `api.js`.
Nếu bạn thay đổi database hoặc API Key, hãy cập nhật tại đó.
