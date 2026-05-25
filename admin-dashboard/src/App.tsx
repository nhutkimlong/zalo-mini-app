import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { DashboardPanel } from "./components/panels/DashboardPanel";
import { ArticlesPanel } from "./components/panels/ArticlesPanel";
import { GuidesPanel } from "./components/panels/GuidesPanel";
import { PlacesPanel } from "./components/panels/PlacesPanel";
import { ItinerariesPanel } from "./components/panels/ItinerariesPanel";
import { AnnouncementsPanel } from "./components/panels/AnnouncementsPanel";
import { FeedbacksPanel } from "./components/panels/FeedbacksPanel";
import { ChatsPanel } from "./components/panels/ChatsPanel";
import { UsagePanel } from "./components/panels/UsagePanel";
import { Menu } from "lucide-react";

import { ArticleModal } from "./components/modals/ArticleModal";
import { PlaceModal } from "./components/modals/PlaceModal";
import { ItineraryModal } from "./components/modals/ItineraryModal";
import { AnnouncementModal } from "./components/modals/AnnouncementModal";
import { FeedbackModal } from "./components/modals/FeedbackModal";

import adminApi, { 
  AdminKnowledgeArticle, 
  AdminPlace, 
  AdminAnnouncement, 
  AdminFeedback,
  AdminChatLog,
  AdminUsageSummary,
  AdminItineraryStep,
  AdminItinerary
} from "./services/adminApi";

