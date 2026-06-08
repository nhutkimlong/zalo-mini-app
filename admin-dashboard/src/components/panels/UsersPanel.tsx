import React from "react";
import { UserPlus, Search, Edit2, Trash2, Calendar, Phone, MessageSquare, Heart } from "lucide-react";
import { AdminUser } from "../../services/adminApi";

interface UsersPanelProps {
  users: AdminUser[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleOpenAddUser: () => void;
  handleOpenEditUser: (user: AdminUser) => void;
  handleDeleteUser: (id: string) => void;
  onViewChatLogs: (userName: string) => void;
}

export const UsersPanel: React.FC<UsersPanelProps> = ({
  users,
  searchQuery,
  setSearchQuery,
  handleOpenAddUser,
  handleOpenEditUser,
  handleDeleteUser,
  onViewChatLogs,
}) => {

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span 
            className="badge" 
            style={{ 
              backgroundColor: "rgba(212, 175, 55, 0.15)", 
              color: "var(--accent-gold)", 
              border: "1px solid var(--accent-gold)",
              fontWeight: 700
            }}
          >
            Admin
          </span>
        );
      case "editor":
        return (
          <span 
            className="badge badge-info" 
            style={{ fontWeight: 600 }}
          >
            Editor
          </span>
        );
      case "visitor":
      default:
        return (
          <span 
            className="badge" 
            style={{ 
              backgroundColor: "rgba(255, 255, 255, 0.08)", 
              color: "rgba(255, 255, 255, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.1)" 
            }}
          >
            Visitor
          </span>
        );
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q) ||
      (u.zalo_user_id || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Action Header bar */}
      <div 
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap"
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
          <span 
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255, 255, 255, 0.4)",
              display: "flex"
            }}
          >
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Tìm kiếm người dùng theo tên, SĐT, Zalo ID, vai trò..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{
              paddingLeft: "36px",
              width: "100%",
              boxSizing: "border-box"
            }}
          />
        </div>

        <button 
          onClick={handleOpenAddUser}
          className="btn btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            height: "40px",
            whiteSpace: "nowrap"
          }}
        >
          <UserPlus size={16} />
          <span>Thêm thành viên</span>
        </button>
      </div>

      {/* Stats Cards Summary */}
      <div 
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px"
        }}
      >
        <div className="stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Tổng thành viên</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--accent-gold)" }}>
            {users.filter(u => u.role === "admin").length}
          </div>
          <div className="stat-label">Admin / Quản trị viên</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#38bdf8" }}>
            {users.filter(u => u.role === "editor").length}
          </div>
          <div className="stat-label">Editor / Biên tập viên</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "rgba(255,255,255,0.7)" }}>
            {users.filter(u => u.role === "visitor" || !u.role).length}
          </div>
          <div className="stat-label">Khách vãng lai / Du khách</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "60px" }}>Avatar</th>
              <th>Họ tên</th>
              <th>Liên kết tài khoản</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th style={{ textAlign: "center" }}>Địa danh lưu</th>
              <th>Ngày tạo</th>
              <th style={{ width: "130px", textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-light)" }}>
                  Không tìm thấy người dùng nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name} 
                        style={{ 
                          width: "36px", 
                          height: "36px", 
                          borderRadius: "50%", 
                          objectFit: "cover",
                          border: "1px solid rgba(212, 175, 55, 0.3)"
                        }} 
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div 
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(212, 175, 55, 0.1)",
                          color: "var(--accent-gold)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: 700,
                          border: "1px solid rgba(212, 175, 55, 0.2)"
                        }}
                      >
                        {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--cream-white)" }}>{user.name}</td>
                  <td>
                    {user.zalo_user_id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span className="badge badge-info" style={{ fontWeight: 600 }}>Zalo Mini App</span>
                        <code style={{ fontSize: "10px", opacity: 0.6 }}>{user.zalo_user_id}</code>
                      </div>
                    ) : (
                      <span className="badge badge-success" style={{ fontWeight: 600 }}>Email / Supabase</span>
                    )}
                  </td>
                  <td>
                    {user.phone ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Phone size={12} style={{ color: "rgba(255, 255, 255, 0.4)" }} />
                        <span>{user.phone}</span>
                      </span>
                    ) : (
                      <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>Chưa cập nhật</span>
                    )}
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td style={{ textAlign: "center" }}>
                    <span 
                      style={{ 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "4px",
                        color: user.favorites_count && user.favorites_count > 0 ? "var(--accent-gold)" : "rgba(255,255,255,0.3)" 
                      }}
                    >
                      <Heart size={14} fill={user.favorites_count && user.favorites_count > 0 ? "var(--accent-gold)" : "none"} />
                      <strong>{user.favorites_count || 0}</strong>
                    </span>
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-light)" }}>
                      <Calendar size={12} />
                      <span>{formatDate(user.created_at)}</span>
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                      <button 
                        className="btn btn-secondary btn-xs" 
                        onClick={() => onViewChatLogs(user.name)}
                        title="Xem nhật ký chat AI"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", borderColor: "rgba(212, 175, 55, 0.3)" }}
                      >
                        <MessageSquare size={13} style={{ color: "var(--accent-gold)" }} />
                      </button>
                      <button 
                        className="btn btn-secondary btn-xs" 
                        onClick={() => handleOpenEditUser(user)}
                        title="Chỉnh sửa thông tin"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        className="btn btn-danger btn-xs" 
                        onClick={() => handleDeleteUser(user.id)}
                        title="Xóa người dùng"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
