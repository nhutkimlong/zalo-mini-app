import React, { useState, useEffect } from "react";
import { AdminUser } from "../../services/adminApi";

interface UserModalProps {
  onClose: () => void;
  onSave: (data: {
    zalo_user_id: string;
    name: string;
    phone?: string | null;
    avatar_url?: string | null;
    role: string;
  }) => void;
  selectedItem: AdminUser | null;
  modalType: "add" | "edit" | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  onClose,
  onSave,
  selectedItem,
  modalType,
}) => {
  const [zaloUserId, setZaloUserId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState("visitor");

  useEffect(() => {
    if (modalType === "edit" && selectedItem) {
      setZaloUserId(selectedItem.zalo_user_id || "");
      setName(selectedItem.name || "");
      setPhone(selectedItem.phone || "");
      setAvatarUrl(selectedItem.avatar_url || "");
      setRole(selectedItem.role || "visitor");
    } else {
      setZaloUserId("");
      setName("");
      setPhone("");
      setAvatarUrl("");
      setRole("visitor");
    }
  }, [modalType, selectedItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zaloUserId.trim() || !name.trim()) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc!");
      return;
    }
    onSave({
      zalo_user_id: zaloUserId,
      name,
      phone: phone.trim() ? phone : null,
      avatar_url: avatarUrl.trim() ? avatarUrl : null,
      role,
    });
  };

  return (
    <div className="modal-content">
      <header className="modal-header">
        <h3>{modalType === "add" ? "Thêm người dùng mới" : "Chỉnh sửa người dùng"}</h3>
        <button type="button" className="btn btn-secondary btn-xs" onClick={onClose}>✕</button>
      </header>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Zalo User ID *</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              disabled={modalType === "edit"} // Khóa không cho sửa zalo_user_id khi edit
              placeholder="Ví dụ: 2817652167434672457"
              value={zaloUserId} 
              onChange={e => setZaloUserId(e.target.value)} 
            />
            {modalType === "add" && (
              <small style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "11px", marginTop: "4px", display: "block" }}>
                Nhập chính xác ID người dùng từ Zalo SDK / Zalo OA Webhook để đối khớp dữ liệu.
              </small>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Họ tên người dùng *</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              placeholder="Nhập tên người dùng…"
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Vai trò (Role)</label>
            <select 
              className="form-select" 
              value={role} 
              onChange={e => setRole(e.target.value)}
            >
              <option value="visitor">Visitor (Khách du lịch / Người dùng App)</option>
              <option value="editor">Editor (Biên tập viên quản lý nội dung)</option>
              <option value="admin">Admin (Quản trị viên toàn hệ thống)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Số điện thoại liên hệ (Tùy chọn)</label>
            <input 
              type="tel" 
              className="form-input" 
              placeholder="Nhập số điện thoại…"
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Đường dẫn ảnh đại diện (Avatar URL - Tùy chọn)</label>
            <input 
              type="url" 
              className="form-input" 
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl} 
              onChange={e => setAvatarUrl(e.target.value)} 
            />
            {avatarUrl && (
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-light)" }}>Xem trước:</span>
                <img 
                  src={avatarUrl} 
                  alt="Avatar Preview" 
                  style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--accent-gold)" }} 
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <footer className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="btn btn-primary">{modalType === "add" ? "Thêm thành viên" : "Lưu thay đổi"}</button>
        </footer>
      </form>
    </div>
  );
};