const toSlug = (str: string): string => {
  if (!str) return "";
  let slug = str.toLowerCase();
  
  // Replace Vietnamese accents
  slug = slug.replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, "a");
  slug = slug.replace(/[éèẻẽẹêếềểễệ]/g, "e");
  slug = slug.replace(/[íìỉĩị]/g, "i");
  slug = slug.replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, "o");
  slug = slug.replace(/[úùủũụưứừửữự]/g, "u");
  slug = slug.replace(/[ýỳỷỹỵ]/g, "y");
  slug = slug.replace(/đ/g, "d");
  
  // Replace non-alphanumeric characters with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, "-");
  
  // Remove starting and ending hyphens
  slug = slug.replace(/(^-|-$)/g, "");
  
  return slug;
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "articles" | "guides" | "places" | "itineraries" | "announcements" | "feedbacks" | "chats" | "usage" >("dashboard");

  // State arrays
  const [articles, setArticles] = useState<AdminKnowledgeArticle[]>([]);
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [itineraries, setItineraries] = useState<AdminItinerary[]>([]);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [chats, setChats] = useState<AdminChatLog[]>([]);
  const [usageSummary, setUsageSummary] = useState<AdminUsageSummary | null>(null);

  // Selection & Modals State
  const [loading, setLoading] = useState(true);
  const [indexingMsg, setIndexingMsg] = useState<string | null>(null);
  const [isReindexing, setIsReindexing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal Control
  const [modalType, setModalType] = useState<"add" | "edit" | "resolve" | null>(null);
  const [modalResource, setModalResource] = useState<"article" | "place" | "announcement" | "feedback" | "itinerary" | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<string | undefined>(undefined);

  // Dynamic system settings
  const [cfgModel, setCfgModel] = useState("gemini-2.5-flash");
  const [cfgInputCost, setCfgInputCost] = useState(0.30);
  const [cfgOutputCost, setCfgOutputCost] = useState(2.50);
  const [cfgEmbedModel, setCfgEmbedModel] = useState("gemini-embedding-2");
  const [cfgEmbedCost, setCfgEmbedCost] = useState(0.20);
  const [savingSettings, setSavingSettings] = useState(false);

  // Search filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [exchangeRate, setExchangeRate] = useState(25450);

  const closeModal = () => {
    setModalType(null);
    setModalResource(null);
    setSelectedItem(null);
    setDefaultCategory(undefined);
  };

  // Load all dashboard datasets on mount
  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        adminApi.getArticles(),
        adminApi.getPlaces(),
        adminApi.getAnnouncements(),
        adminApi.getFeedbacks(),
        adminApi.getChatLogs(),
        adminApi.getUsageSummary(),
        adminApi.getItineraries(),
        adminApi.getSettings()
      ]);

      if (results[0].status === "fulfilled") setArticles(results[0].value);
      
      if (results[1].status === "fulfilled") {
        setPlaces(results[1].value);
      } else {
        console.error("Failed to load places from database:", results[1].reason);
        alert("Lỗi: Không thể tải dữ liệu địa danh từ database Supabase! Vui lòng kiểm tra kết nối mạng hoặc API server.");
      }

      if (results[2].status === "fulfilled") setAnnouncements(results[2].value);
      if (results[3].status === "fulfilled") setFeedbacks(results[3].value);
      if (results[4].status === "fulfilled") setChats(results[4].value);
      if (results[5].status === "fulfilled") setUsageSummary(results[5].value);
      if (results[6].status === "fulfilled") setItineraries(results[6].value);

      if (results[7].status === "fulfilled") {
        setCfgModel(results[7].value.model);
        setCfgInputCost(results[7].value.input_cost_per_1m);
        setCfgOutputCost(results[7].value.output_cost_per_1m);
        setCfgEmbedModel(results[7].value.embed_model || "gemini-embedding-2");
        setCfgEmbedCost(results[7].value.embed_cost_per_1m || 0.20);
      }
    } catch (e) {
      console.error("Failed to load backend administration data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Tự động lấy tỷ giá USD sang VND thời gian thực từ API công khai
    const fetchExchangeRate = async () => {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates && data.rates.VND) {
            setExchangeRate(data.rates.VND);
            console.log("Realtime USD to VND exchange rate loaded:", data.rates.VND);
          }
        }
      } catch (err) {
        console.error("Failed to fetch exchange rate, using fallback 25,450:", err);
      }
    };
    fetchExchangeRate();

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Knowledge Articles Submissions ---
  const handleOpenAddArticle = (defaultCat?: string, defaultTitle?: string) => {
    if (defaultTitle) {
      setSelectedItem({ title: defaultTitle, content: "", category: defaultCat || "lich_su", is_published: true });
    } else {
      setSelectedItem(null);
    }
    setDefaultCategory(defaultCat);
    setModalResource("article");
    setModalType("add");
  };

  const handleOpenEditArticle = (art: AdminKnowledgeArticle) => {
    setSelectedItem(art);
    setModalResource("article");
    setModalType("edit");
  };

  const handleSaveArticle = async (data: {
    title: string;
    category: string;
    content: string;
    is_published: boolean;
    title_en?: string;
    content_en?: string;
  }) => {
    closeModal();

    // Dynamic animation wrapper showing vector ingestion (WOW Factor!)
    setIndexingMsg("Bắt đầu phân tích văn bản thành các chunks...");
    setTimeout(() => {
      setIndexingMsg("Đang tạo vector embedding (3072 chiều) thông qua OpenAI/Gemini...");
    }, 1200);
    setTimeout(() => {
      setIndexingMsg("Đang ghi vào cơ sở dữ liệu Supabase pgvector và cập nhật chỉ mục hnsw...");
    }, 2400);
    setTimeout(async () => {
      try {
        if (selectedItem) {
          // Update
          const updated = await adminApi.updateArticle(selectedItem.id, data);
          setArticles(articles.map(a => a.id === updated.id ? updated : a));
        } else {
          // Create
          const created = await adminApi.createArticle(data);
          setArticles([created, ...articles]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIndexingMsg(null);
      }
    }, 3600);
  };

  const handleDeleteArticle = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết tri thức này và các vector chunks liên quan?")) {
      try {
        await adminApi.deleteArticle(id);
        setArticles(articles.filter(a => a.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReindexKnowledge = async () => {
    setIsReindexing(true);
    setIndexingMsg("Đang lập chỉ mục lại toàn bộ bài viết đã xuất bản...");
    try {
      const res = await adminApi.reindexKnowledge();
      alert(`Đã index ${res.indexed_articles} bài viết. Lỗi: ${res.failed_article_ids.length}`);
    } catch (err) {
      console.error(err);
      alert("Không thể re-index kho tri thức. Vui lòng kiểm tra backend/Supabase logs.");
    } finally {
      setIsReindexing(false);
      setIndexingMsg(null);
    }
  };

  // --- Places Submissions ---
  const handleOpenAddPlace = () => {
    setSelectedItem(null);
    setModalResource("place");
    setModalType("add");
  };

  const handleOpenEditPlace = (pl: AdminPlace) => {
    setSelectedItem(pl);
    setModalResource("place");
    setModalType("edit");
  };

  const handleSavePlace = async (data: Omit<AdminPlace, "id" | "slug">) => {
    try {
      const payload = {
        ...data,
        slug: selectedItem?.slug || toSlug(data.name)
      };

      const sortPlaces = (list: AdminPlace[]) => {
        return [...list].sort((a, b) => {
          const orderA = a.display_order ?? 0;
          const orderB = b.display_order ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          return (a.name || "").localeCompare(b.name || "");
        });
      };

      if (selectedItem) {
        const res = await adminApi.updatePlace(selectedItem.id, payload);
        setPlaces(sortPlaces(places.map(p => p.id === res.id ? res : p)));
      } else {
        const res = await adminApi.createPlace(payload);
        setPlaces(sortPlaces([res, ...places]));
      }
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlace = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa địa danh này?")) {
      try {
        await adminApi.deletePlace(id);
        setPlaces(places.filter(p => p.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- Itineraries Submissions ---
  const handleOpenAddItinerary = () => {
    setSelectedItem(null);
    setModalResource("itinerary");
    setModalType("add");
  };

  const handleOpenEditItinerary = (it: AdminItinerary) => {
    setSelectedItem(it);
    setModalResource("itinerary");
    setModalType("edit");
  };

  const handleSaveItinerary = async (data: {
    name: string;
    name_en?: string;
    duration: string;
    duration_en?: string;
    color: string;
    place_slugs: string[];
    steps: AdminItineraryStep[];
    status?: string;
  }) => {
    try {
      if (selectedItem) {
        const res = await adminApi.updateItinerary(selectedItem.id, data);
        setItineraries(itineraries.map(i => i.id === res.id ? res : i));
      } else {
        const res = await adminApi.createItinerary(data);
        setItineraries([res, ...itineraries]);
      }
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItinerary = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lộ trình này?")) {
      try {
        await adminApi.deleteItinerary(id);
        setItineraries(itineraries.filter(i => i.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- Announcements Submissions ---
  const handleOpenAddAnnouncement = () => {
    setSelectedItem(null);
    setModalResource("announcement");
    setModalType("add");
  };

  const handleOpenEditAnnouncement = (ann: AdminAnnouncement) => {
    setSelectedItem(ann);
    setModalResource("announcement");
    setModalType("edit");
  };

  const handleSaveAnnouncement = async (data: {
    title: string;
    title_en?: string;
    content: string;
    content_en?: string;
    type: "general" | "emergency" | "weather" | "festival";
  }) => {
    try {
      if (selectedItem) {
        const res = await adminApi.updateAnnouncement(selectedItem.id, data);
        setAnnouncements(announcements.map(a => a.id === res.id ? res : a));
      } else {
        const res = await adminApi.createAnnouncement(data);
        setAnnouncements([res, ...announcements]);
      }
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn gỡ bỏ thông báo này?")) {
      try {
        await adminApi.deleteAnnouncement(id);
        setAnnouncements(announcements.filter(a => a.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- Feedback Resolution Submissions ---
  const handleOpenResolveFeedback = (fb: AdminFeedback) => {
    setSelectedItem(fb);
    setModalResource("feedback");
    setModalType("resolve");
  };

  const handleSaveResolveFeedback = async (status: AdminFeedback["status"], adminNotes: string) => {
    try {
      const res = await adminApi.resolveFeedback(selectedItem.id, status, adminNotes);
      setFeedbacks(feedbacks.map(f => f.id === res.id ? res : f));
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phản ánh này khỏi hệ thống? Dữ liệu sẽ bị xóa vĩnh viễn trên Supabase.")) {
      try {
        await adminApi.deleteFeedback(id);
        setFeedbacks(feedbacks.filter(f => f.id !== id));
      } catch (err: any) {
        console.error(err);
        alert(err.message || "Lỗi khi xóa ý kiến phản ánh.");
      }
    }
  };

  const handleResetChatLogs = async () => {
    if (window.confirm("CẢNH BÁO: Hành động này sẽ XÓA TOÀN BỘ nhật ký hội thoại AI và reset tất cả thống kê chi phí, token tiêu thụ trên database Supabase. Bạn có chắc chắn muốn tiếp tục?")) {
      try {
        await adminApi.resetChatLogs();
        setChats([]);
        const summaryRes = await adminApi.getUsageSummary();
        setUsageSummary(summaryRes);
        alert("Đã reset sạch toàn bộ nhật ký hội thoại AI thành công!");
      } catch (err: any) {
        console.error(err);
        alert(err.message || "Lỗi khi reset nhật ký hội thoại.");
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await adminApi.updateSettings({
        model: cfgModel,
        input_cost_per_1m: cfgInputCost,
        output_cost_per_1m: cfgOutputCost,
        embed_model: cfgEmbedModel,
        embed_cost_per_1m: cfgEmbedCost
      });
      alert("Đã cập nhật cấu hình Model AI và Biểu phí thành công lên database Supabase!");
      const usageRes = await adminApi.getUsageSummary();
      setUsageSummary(usageRes);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Lỗi khi lưu cấu hình.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Computations
  const totalArticles = articles.length;
  const activeAnnouncements = announcements.length;
  const totalFeedbacks = feedbacks.length;
  const newFeedbacks = feedbacks.filter(f => f.status === "new").length;

  const totalChats = chats.length;
  const highConfidenceChats = chats.filter(c => c.confidence_score >= 0.7).length;
  const successRate = totalChats > 0 ? Math.round((highConfidenceChats / totalChats) * 100) : 100;

  const formatUsd = (value: number) => {
    const vndValue = value * exchangeRate;
    let vndStr = "";
    if (vndValue === 0) {
      vndStr = "0 VNĐ";
    } else if (vndValue < 0.01) {
      vndStr = `${vndValue.toFixed(4)} VNĐ`;
    } else if (vndValue < 1) {
      vndStr = `${vndValue.toFixed(2)} VNĐ`;
    } else {
      vndStr = `${Math.round(vndValue).toLocaleString("vi-VN")} VNĐ`;
    }
    return `$${value.toFixed(6)} (~${vndStr})`;
  };
  const formatNumber = (value: number) => value.toLocaleString("vi-VN");

  const getFeedbackTypeLabel = (type: string) => {
    switch (type) {
      case "ve_sinh":
      case "hygiene":
        return "Vệ sinh cảnh quan";
      case "gia_ca":
      case "pricing":
        return "Giá dịch vụ / Ép giá";
      case "an_ninh":
      case "security":
        return "An ninh trật tự";
      case "thai_do":
        return "Thái độ phục vụ";
      case "ha_tang":
        return "Cơ sở hạ tầng";
      case "cheo_keo":
        return "Chèo kéo du khách";
      case "gop_y":
        return "Góp ý xây dựng";
      case "other":
      case "khac":
      default:
        return "Khác";
    }
  };

  const getFeedbackTypeBadge = (type: string) => {
    const label = getFeedbackTypeLabel(type);
    switch (type) {
      case "ve_sinh":
      case "hygiene":
        return <span className="badge badge-info">{label}</span>;
      case "gia_ca":
      case "pricing":
        return <span className="badge badge-warning">{label}</span>;
      case "an_ninh":
      case "security":
        return <span className="badge badge-danger">{label}</span>;
      case "thai_do":
        return <span className="badge" style={{ backgroundColor: "#0284C7", color: "white" }}>{label}</span>;
      case "ha_tang":
        return <span className="badge" style={{ backgroundColor: "#0F766E", color: "white" }}>{label}</span>;
      case "cheo_keo":
        return <span className="badge" style={{ backgroundColor: "#D97706", color: "white" }}>{label}</span>;
      case "gop_y":
        return <span className="badge badge-success">{label}</span>;
      case "other":
      case "khac":
      default:
        return <span className="badge">{label}</span>;
    }
  };

  const getFeedbackBadge = (status: AdminFeedback["status"]) => {
    switch (status) {
      case "new":
        return (
          <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span>Chờ xử lý</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span>Đang xử lý</span>
          </span>
        );
      case "resolved":
        return (
          <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span>Đã giải quyết</span>
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getAnnBadge = (type: AdminAnnouncement["type"]) => {
    switch (type) {
      case "emergency":
        return (
          <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span>Khẩn cấp</span>
          </span>
        );
      case "weather":
        return (
          <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span>Thời tiết</span>
          </span>
        );
      case "festival":
        return (
          <span className="badge badge-info" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span>Lễ hội</span>
          </span>
        );
      case "general":
        return (
          <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span>Thường nhật</span>
          </span>
        );
    }
  };

  const getAudioFileLabel = (url?: string | null) => {
    const value = url?.trim();
    if (!value || value.toLowerCase() === "none") return "None";
    return value.split("/").pop() || value;
  };

  return (
    <div className="admin-layout">
      {/* Slide-out Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay show-on-mobile" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        setSearchQuery={setSearchQuery} 
        newFeedbacks={newFeedbacks} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header Bar */}
        <header className="topbar">
          <button 
            className="show-on-mobile btn btn-secondary" 
            style={{ 
              padding: "6px 10px", 
              marginRight: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          
          <div className="topbar-title">
            {activeTab === "dashboard" && "Bảng Điều Khiển Hệ Thống"}
            {activeTab === "articles" && "Quản Lý Kho Tri Thức RAG (Supabase pgvector)"}
            {activeTab === "guides" && "Thông Tin Hướng Dẫn Tham Quan (Đồng bộ Zalo Mini App)"}
            {activeTab === "places" && "Danh Mục Điểm Tham Quan & Thuyết Minh Số"}
            {activeTab === "itineraries" && "Thiết Kế Tuyến Đi & Lộ Trình Tham Quan Đề Xuất (Supabase Database)"}
            {activeTab === "announcements" && "Quản Lý Thông Báo & Cảnh Báo Bản Tin"}
            {activeTab === "feedbacks" && "Tổng Hợp Ý Kiến & Phản Ánh Của Du Khách"}
            {activeTab === "chats" && "Nhật Ký Hội Thoại AI & Kiểm Toán Chất Lượng RAG"}
            {activeTab === "usage" && "Tổng Chi Phí Gọi Model Beeknoee"}
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }} className="hide-on-mobile">
            <span style={{ fontSize: "12px", color: "var(--text-light)", fontWeight: 600 }}>Hệ thống:</span>
            <span className="badge badge-success">● Đang hoạt động</span>
          </div>
        </header>

        {/* Action Panel Ingesting Alert */}
        {indexingMsg && (
          <div 
            style={{ 
              backgroundColor: "rgba(11, 37, 69, 0.9)", 
              color: "var(--accent-gold)", 
              padding: "16px 32px",
              display: "flex",
              alignItems: "center",
              gap: "15px",
              fontSize: "14px",
              fontWeight: 700,
              borderBottom: "2px solid var(--accent-gold)"
            }}
          >
            <div className="spinner" style={{ width: "20px", height: "20px", border: "2px solid var(--accent-gold)", borderTopColor: "transparent" }}></div>
            <span>{indexingMsg}</span>
          </div>
        )}

        <div className="content-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "100px", color: "var(--text-light)" }}>
              <div className="spinner" style={{ width: "30px", height: "30px", margin: "0 auto 16px auto" }}></div>
              <p style={{ fontWeight: 600 }}>Đang đồng bộ hóa dữ liệu từ cơ sở dữ liệu quốc gia...</p>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <DashboardPanel
                  totalArticles={totalArticles}
                  activeAnnouncements={activeAnnouncements}
                  newFeedbacks={newFeedbacks}
                  totalFeedbacks={totalFeedbacks}
                  totalChats={totalChats}
                  successRate={successRate}
                  feedbacks={feedbacks}
                  highConfidenceChats={highConfidenceChats}
                  chats={chats}
                  setActiveTab={setActiveTab}
                  getFeedbackTypeLabel={getFeedbackTypeLabel}
                  getFeedbackBadge={getFeedbackBadge}
                  handleOpenResolveFeedback={handleOpenResolveFeedback}
                  handleOpenAddArticle={handleOpenAddArticle}
                />
              )}

              {activeTab === "articles" && (
                <ArticlesPanel
                  articles={articles}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  isReindexing={isReindexing}
                  handleReindexKnowledge={handleReindexKnowledge}
                  handleOpenAddArticle={() => handleOpenAddArticle()}
                  handleOpenEditArticle={handleOpenEditArticle}
                  handleDeleteArticle={handleDeleteArticle}
                />
              )}

              {activeTab === "guides" && (
                <GuidesPanel
                  articles={articles}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  handleOpenAddArticle={handleOpenAddArticle}
                  handleOpenEditArticle={handleOpenEditArticle}
                  handleDeleteArticle={handleDeleteArticle}
                />
              )}

              {activeTab === "places" && (
                <PlacesPanel
                  places={places}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  handleOpenAddPlace={handleOpenAddPlace}
                  handleOpenEditPlace={handleOpenEditPlace}
                  handleDeletePlace={handleDeletePlace}
                  getAudioFileLabel={getAudioFileLabel}
                />
              )}

              {activeTab === "itineraries" && (
                <ItinerariesPanel
                  itineraries={itineraries}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  places={places}
                  handleOpenAddItinerary={handleOpenAddItinerary}
                  handleOpenEditItinerary={handleOpenEditItinerary}
                  handleDeleteItinerary={handleDeleteItinerary}
                />
              )}

              {activeTab === "announcements" && (
                <AnnouncementsPanel
                  announcements={announcements}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  handleOpenAddAnnouncement={handleOpenAddAnnouncement}
                  handleOpenEditAnnouncement={handleOpenEditAnnouncement}
                  handleDeleteAnnouncement={handleDeleteAnnouncement}
                  getAnnBadge={getAnnBadge}
                />
              )}

              {activeTab === "feedbacks" && (
                <FeedbacksPanel
                  feedbacks={feedbacks}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  getFeedbackTypeBadge={getFeedbackTypeBadge}
                  getFeedbackBadge={getFeedbackBadge}
                  handleOpenResolveFeedback={handleOpenResolveFeedback}
                  handleDeleteFeedback={handleDeleteFeedback}
                />
              )}

              {activeTab === "chats" && (
                <ChatsPanel
                  chats={chats}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  formatUsd={formatUsd}
                  formatNumber={formatNumber}
                  handleResetChatLogs={handleResetChatLogs}
                />
              )}

              {activeTab === "usage" && (
                <UsagePanel
                  usageSummary={usageSummary}
                  formatUsd={formatUsd}
                  formatNumber={formatNumber}
                  cfgModel={cfgModel}
                  setCfgModel={setCfgModel}
                  cfgInputCost={cfgInputCost}
                  setCfgInputCost={setCfgInputCost}
                  cfgOutputCost={cfgOutputCost}
                  setCfgOutputCost={setCfgOutputCost}
                  cfgEmbedModel={cfgEmbedModel}
                  setCfgEmbedModel={setCfgEmbedModel}
                  cfgEmbedCost={cfgEmbedCost}
                  setCfgEmbedCost={setCfgEmbedCost}
                  savingSettings={savingSettings}
                  handleSaveSettings={handleSaveSettings}
                  exchangeRate={exchangeRate}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* --- FORM MODALS --- */}
      {modalType && modalResource && (
        <div className="modal-overlay">
          {modalResource === "article" && (
            <ArticleModal
              onClose={closeModal}
              onSave={handleSaveArticle}
              selectedItem={selectedItem}
              modalType={modalType === "resolve" ? null : modalType}
              defaultCategory={defaultCategory}
            />
          )}

          {modalResource === "place" && (
            <PlaceModal
              onClose={closeModal}
              onSave={handleSavePlace}
              selectedItem={selectedItem}
              modalType={modalType === "resolve" ? null : modalType}
            />
          )}

          {modalResource === "itinerary" && (
            <ItineraryModal
              onClose={closeModal}
              onSave={handleSaveItinerary}
              selectedItem={selectedItem}
              modalType={modalType === "resolve" ? null : modalType}
              places={places}
            />
          )}

          {modalResource === "announcement" && (
            <AnnouncementModal
              onClose={closeModal}
              onSave={handleSaveAnnouncement}
              selectedItem={selectedItem}
              modalType={modalType === "resolve" ? null : modalType}
            />
          )}

          {modalResource === "feedback" && selectedItem && (
            <FeedbackModal
              onClose={closeModal}
              onSave={handleSaveResolveFeedback}
              selectedItem={selectedItem}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default App;
