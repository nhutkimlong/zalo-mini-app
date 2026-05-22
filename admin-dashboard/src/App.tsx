import React, { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  MapPin, 
  Bell, 
  AlertTriangle, 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Search, 
  Database,
  ExternalLink,
  Bot,
  Headphones,
  DollarSign,
  Camera
} from "lucide-react";
import adminApi, { 
  AdminKnowledgeArticle, 
  AdminPlace, 
  AdminAnnouncement, 
  AdminFeedback,
  AdminChatLog,
  AdminUsageSummary
} from "./services/adminApi";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "articles" | "guides" | "places" | "announcements" | "feedbacks" | "chats" | "usage">("dashboard");

  // State arrays
  const [articles, setArticles] = useState<AdminKnowledgeArticle[]>([]);
  const [places, setPlaces] = useState<AdminPlace[]>([]);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [chats, setChats] = useState<AdminChatLog[]>([]);
  const [usageSummary, setUsageSummary] = useState<AdminUsageSummary | null>(null);

  // Selection & Modals State
  const [loading, setLoading] = useState(true);
  const [indexingMsg, setIndexingMsg] = useState<string | null>(null);
  const [isReindexing, setIsReindexing] = useState(false);

  // Modal Control
  const [modalType, setModalType] = useState<"add" | "edit" | "resolve" | null>(null);
  const [modalResource, setModalResource] = useState<"article" | "place" | "announcement" | "feedback" | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Form states for Knowledge Articles
  const [artTitle, setArtTitle] = useState("");
  const [artCategory, setArtCategory] = useState("ve_va_gio_mo_cua");
  const [artContent, setArtContent] = useState("");
  const [artPublished, setArtPublished] = useState(true);

  // Visual Ticket Builder state (for ve_va_gio_mo_cua category only)
  const DEFAULT_VISUAL_TICKETS = [
    {
      title: "1. Tuyến cáp Vân Sơn (Lên đỉnh núi)",
      titleEn: "1. Van Son Cable Route (To the Peak)",
      items: [
        { name: "Vé khứ hồi người lớn", nameEn: "Adult Round-trip", price: "400.000 VNĐ", priceEn: "400,000 VND" },
        { name: "Vé khứ hồi trẻ em (1m - 1m4)", nameEn: "Child Round-trip (1m - 1m4)", price: "300.000 VNĐ", priceEn: "300,000 VND" },
        { name: "Trẻ em dưới 1m", nameEn: "Child under 1m", price: "Miễn phí", priceEn: "Free" }
      ]
    },
    {
      title: "2. Tuyến cáp Chùa Hang (Lên Chùa Bà)",
      titleEn: "2. Chua Hang Cable Route (To Ba Temple)",
      items: [
        { name: "Vé khứ hồi người lớn", nameEn: "Adult Round-trip", price: "250.000 VNĐ", priceEn: "250,000 VND", priceOneway: "150.000 VNĐ", priceOnewayEn: "150,000 VND" },
        { name: "Vé khứ hồi trẻ em (1m - 1m4)", nameEn: "Child Round-trip (1m - 1m4)", price: "150.000 VNĐ", priceEn: "150,000 VND", priceOneway: "100.000 VNĐ", priceOnewayEn: "100,000 VND" }
      ]
    },
    {
      title: "3. Combo Vé Đỉnh + Vé Chùa (Tất cả các tuyến)",
      titleEn: "3. Peak + Temple Combo Ticket (All Lines)",
      items: [
        { name: "Người lớn", nameEn: "Adult", price: "600.000 VNĐ", priceEn: "600,000 VND" },
        { name: "Trẻ em (1m - 1m4)", nameEn: "Child (1m - 1m4)", price: "400.000 VNĐ", priceEn: "400,000 VND" }
      ]
    },
    {
      title: "4. Combo Vé Đỉnh + Vé Chùa + Buffet (Tất cả các tuyến)",
      titleEn: "4. Peak + Temple + Buffet Combo Ticket (All Lines)",
      items: [
        { name: "Người lớn", nameEn: "Adult", price: "800.000 VNĐ", priceEn: "800,000 VND" },
        { name: "Trẻ em (1m - 1m4)", nameEn: "Child (1m - 1m4)", price: "600.000 VNĐ", priceEn: "600,000 VND" }
      ]
    }
  ];
  const [visualTickets, setVisualTickets] = useState<any[]>(DEFAULT_VISUAL_TICKETS);
  const DEFAULT_VISUAL_SCHEDULES = [
    {
      title: "Tuyen dinh Van Son",
      titleEn: "Van Son Peak Route",
      items: [
        { label: "Thu 2 - Thu 6", labelEn: "Monday - Friday", hours: "07:00 - 18:00", hoursEn: "07:00 - 18:00", note: "", noteEn: "" },
        { label: "Thu 7 - Chu Nhat", labelEn: "Saturday - Sunday", hours: "06:00 - 21:00", hoursEn: "06:00 - 21:00", note: "(ngam den LED dinh nui ban dem)", noteEn: "(night LED light show)" }
      ]
    },
    {
      title: "Tuyen Chua Hang",
      titleEn: "Chua Hang Route",
      items: [
        { label: "Thu 2 - Thu 6", labelEn: "Monday - Friday", hours: "06:00 - 18:00", hoursEn: "06:00 - 18:00", note: "", noteEn: "" },
        { label: "Thu 7 - Chu Nhat", labelEn: "Saturday - Sunday", hours: "05:30 - 22:00", hoursEn: "05:30 - 22:00", note: "", noteEn: "" }
      ]
    },
    {
      title: "Khu vuc den Chua Ba",
      titleEn: "Ba Temple Area",
      items: [
        { label: "Hang ngay", labelEn: "Daily", hours: "06:00 - 22:00", hoursEn: "06:00 - 22:00", note: "", noteEn: "" }
      ]
    }
  ];
  const [visualSchedules, setVisualSchedules] = useState<any[]>(DEFAULT_VISUAL_SCHEDULES);
  const [translatingTicketField, setTranslatingTicketField] = useState<string | null>(null);

  // Form states for Places
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

  // Form states for Announcements
  const [annTitle, setAnnTitle] = useState("");
  const [annTitleEn, setAnnTitleEn] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annContentEn, setAnnContentEn] = useState("");
  const [annType, setAnnType] = useState<"general" | "emergency" | "weather" | "festival">("general");

  // AI and Media integration helpers
  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  const closeModal = () => {
    setModalType(null);
    setModalResource(null);
    setSelectedItem(null);
    setTranslatingField(null);
    setUploadingFile(null);
  };

  const handleTranslate = async (sourceText: string, fieldToSet: "plNameEn" | "plShortEn" | "plFullEn" | "annTitleEn" | "annContentEn") => {
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
      else if (fieldToSet === "annTitleEn") setAnnTitleEn(res.translated_text);
      else if (fieldToSet === "annContentEn") setAnnContentEn(res.translated_text);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Lỗi khi dịch tự động.");
    } finally {
      setTranslatingField(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldToSet: "plImage" | "plAudio" | "plAudioEn") => {
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

  // Form states for Feedback resolution
  const [fbStatus, setFbStatus] = useState<AdminFeedback["status"]>("new");
  const [fbNotes, setFbNotes] = useState("");

  // Search filter states
  const [searchQuery, setSearchQuery] = useState("");

  const getOptionalUrlValue = (value: string) => {
    const trimmed = value.trim();
    return trimmed && trimmed.toLowerCase() !== "none" ? trimmed : null;
  };

  const getAudioFileLabel = (url?: string | null) => {
    const value = url?.trim();
    if (!value || value.toLowerCase() === "none") return "None";
    return value.split("/").pop() || value;
  };

  // Feedback Category Mapping & Badges with full 8 + 4 legacy categories support
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

  // Load all dashboard datasets on mount
  const loadData = async () => {
    setLoading(true);
    try {
      const [artList, plList, annList, fbList, chList, usageData] = await Promise.all([
        adminApi.getArticles(),
        adminApi.getPlaces(),
        adminApi.getAnnouncements(),
        adminApi.getFeedbacks(),
        adminApi.getChatLogs(),
        adminApi.getUsageSummary()
      ]);
      setArticles(artList);
      setPlaces(plList);
      setAnnouncements(annList);
      setFeedbacks(fbList);
      setChats(chList);
      setUsageSummary(usageData);
    } catch (e) {
      console.error("Failed to load backend administration data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Knowledge Articles Submissions ---
  const handleOpenAddArticle = (defaultCategory?: string) => {
    const cat = defaultCategory || "ve_va_gio_mo_cua";
    setSelectedItem(null);
    setArtTitle("");
    setArtCategory(cat);
    setArtContent("");
    setArtPublished(true);
    // Initialize visual builder with defaults for ticket category
    if (cat === "ve_va_gio_mo_cua") {
      setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
      setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
      setArtContent(JSON.stringify({
        tickets: DEFAULT_VISUAL_TICKETS,
        schedules: DEFAULT_VISUAL_SCHEDULES
      }, null, 2));
    }
    setModalResource("article");
    setModalType("add");
  };

  const handleOpenEditArticle = (art: AdminKnowledgeArticle) => {
    setSelectedItem(art);
    setArtTitle(art.title);
    setArtCategory(art.category);
    setArtContent(art.content);
    setArtPublished(art.is_published);
    // Parse JSON content to visual builder if ticket category
    if (art.category === "ve_va_gio_mo_cua") {
      try {
        const c = art.content?.trim();
        if (c && (c.startsWith("[") || c.startsWith("{"))) {
          const parsed = JSON.parse(c);
          const parsedTickets = Array.isArray(parsed) ? parsed : parsed.tickets;
          const parsedSchedules = Array.isArray(parsed) ? DEFAULT_VISUAL_SCHEDULES : parsed.schedules;
          if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
            setVisualTickets(parsedTickets);
            setVisualSchedules(Array.isArray(parsedSchedules) ? parsedSchedules : JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
          } else {
            setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
            setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
          }
        } else {
          setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
          setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
        }
      } catch {
        setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
        setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
      }
    }
    setModalResource("article");
    setModalType("edit");
  };

  // Sync visual builder -> artContent as JSON string
  const syncTicketsToContent = (tickets: any[], schedules = visualSchedules) => {
    setArtContent(JSON.stringify({ tickets, schedules }, null, 2));
  };

  const updateVisualTickets = (updated: any[]) => {
    setVisualTickets(updated);
    syncTicketsToContent(updated);
  };

  const updateVisualSchedules = (updated: any[]) => {
    setVisualSchedules(updated);
    syncTicketsToContent(visualTickets, updated);
  };

  const handleTranslateTicketField = async (sIdx: number, field: "titleEn" | "nameEn" | "priceEn" | "priceOnewayEn", iIdx?: number) => {
    const key = `${sIdx}-${field}-${iIdx ?? ""}`;
    setTranslatingTicketField(key);
    try {
      let sourceText = "";
      if (field === "titleEn") sourceText = visualTickets[sIdx]?.title || "";
      else if (field === "nameEn") sourceText = visualTickets[sIdx]?.items[iIdx!]?.name || "";
      else if (field === "priceEn") sourceText = visualTickets[sIdx]?.items[iIdx!]?.price || "";
      else if (field === "priceOnewayEn") sourceText = visualTickets[sIdx]?.items[iIdx!]?.priceOneway || "";
      if (!sourceText) return;
      const res = await adminApi.translateText(sourceText, "en");
      const updated = JSON.parse(JSON.stringify(visualTickets));
      if (field === "titleEn") updated[sIdx].titleEn = res.translated_text;
      else if (iIdx !== undefined) updated[sIdx].items[iIdx][field] = res.translated_text;
      updateVisualTickets(updated);
    } catch (e: any) {
      alert(e?.message || "Lỗi khi dịch tự động.");
    } finally {
      setTranslatingTicketField(null);
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    closeModal();

    // Dynamic animation wrapper showing vector ingestion (WOW Factor!)
    setIndexingMsg("Bắt đầu phân tích văn bản thành các chunks...");
    setTimeout(() => {
      setIndexingMsg("Đang tạo vector embedding (1536 chiều) thông qua OpenAI/Gemini...");
    }, 1200);
    setTimeout(() => {
      setIndexingMsg("Đang ghi vào cơ sở dữ liệu Supabase pgvector và cập nhật chỉ mục hnsw...");
    }, 2400);
    setTimeout(async () => {
      try {
        if (selectedItem) {
          // Update
          const updated = await adminApi.updateArticle(selectedItem.id, {
            title: artTitle,
            category: artCategory,
            content: artContent,
            is_published: artPublished
          });
          setArticles(articles.map(a => a.id === updated.id ? updated : a));
        } else {
          // Create
          const created = await adminApi.createArticle({
            title: artTitle,
            category: artCategory,
            content: artContent,
            is_published: artPublished
          });
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
    setPlName("");
    setPlNameEn("");
    setPlCategory("tam_linh");
    setPlShort("");
    setPlShortEn("");
    setPlFull("");
    setPlFullEn("");
    setPlImage("https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800");
    setPlAudio("");
    setPlAudioEn("");
    setPlAudioEnabled(false);
    setPlLat(11.378);
    setPlLng(106.168);
    setModalResource("place");
    setModalType("add");
  };

  const handleOpenEditPlace = (pl: AdminPlace) => {
    setSelectedItem(pl);
    setPlName(pl.name);
    setPlNameEn(pl.name_en || "");
    setPlCategory(pl.category);
    setPlShort(pl.short_description);
    setPlShortEn(pl.short_description_en || "");
    setPlFull(pl.full_description);
    setPlFullEn(pl.full_description_en || "");
    setPlImage(pl.image_url || "");
    setPlAudio(pl.audio_url || "");
    setPlAudioEn(pl.audio_url_en || "");
    setPlAudioEnabled(pl.audio_enabled === true || !!getOptionalUrlValue(pl.audio_url || ""));
    setPlLat(pl.latitude ?? 11.378345);
    setPlLng(pl.longitude ?? 106.168924);
    setModalResource("place");
    setModalType("edit");
  };

  const handleSavePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (plAudioEnabled && !getOptionalUrlValue(plAudio)) {
        alert("Vui lòng nhập URL Audio Thuyết Minh Số (VI) trước khi bật tính năng âm thanh.");
        return;
      }

      const data = {
        name: plName,
        name_en: plNameEn,
        slug: selectedItem?.slug || plName.toLowerCase()
          .replace(/đ/g, "d")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
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
        longitude: Number(plLng)
      };

      if (selectedItem) {
        const res = await adminApi.updatePlace(selectedItem.id, data);
        setPlaces(places.map(p => p.id === res.id ? res : p));
      } else {
        const res = await adminApi.createPlace(data);
        setPlaces([res, ...places]);
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

  // --- Announcements Submissions ---
  const handleOpenAddAnnouncement = () => {
    setSelectedItem(null);
    setAnnTitle("");
    setAnnTitleEn("");
    setAnnContent("");
    setAnnContentEn("");
    setAnnType("general");
    setModalResource("announcement");
    setModalType("add");
  };

  const handleOpenEditAnnouncement = (ann: AdminAnnouncement) => {
    setSelectedItem(ann);
    setAnnTitle(ann.title);
    setAnnTitleEn(ann.title_en || "");
    setAnnContent(ann.content);
    setAnnContentEn(ann.content_en || "");
    setAnnType(ann.type);
    setModalResource("announcement");
    setModalType("edit");
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        title: annTitle,
        title_en: annTitleEn,
        content: annContent,
        content_en: annContentEn,
        type: annType
      };

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
    setFbStatus(fb.status);
    setFbNotes(fb.admin_notes || "");
    setModalResource("feedback");
    setModalType("resolve");
  };

  const handleSaveResolveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApi.resolveFeedback(selectedItem.id, fbStatus, fbNotes);
      setFeedbacks(feedbacks.map(f => f.id === res.id ? res : f));
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  // Computations
  const totalArticles = articles.length;
  const activeAnnouncements = announcements.length;
  const totalFeedbacks = feedbacks.length;
  const newFeedbacks = feedbacks.filter(f => f.status === "new").length;

  const totalChats = chats.length;
  const highConfidenceChats = chats.filter(c => c.confidence_score >= 0.8).length;
  const successRate = totalChats > 0 ? Math.round((highConfidenceChats / totalChats) * 100) : 100;

  const formatUsd = (value: number) => `$${value.toFixed(6)}`;
  const formatNumber = (value: number) => value.toLocaleString("vi-VN");
  const usage = usageSummary ?? {
    request_count: 0,
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    estimated_cost_usd: 0,
    daily: [],
    by_model: []
  };

  // Search filter logical blocks
  const getFilteredItems = () => {
    if (searchQuery.trim() === "") return { articles, places, announcements, feedbacks, chats };
    const query = searchQuery.toLowerCase();

    return {
      articles: articles.filter(a => a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query)),
      places: places.filter(p => p.name.toLowerCase().includes(query) || p.short_description.toLowerCase().includes(query)),
      announcements: announcements.filter(a => a.title.toLowerCase().includes(query) || a.content.toLowerCase().includes(query)),
      feedbacks: feedbacks.filter(f => (f.reporter_name || "").toLowerCase().includes(query) || f.content.toLowerCase().includes(query)),
      chats: chats.filter(c => c.question.toLowerCase().includes(query) || c.answer.toLowerCase().includes(query))
    };
  };

  const filtered = getFilteredItems();

  const getFeedbackBadge = (status: AdminFeedback["status"]) => {
    switch (status) {
      case "new":
        return (
          <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <AlertTriangle size={12} />
            <span>Chờ xử lý</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Clock size={12} />
            <span>Đang xử lý</span>
          </span>
        );
      case "resolved":
        return (
          <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle size={12} />
            <span>Đã giải quyết</span>
          </span>
        );
    }
  };

  const getAnnBadge = (type: AdminAnnouncement["type"]) => {
    switch (type) {
      case "emergency":
        return (
          <span className="badge badge-danger" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <AlertTriangle size={12} />
            <span>Khẩn cấp</span>
          </span>
        );
      case "weather":
        return (
          <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Clock size={12} />
            <span>Thời tiết</span>
          </span>
        );
      case "festival":
        return (
          <span className="badge badge-info" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <BookOpen size={12} />
            <span>Lễ hội</span>
          </span>
        );
      case "general":
        return (
          <span className="badge badge-success" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Bell size={12} />
            <span>Thường nhật</span>
          </span>
        );
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-header" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/logo.png" alt="Logo" style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--accent-gold)", objectFit: "cover" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 className="sidebar-title" style={{ fontSize: "16px", margin: 0 }}>BÀ ĐEN ADMIN</h1>
            <span className="sidebar-subtitle" style={{ fontSize: "9px" }}>HỆ THỐNG TRỢ LÝ DU LỊCH SỐ</span>
          </div>
        </div>

        <nav>
          <ul className="nav-list">
            <li 
              className={`nav-item ${activeTab === "dashboard" ? "nav-item-active" : ""}`}
              onClick={() => { setActiveTab("dashboard"); setSearchQuery(""); }}
            >
              <LayoutDashboard size={18} />
              <span>Bảng Tổng Quan</span>
            </li>
            <li 
              className={`nav-item ${activeTab === "articles" ? "nav-item-active" : ""}`}
              onClick={() => { setActiveTab("articles"); setSearchQuery(""); }}
            >
              <BookOpen size={18} />
              <span>Kho Tri Thức RAG</span>
            </li>
            <li 
              className={`nav-item ${activeTab === "guides" ? "nav-item-active" : ""}`}
              onClick={() => { setActiveTab("guides"); setSearchQuery(""); }}
            >
              <BookOpen size={18} style={{ color: "var(--accent-gold)" }} />
              <span>Hướng Dẫn Tham Quan</span>
            </li>
            <li 
              className={`nav-item ${activeTab === "places" ? "nav-item-active" : ""}`}
              onClick={() => { setActiveTab("places"); setSearchQuery(""); }}
            >
              <MapPin size={18} />
              <span>Điểm Tham Quan</span>
            </li>
            <li 
              className={`nav-item ${activeTab === "announcements" ? "nav-item-active" : ""}`}
              onClick={() => { setActiveTab("announcements"); setSearchQuery(""); }}
            >
              <Bell size={18} />
              <span>Thông Báo BQL</span>
            </li>
            <li 
              className={`nav-item ${activeTab === "feedbacks" ? "nav-item-active" : ""}`}
              onClick={() => { setActiveTab("feedbacks"); setSearchQuery(""); }}
            >
              <AlertTriangle size={18} />
              <span>Phản Ánh Du Khách</span>
              {newFeedbacks > 0 && (
                <span 
                  style={{ 
                    backgroundColor: "var(--danger)", 
                    color: "white", 
                    borderRadius: "10px", 
                    padding: "1px 6px", 
                    fontSize: "10px",
                    marginLeft: "auto",
                    fontWeight: 700 
                  }}
                >
                  {newFeedbacks}
                </span>
              )}
            </li>
            <li 
              className={`nav-item ${activeTab === "chats" ? "nav-item-active" : ""}`}
              onClick={() => { setActiveTab("chats"); setSearchQuery(""); }}
            >
              <MessageSquare size={18} />
              <span>Giám Sát Chatbot AI</span>
            </li>
            <li 
              className={`nav-item ${activeTab === "usage" ? "nav-item-active" : ""}`}
              onClick={() => { setActiveTab("usage"); setSearchQuery(""); }}
            >
              <DollarSign size={18} />
              <span>Chi Phi Beeknoee</span>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header Bar */}
        <header className="topbar">
          <div className="topbar-title">
            {activeTab === "dashboard" && "Bảng Điều Khiển Hệ Thống"}
            {activeTab === "articles" && "Quản Lý Kho Tri Thức RAG (Supabase pgvector)"}
            {activeTab === "guides" && "Thông Tin Hướng Dẫn Tham Quan (Đồng bộ Zalo Mini App)"}
            {activeTab === "places" && "Danh Mục Điểm Tham Quan & Thuyết Minh Số"}
            {activeTab === "announcements" && "Quản Lý Thông Báo & Cảnh Báo Bản Tin"}
            {activeTab === "feedbacks" && "Tổng Hợp Ý Kiến & Phản Ánh Của Du Khách"}
            {activeTab === "chats" && "Nhật Ký Hội Thoại AI & Kiểm Toán Chất Lượng RAG"}
            {activeTab === "usage" && "Tong Chi Phi Goi Model Beeknoee"}
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
            <Database size={20} className="spinner" />
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
              {/* --- PANEL 1: DASHBOARD --- */}
              {activeTab === "dashboard" && (
                <div>
                  {/* Summary row */}
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-label">BÀI VIẾT TRI THỨC</span>
                        <span className="stat-value">{totalArticles}</span>
                      </div>
                      <div className="stat-icon"><BookOpen size={20} /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-label">BẢN TIN HOẠT ĐỘNG</span>
                        <span className="stat-value">{activeAnnouncements}</span>
                      </div>
                      <div className="stat-icon"><Bell size={20} /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-label">PHẢN ÁNH CHỜ DUYỆT</span>
                        <span className="stat-value" style={{ color: newFeedbacks > 0 ? "var(--danger)" : "inherit" }}>
                          {newFeedbacks} / {totalFeedbacks}
                        </span>
                      </div>
                      <div className="stat-icon"><AlertTriangle size={20} /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-label">KIỂM TOÁN CHATBOT</span>
                        <span className="stat-value">{totalChats}</span>
                      </div>
                      <div className="stat-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>
                        <Bot size={20} />
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-label">TỶ LỆ KHỚP CHÍNH XÁC</span>
                        <span className="stat-value" style={{ color: successRate >= 90 ? "var(--success)" : "var(--warning)" }}>
                          {successRate}%
                        </span>
                      </div>
                      <div className="stat-icon"><Bot size={20} /></div>
                    </div>
                  </div>

                  {/* Two columns details */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
                    {/* Left: Recent feedbacks */}
                    <div className="panel-card" style={{ marginBottom: 0 }}>
                      <div className="panel-header">
                        <h3 className="panel-title">
                          <AlertTriangle size={18} />
                          <span>Phản ánh mới nhận</span>
                        </h3>
                        <button className="btn btn-secondary btn-xs" onClick={() => setActiveTab("feedbacks")}>
                          Xem tất cả
                        </button>
                      </div>
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Mã số</th>
                              <th>Người gửi</th>
                              <th>Loại phản ánh</th>
                              <th>Nội dung</th>
                              <th>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {feedbacks.slice(0, 3).map((f) => (
                              <tr key={f.id} style={{ cursor: "pointer" }} onClick={() => handleOpenResolveFeedback(f)}>
                                <td style={{ fontWeight: 700 }}>{f.id}</td>
                                <td>
                                  <div style={{ fontWeight: 600 }}>{f.reporter_name || "Nặc danh"}</div>
                                  <div style={{ fontSize: "11px", color: "var(--text-light)" }}>{f.phone || "-"}</div>
                                </td>
                                <td>
                                  {getFeedbackTypeLabel(f.report_type)}
                                </td>
                                <td>
                                  <div style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
                                    {f.image_url && (
                                      <Camera size={14} style={{ color: "#E5A93C", marginRight: "6px", flexShrink: 0 }} />
                                    )}
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.content}</span>
                                  </div>
                                </td>
                                <td>{getFeedbackBadge(f.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Right: Quick shortcuts and OA statistics */}
                    <div className="panel-card" style={{ marginBottom: 0 }}>
                      <div className="panel-header">
                        <h3 className="panel-title">
                          <Bot size={18} />
                          <span>Trợ lý số & Zalo OA</span>
                        </h3>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-slate)" }}>
                          <h4 style={{ fontWeight: 700, fontSize: "13px", marginBottom: "8px", color: "var(--primary-navy)" }}>
                            Cấu hình Vector Database
                          </h4>
                          <p style={{ fontSize: "12px", color: "var(--text-light)", lineHeight: 1.4, margin: "0 0 10px 0" }}>
                            Dữ liệu tri thức RAG được chia nhỏ tự động và lưu trữ dưới dạng embeddings vector 1536 chiều để thực hiện tra cứu cosine.
                          </p>
                          <button className="btn btn-primary btn-xs" style={{ width: "100%" }} onClick={() => setActiveTab("articles")}>
                            <Database size={12} />
                            <span>Truy cập Kho bài viết RAG</span>
                          </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                            <span style={{ color: "var(--text-light)" }}>Số câu hỏi khớp tốt:</span>
                            <span style={{ fontWeight: 700, color: "var(--success)" }}>{highConfidenceChats}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                            <span style={{ color: "var(--text-light)" }}>Số câu hỏi chuyển tiếp BQL:</span>
                            <span style={{ fontWeight: 700, color: "var(--danger)" }}>{chats.filter(c => c.confidence_score < 0.2).length}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                            <span style={{ color: "var(--text-light)" }}>Nguồn câu hỏi Mini App:</span>
                            <span style={{ fontWeight: 700 }}>{chats.filter(c => c.channel === "mini_app").length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- PANEL 2: KNOWLEDGE BASE ARTICLES --- */}
              {activeTab === "articles" && (
                <div className="panel-card">
                  <div className="panel-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input
                        type="text"
                        placeholder="Tìm bài viết..."
                        className="form-input"
                        style={{ width: "240px", padding: "6px 12px" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn btn-secondary" onClick={handleReindexKnowledge} disabled={isReindexing}>
                        <Database size={16} />
                        <span>{isReindexing ? "Đang index..." : "Re-index RAG"}</span>
                      </button>
                      <button className="btn btn-primary" onClick={() => handleOpenAddArticle()}>
                        <Plus size={16} />
                        <span>Thêm bài viết mới</span>
                      </button>
                    </div>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: "25%" }}>Tiêu đề tri thức</th>
                          <th style={{ width: "15%" }}>Phân mục</th>
                          <th style={{ width: "40%" }}>Nội dung văn bản</th>
                          <th style={{ width: "10%" }}>Đăng tải</th>
                          <th style={{ width: "10%" }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.articles.map((art) => (
                          <tr key={art.id}>
                            <td style={{ fontWeight: 700, color: "var(--primary-navy)" }}>{art.title}</td>
                            <td>
                              <span className="badge badge-info" style={{ textTransform: "capitalize" }}>
                                {art.category.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td>
                              <div style={{ 
                                maxWidth: "400px", 
                                overflow: "hidden", 
                                textOverflow: "ellipsis", 
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                fontSize: "12.5px",
                                color: "var(--text-light)"
                              }}>
                                {art.content}
                              </div>
                            </td>
                            <td>
                              {art.is_published ? (
                                <span className="badge badge-success">Hoạt động</span>
                              ) : (
                                <span className="badge badge-warning">Bản nháp</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button className="btn btn-secondary btn-xs" onClick={() => handleOpenEditArticle(art)}>
                                  <Edit size={12} />
                                </button>
                                <button className="btn btn-danger btn-xs" onClick={() => handleDeleteArticle(art.id)}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- PANEL 2.5: TOURIST VISIT GUIDES --- */}
              {activeTab === "guides" && (
                <div className="panel-card">
                  <div style={{ background: "rgba(11,37,69,0.05)", border: "1px solid rgba(11,37,69,0.12)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", fontSize: "12.5px", color: "var(--primary-navy)" }}>
                    <strong>🎫 Hướng Dẫn Tham Quan</strong> — Quản lý thông tin hiển thị trực tiếp trên <strong>Zalo Mini App</strong> (bảng giá vé, lịch hoạt động, di chuyển, nội quy). Đây là nội dung <em>riêng biệt hoàn toàn</em> với Kho Tri Thức RAG.
                  </div>
                  <div className="panel-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input
                        type="text"
                        placeholder="Tìm hướng dẫn..."
                        className="form-input"
                        style={{ width: "240px", padding: "6px 12px" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleOpenAddArticle("ve_va_gio_mo_cua")}
                    >
                      <Plus size={16} />
                      <span>Thêm hướng dẫn mới</span>
                    </button>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: "25%" }}>Tiêu đề hướng dẫn</th>
                          <th style={{ width: "20%" }}>Phân mục hướng dẫn</th>
                          <th style={{ width: "35%" }}>Nội dung chi tiết</th>
                          <th style={{ width: "10%" }}>Đăng tải</th>
                          <th style={{ width: "10%" }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.articles
                          .filter(art => ["ve_va_gio_mo_cua", "di_chuyen", "noi_quy"].includes(art.category))
                          .map((art) => (
                            <tr key={art.id}>
                              <td style={{ fontWeight: 700, color: "var(--primary-navy)" }}>{art.title}</td>
                              <td>
                                {art.category === "ve_va_gio_mo_cua" && <span className="badge badge-success">Vé & Lịch hoạt động</span>}
                                {art.category === "di_chuyen" && <span className="badge badge-info">Di chuyển & Bãi xe</span>}
                                {art.category === "noi_quy" && <span className="badge badge-warning">Nội quy & Ứng xử</span>}
                              </td>
                              <td>
                                <div style={{ 
                                  maxWidth: "400px", 
                                  overflow: "hidden", 
                                  textOverflow: "ellipsis", 
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  fontSize: "12.5px",
                                  color: "var(--text-light)"
                                }}>
                                  {art.content}
                                </div>
                              </td>
                              <td>
                                {art.is_published ? (
                                  <span className="badge badge-success">Hoạt động</span>
                                ) : (
                                  <span className="badge badge-warning">Bản nháp</span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button className="btn btn-secondary btn-xs" onClick={() => handleOpenEditArticle(art)}>
                                    <Edit size={12} />
                                  </button>
                                  <button className="btn btn-danger btn-xs" onClick={() => handleDeleteArticle(art.id)}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- PANEL 3: TOURIST PLACES DIRECTORY --- */}
              {activeTab === "places" && (
                <div className="panel-card">
                  <div className="panel-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input
                        type="text"
                        placeholder="Tìm điểm tham quan..."
                        className="form-input"
                        style={{ width: "240px", padding: "6px 12px" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button className="btn btn-primary" onClick={handleOpenAddPlace}>
                      <Plus size={16} />
                      <span>Thêm địa danh mới</span>
                    </button>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Hình ảnh</th>
                          <th>Tên địa danh</th>
                          <th>Phân loại</th>
                          <th>Vị trí GPS (Vĩ độ/Kinh độ)</th>
                          <th>Audio Thuyết Minh</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.places.map((pl) => (
                          <tr key={pl.id}>
                            <td>
                              <img 
                                src={pl.image_url} 
                                alt={pl.name} 
                                style={{ width: "50px", height: "40px", borderRadius: "4px", objectFit: "cover" }} 
                              />
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: "var(--primary-navy)" }}>{pl.name}</div>
                              <div style={{ fontSize: "11px", color: "var(--text-light)" }}>Slug: {pl.slug}</div>
                            </td>
                            <td>
                              <span className="badge badge-info" style={{ textTransform: "capitalize" }}>
                                {pl.category === "tam_linh" && "Tâm Linh / Tôn Giáo"}
                                {pl.category === "phong_canh" && "Phong Cảnh / Check-in"}
                                {pl.category === "dich_vu" && "Cáp Treo / Dịch Vụ"}
                              </span>
                            </td>
                            <td>
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${pl.latitude},${pl.longitude}`} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{ color: "var(--secondary-blue)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                              >
                                <span>{pl.latitude.toFixed(6)}, {pl.longitude.toFixed(6)}</span>
                                <ExternalLink size={12} />
                              </a>
                            </td>
                            <td>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "11px", color: "var(--text-light)" }}>
                                <Headphones size={12} style={{ flexShrink: 0 }} />
                                <span>{getAudioFileLabel(pl.audio_url)}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button className="btn btn-secondary btn-xs" onClick={() => handleOpenEditPlace(pl)}>
                                  <Edit size={12} />
                                </button>
                                <button className="btn btn-danger btn-xs" onClick={() => handleDeletePlace(pl.id)}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- PANEL 4: ANNOUNCEMENTS --- */}
              {activeTab === "announcements" && (
                <div className="panel-card">
                  <div className="panel-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input
                        type="text"
                        placeholder="Tìm bản tin..."
                        className="form-input"
                        style={{ width: "240px", padding: "6px 12px" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button className="btn btn-primary" onClick={handleOpenAddAnnouncement}>
                      <Plus size={16} />
                      <span>Tạo bản tin mới</span>
                    </button>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: "15%" }}>Mức độ</th>
                          <th style={{ width: "30%" }}>Tiêu đề bản tin</th>
                          <th style={{ width: "40%" }}>Chi tiết nội dung</th>
                          <th style={{ width: "15%" }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.announcements.map((ann) => (
                          <tr key={ann.id}>
                            <td>{getAnnBadge(ann.type)}</td>
                            <td style={{ fontWeight: 700, color: "var(--primary-navy)" }}>{ann.title}</td>
                            <td style={{ fontSize: "12.5px", color: "var(--text-light)" }}>{ann.content}</td>
                            <td>
                              <div style={{ display: "flex", gap: "8px" }}>
                                <button className="btn btn-secondary btn-xs" onClick={() => handleOpenEditAnnouncement(ann)}>
                                  <Edit size={12} />
                                </button>
                                <button className="btn btn-danger btn-xs" onClick={() => handleDeleteAnnouncement(ann.id)}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- PANEL 5: FEEDBACK MANAGER --- */}
              {activeTab === "feedbacks" && (
                <div className="panel-card">
                  <div className="panel-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Search size={16} style={{ color: "var(--text-light)" }} />
                      <input
                        type="text"
                        placeholder="Lọc phản ánh theo tên hoặc nội dung..."
                        className="form-input"
                        style={{ width: "300px", padding: "6px 12px" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Mã số</th>
                          <th>Du khách liên hệ</th>
                          <th>Phân mục</th>
                          <th>Ý kiến phản ánh</th>
                          <th>Toạ độ GPS</th>
                          <th>Trạng thái giải quyết</th>
                          <th>Giải pháp hành chính</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.feedbacks.map((fb) => (
                          <tr 
                            key={fb.id} 
                            style={{ cursor: "pointer" }} 
                            onClick={() => handleOpenResolveFeedback(fb)}
                          >
                            <td style={{ fontWeight: 700 }}>{fb.id}</td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{fb.reporter_name || "Nặc danh"}</div>
                              <div style={{ fontSize: "11px", color: "var(--text-light)", display: "flex", alignItems: "center", gap: "4px" }}>
                                📞 {fb.phone || "Không có điện thoại"}
                              </div>
                            </td>
                             <td>
                              {getFeedbackTypeBadge(fb.report_type)}
                            </td>
                            <td>
                              <div style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12.5px", display: "flex", alignItems: "center" }}>
                                {fb.image_url && (
                                  <Camera size={14} style={{ color: "#E5A93C", marginRight: "6px", flexShrink: 0 }} />
                                )}
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fb.content}</span>
                              </div>
                            </td>
                            <td>
                              {fb.latitude && fb.longitude ? (
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${fb.latitude},${fb.longitude}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ color: "var(--secondary-blue)", fontSize: "11.5px", textDecoration: "none", fontWeight: 600 }}
                                >
                                  📍 {fb.latitude.toFixed(4)}, {fb.longitude.toFixed(4)}
                                </a>
                              ) : (
                                <span style={{ fontSize: "11px", color: "var(--text-light)" }}>Không gửi toạ độ</span>
                              )}
                            </td>
                            <td>{getFeedbackBadge(fb.status)}</td>
                            <td>
                              <div style={{ 
                                maxWidth: "200px", 
                                overflow: "hidden", 
                                textOverflow: "ellipsis", 
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                fontSize: "11px",
                                color: "var(--success)",
                                fontWeight: 500
                              }}>
                                {fb.admin_notes || <span style={{ color: "var(--text-light)", fontStyle: "italic" }}>Chưa có phương án giải quyết</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- PANEL 6: CHAT AUDITOR --- */}
              {activeTab === "chats" && (
                <div className="panel-card">
                  <div className="panel-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input
                        type="text"
                        placeholder="Tìm hội thoại..."
                        className="form-input"
                        style={{ width: "240px", padding: "6px 12px" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Đường truyền</th>
                          <th>Câu hỏi của du khách</th>
                          <th>Phản hồi của AI</th>
                          <th>Độ tương đồng</th>
                          <th>Chunk văn bản trùng khớp</th>
                          <th>Thời gian hỏi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.chats.map((c) => {
                          let scoreClass = "rag-score-high";
                          if (c.confidence_score < 0.4) scoreClass = "rag-score-low";
                          else if (c.confidence_score < 0.8) scoreClass = "rag-score-medium";

                          return (
                            <tr key={c.id}>
                              <td>
                                {c.channel === "mini_app" ? (
                                  <span className="badge badge-info">Zalo Mini App</span>
                                ) : (
                                  <span className="badge badge-success">Zalo OA Chatbot</span>
                                )}
                              </td>
                              <td style={{ fontWeight: 600 }}>{c.question}</td>
                              <td style={{ fontSize: "12.5px" }}>{c.answer}</td>
                              <td className={scoreClass} style={{ fontSize: "14px", textAlign: "center" }}>
                                {Math.round(c.confidence_score * 100)}%
                              </td>
                              <td>
                                <div className="rag-meta-box">
                                  <span>{c.matched_chunks}</span>
                                </div>
                              </td>
                              <td style={{ fontSize: "11px", color: "var(--text-light)" }}>
                                {new Date(c.created_at).toLocaleTimeString("vi-VN")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* --- PANEL 7: BEEKNOEE USAGE COST --- */}
              {activeTab === "usage" && (
                <div>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-label">TONG CHI PHI UOC TINH</span>
                        <span className="stat-value">{formatUsd(usage.estimated_cost_usd)}</span>
                      </div>
                      <div className="stat-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>
                        <DollarSign size={20} />
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-label">LUOT GOI MODEL</span>
                        <span className="stat-value">{formatNumber(usage.request_count)}</span>
                      </div>
                      <div className="stat-icon"><Bot size={20} /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-label">INPUT TOKENS</span>
                        <span className="stat-value">{formatNumber(usage.prompt_tokens)}</span>
                      </div>
                      <div className="stat-icon"><Database size={20} /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-label">OUTPUT TOKENS</span>
                        <span className="stat-value">{formatNumber(usage.completion_tokens)}</span>
                      </div>
                      <div className="stat-icon"><MessageSquare size={20} /></div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-info">
                        <span className="stat-label">TONG TOKENS</span>
                        <span className="stat-value">{formatNumber(usage.total_tokens)}</span>
                      </div>
                      <div className="stat-icon"><BookOpen size={20} /></div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px" }}>
                    <div className="panel-card" style={{ marginBottom: 0 }}>
                      <div className="panel-header">
                        <h3 className="panel-title">
                          <Bot size={18} />
                          <span>Chi phi theo model</span>
                        </h3>
                      </div>
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Model</th>
                              <th>Luot goi</th>
                              <th>Tokens</th>
                              <th>Chi phi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usage.by_model.map((row) => (
                              <tr key={row.model || "untracked"}>
                                <td style={{ fontWeight: 700 }}>{row.model || "untracked"}</td>
                                <td>{formatNumber(row.request_count)}</td>
                                <td>{formatNumber(row.total_tokens)}</td>
                                <td style={{ fontWeight: 700, color: "var(--success)" }}>{formatUsd(row.estimated_cost_usd)}</td>
                              </tr>
                            ))}
                            {usage.by_model.length === 0 && (
                              <tr>
                                <td colSpan={4} style={{ textAlign: "center", color: "var(--text-light)", padding: "24px" }}>
                                  Chua co du lieu su dung model.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="panel-card" style={{ marginBottom: 0 }}>
                      <div className="panel-header">
                        <h3 className="panel-title">
                          <Clock size={18} />
                          <span>Chi phi theo ngay</span>
                        </h3>
                      </div>
                      <div className="admin-table-container">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Ngay</th>
                              <th>Luot goi</th>
                              <th>Input</th>
                              <th>Output</th>
                              <th>Tong tokens</th>
                              <th>Chi phi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usage.daily.map((row) => (
                              <tr key={row.date || "unknown"}>
                                <td style={{ fontWeight: 700 }}>{row.date || "unknown"}</td>
                                <td>{formatNumber(row.request_count)}</td>
                                <td>{formatNumber(row.prompt_tokens)}</td>
                                <td>{formatNumber(row.completion_tokens)}</td>
                                <td>{formatNumber(row.total_tokens)}</td>
                                <td style={{ fontWeight: 700, color: "var(--success)" }}>{formatUsd(row.estimated_cost_usd)}</td>
                              </tr>
                            ))}
                            {usage.daily.length === 0 && (
                              <tr>
                                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-light)", padding: "24px" }}>
                                  Chua co du lieu su dung hang ngay.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* --- FORM MODALS --- */}
      {modalType && modalResource && (
        <div className="modal-overlay">
          {/* Modal content for Articles */}
          {modalResource === "article" && (
            <div className="modal-content" style={{ maxWidth: artCategory === "ve_va_gio_mo_cua" ? "860px" : "560px", width: "95vw" }}>
              <header className="modal-header">
                <h3>
                  {artCategory === "ve_va_gio_mo_cua"
                    ? (modalType === "add" ? "🎫 Thêm bảng giá vé mới" : "🎫 Chỉnh sửa bảng giá vé")
                    : (modalType === "add" ? "📝 Thêm bài viết tri thức RAG" : "📝 Chỉnh sửa bài viết tri thức RAG")}
                </h3>
                <button className="btn btn-secondary btn-xs" onClick={closeModal}>✕</button>
              </header>
              <form onSubmit={handleSaveArticle}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Tiêu đề bài viết</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={artTitle} 
                      onChange={e => setArtTitle(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phân mục tri thức</label>
                    <select 
                      className="form-select" 
                      value={artCategory} 
                      onChange={e => {
                        const cat = e.target.value;
                        setArtCategory(cat);
                        if (cat === "ve_va_gio_mo_cua") {
                          setVisualTickets(JSON.parse(JSON.stringify(DEFAULT_VISUAL_TICKETS)));
                          setVisualSchedules(JSON.parse(JSON.stringify(DEFAULT_VISUAL_SCHEDULES)));
                          syncTicketsToContent(DEFAULT_VISUAL_TICKETS, DEFAULT_VISUAL_SCHEDULES);
                        }
                      }}
                    >
                      <option value="ve_va_gio_mo_cua">🎫 Giá vé & Lịch hoạt động (Visual Builder)</option>
                      <option value="di_chuyen">📍 Di chuyển & Đỗ xe (RAG Context)</option>
                      <option value="noi_quy">🛡️ Nội quy chiêm bái & Trang phục (RAG Context)</option>
                      <option value="lich_su">📖 Sự tích & Lịch sử (RAG Context)</option>
                    </select>
                  </div>

                  {/* ===== VISUAL TICKET BUILDER (only for ve_va_gio_mo_cua) ===== */}
                  {artCategory === "ve_va_gio_mo_cua" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ background: "rgba(11,37,69,0.06)", borderRadius: "8px", padding: "12px 16px", border: "1px solid rgba(11,37,69,0.12)", fontSize: "12.5px", color: "var(--primary-navy)", fontWeight: 600 }}>
                        ✏️ <strong>Trình soạn thảo bảng giá trực quan</strong> — Thay đổi sẽ tự động đồng bộ sang Zalo Mini App ngay lập tức sau khi lưu.
                      </div>

                      {visualTickets.map((section, sIdx) => (
                        <div key={sIdx} style={{ border: "1.5px solid var(--border-slate)", borderRadius: "10px", overflow: "hidden" }}>
                          {/* Section header */}
                          <div style={{ background: "var(--primary-navy)", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--accent-gold)", fontWeight: 700, fontSize: "13px" }}>Tuyến / Loại vé #{sIdx + 1}</span>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {sIdx > 0 && (
                                <button type="button" style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "12px" }}
                                  onClick={() => {
                                    const u = JSON.parse(JSON.stringify(visualTickets));
                                    [u[sIdx - 1], u[sIdx]] = [u[sIdx], u[sIdx - 1]];
                                    updateVisualTickets(u);
                                  }}>↑</button>
                              )}
                              {sIdx < visualTickets.length - 1 && (
                                <button type="button" style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "12px" }}
                                  onClick={() => {
                                    const u = JSON.parse(JSON.stringify(visualTickets));
                                    [u[sIdx], u[sIdx + 1]] = [u[sIdx + 1], u[sIdx]];
                                    updateVisualTickets(u);
                                  }}>↓</button>
                              )}
                              <button type="button" style={{ background: "rgba(220,38,38,0.7)", border: "none", color: "white", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "12px" }}
                                onClick={() => {
                                  if (visualTickets.length <= 1) return;
                                  const u = visualTickets.filter((_, i) => i !== sIdx);
                                  updateVisualTickets(u);
                                }}>Xóa tuyến</button>
                            </div>
                          </div>

                          <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            {/* Section title VI */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến (Tiếng Việt)</label>
                                <input type="text" className="form-input" value={section.title || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].title = e.target.value; updateVisualTickets(u); }} />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến (English)</label>
                                  <button type="button" className="btn btn-secondary btn-xs" style={{ padding: "1px 6px", fontSize: "10px" }}
                                    disabled={translatingTicketField === `${sIdx}-titleEn-`}
                                    onClick={() => handleTranslateTicketField(sIdx, "titleEn")}>
                                    {translatingTicketField === `${sIdx}-titleEn-` ? "..." : "AI Dịch"}
                                  </button>
                                </div>
                                <input type="text" className="form-input" value={section.titleEn || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].titleEn = e.target.value; updateVisualTickets(u); }} />
                              </div>
                            </div>

                            {/* Items table */}
                            <div style={{ background: "#f8fafc", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-slate)" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                <thead>
                                  <tr style={{ background: "rgba(11,37,69,0.05)", borderBottom: "1px solid var(--border-slate)" }}>
                                    <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Đối tượng (VI)</th>
                                    <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Đối tượng (EN)</th>
                                    <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Giá KH (VI)</th>
                                    <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Price (EN)</th>
                                    <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Giá MC</th>
                                    <th style={{ padding: "6px 4px", width: "36px" }}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {section.items.map((item: any, iIdx: number) => (
                                    <tr key={iIdx} style={{ borderTop: iIdx > 0 ? "1px solid var(--border-slate)" : "none" }}>
                                      <td style={{ padding: "6px 8px" }}>
                                        <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }}
                                          value={item.name || ""}
                                          onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].name = e.target.value; updateVisualTickets(u); }} />
                                      </td>
                                      <td style={{ padding: "6px 8px" }}>
                                        <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                                          <input type="text" style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }}
                                            value={item.nameEn || ""}
                                            onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].nameEn = e.target.value; updateVisualTickets(u); }} />
                                          <button type="button" style={{ background: "var(--primary-navy)", color: "white", border: "none", borderRadius: "3px", padding: "2px 5px", cursor: "pointer", fontSize: "9.5px", whiteSpace: "nowrap" }}
                                            disabled={translatingTicketField === `${sIdx}-nameEn-${iIdx}`}
                                            onClick={() => handleTranslateTicketField(sIdx, "nameEn", iIdx)}>
                                            {translatingTicketField === `${sIdx}-nameEn-${iIdx}` ? "..." : "Dịch"}
                                          </button>
                                        </div>
                                      </td>
                                      <td style={{ padding: "6px 8px" }}>
                                        <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }}
                                          value={item.price || ""}
                                          onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].price = e.target.value; updateVisualTickets(u); }} />
                                      </td>
                                      <td style={{ padding: "6px 8px" }}>
                                        <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                                          <input type="text" style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }}
                                            value={item.priceEn || ""}
                                            onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].priceEn = e.target.value; updateVisualTickets(u); }} />
                                          <button type="button" style={{ background: "var(--primary-navy)", color: "white", border: "none", borderRadius: "3px", padding: "2px 5px", cursor: "pointer", fontSize: "9.5px", whiteSpace: "nowrap" }}
                                            disabled={translatingTicketField === `${sIdx}-priceEn-${iIdx}`}
                                            onClick={() => handleTranslateTicketField(sIdx, "priceEn", iIdx)}>
                                            {translatingTicketField === `${sIdx}-priceEn-${iIdx}` ? "..." : "Dịch"}
                                          </button>
                                        </div>
                                      </td>
                                      <td style={{ padding: "6px 8px" }}>
                                        <input type="text" placeholder="(tùy chọn)" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }}
                                          value={item.priceOneway || ""}
                                          onChange={e => { const u = JSON.parse(JSON.stringify(visualTickets)); u[sIdx].items[iIdx].priceOneway = e.target.value; updateVisualTickets(u); }} />
                                      </td>
                                      <td style={{ padding: "4px" }}>
                                        <button type="button" style={{ background: "rgba(220,38,38,0.7)", border: "none", color: "white", borderRadius: "3px", padding: "2px 6px", cursor: "pointer", fontSize: "11px" }}
                                          onClick={() => {
                                            const u = JSON.parse(JSON.stringify(visualTickets));
                                            u[sIdx].items = u[sIdx].items.filter((_: any, i: number) => i !== iIdx);
                                            updateVisualTickets(u);
                                          }}>✕</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <button type="button" className="btn btn-secondary btn-xs" style={{ alignSelf: "flex-start" }}
                              onClick={() => {
                                const u = JSON.parse(JSON.stringify(visualTickets));
                                u[sIdx].items.push({ name: "", nameEn: "", price: "", priceEn: "", priceOneway: "" });
                                updateVisualTickets(u);
                              }}>
                              + Thêm loại vé vào tuyến này
                            </button>
                          </div>
                        </div>
                      ))}

                      <button type="button" className="btn btn-secondary" style={{ alignSelf: "flex-start" }}
                        onClick={() => {
                          const u = JSON.parse(JSON.stringify(visualTickets));
                          u.push({ title: "", titleEn: "", items: [{ name: "", nameEn: "", price: "", priceEn: "", priceOneway: "" }] });
                          updateVisualTickets(u);
                        }}>
                        + Thêm tuyến / loại vé mới
                      </button>

                      <div style={{ background: "rgba(11,37,69,0.06)", borderRadius: "8px", padding: "12px 16px", border: "1px solid rgba(11,37,69,0.12)", fontSize: "12.5px", color: "var(--primary-navy)", fontWeight: 600 }}>
                        <strong>Lịch hoạt động hiển thị trên Mini App</strong> - cập nhật tại đây, không cần sửa code frontend.
                      </div>

                      {visualSchedules.map((section, sIdx) => (
                        <div key={sIdx} style={{ border: "1.5px solid var(--border-slate)", borderRadius: "10px", overflow: "hidden" }}>
                          <div style={{ background: "var(--primary-navy)", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--accent-gold)", fontWeight: 700, fontSize: "13px" }}>Lịch hoạt động #{sIdx + 1}</span>
                            <button type="button" style={{ background: "rgba(220,38,38,0.7)", border: "none", color: "white", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "12px" }}
                              onClick={() => {
                                if (visualSchedules.length <= 1) return;
                                updateVisualSchedules(visualSchedules.filter((_, i) => i !== sIdx));
                              }}>Xóa mục</button>
                          </div>
                          <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến/khu vực (VI)</label>
                                <input type="text" className="form-input" value={section.title || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].title = e.target.value; updateVisualSchedules(u); }} />
                              </div>
                              <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" style={{ fontSize: "11.5px" }}>Tên tuyến/khu vực (EN)</label>
                                <input type="text" className="form-input" value={section.titleEn || ""}
                                  onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].titleEn = e.target.value; updateVisualSchedules(u); }} />
                              </div>
                            </div>
                            <div style={{ background: "#f8fafc", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-slate)" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                <thead>
                                  <tr style={{ background: "rgba(11,37,69,0.05)", borderBottom: "1px solid var(--border-slate)" }}>
                                    <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Ngày/khung (VI)</th>
                                    <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Ngày/khung (EN)</th>
                                    <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Giờ</th>
                                    <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Ghi chú (VI)</th>
                                    <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700 }}>Note (EN)</th>
                                    <th style={{ padding: "6px 4px", width: "36px" }}></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(section.items || []).map((item: any, iIdx: number) => (
                                    <tr key={iIdx} style={{ borderTop: iIdx > 0 ? "1px solid var(--border-slate)" : "none" }}>
                                      <td style={{ padding: "6px 8px" }}>
                                        <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }} value={item.label || ""}
                                          onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].label = e.target.value; updateVisualSchedules(u); }} />
                                      </td>
                                      <td style={{ padding: "6px 8px" }}>
                                        <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }} value={item.labelEn || ""}
                                          onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].labelEn = e.target.value; updateVisualSchedules(u); }} />
                                      </td>
                                      <td style={{ padding: "6px 8px" }}>
                                        <input type="text" placeholder="07:00 - 18:00" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }} value={item.hours || ""}
                                          onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].hours = e.target.value; u[sIdx].items[iIdx].hoursEn = e.target.value; updateVisualSchedules(u); }} />
                                      </td>
                                      <td style={{ padding: "6px 8px" }}>
                                        <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }} value={item.note || ""}
                                          onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].note = e.target.value; updateVisualSchedules(u); }} />
                                      </td>
                                      <td style={{ padding: "6px 8px" }}>
                                        <input type="text" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", padding: "3px 6px", fontSize: "11.5px" }} value={item.noteEn || ""}
                                          onChange={e => { const u = JSON.parse(JSON.stringify(visualSchedules)); u[sIdx].items[iIdx].noteEn = e.target.value; updateVisualSchedules(u); }} />
                                      </td>
                                      <td style={{ padding: "4px" }}>
                                        <button type="button" style={{ background: "rgba(220,38,38,0.7)", border: "none", color: "white", borderRadius: "3px", padding: "2px 6px", cursor: "pointer", fontSize: "11px" }}
                                          onClick={() => {
                                            const u = JSON.parse(JSON.stringify(visualSchedules));
                                            u[sIdx].items = u[sIdx].items.filter((_: any, i: number) => i !== iIdx);
                                            updateVisualSchedules(u);
                                          }}>X</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <button type="button" className="btn btn-secondary btn-xs" style={{ alignSelf: "flex-start" }}
                              onClick={() => {
                                const u = JSON.parse(JSON.stringify(visualSchedules));
                                u[sIdx].items.push({ label: "", labelEn: "", hours: "", hoursEn: "", note: "", noteEn: "" });
                                updateVisualSchedules(u);
                              }}>
                              + Thêm khung giờ
                            </button>
                          </div>
                        </div>
                      ))}

                      <button type="button" className="btn btn-secondary" style={{ alignSelf: "flex-start" }}
                        onClick={() => {
                          const u = JSON.parse(JSON.stringify(visualSchedules));
                          u.push({ title: "", titleEn: "", items: [{ label: "", labelEn: "", hours: "", hoursEn: "", note: "", noteEn: "" }] });
                          updateVisualSchedules(u);
                        }}>
                        + Thêm tuyến/khu vực lịch hoạt động
                      </button>
                      {/* Collapsible raw JSON for advanced use */}
                      <details style={{ marginTop: "4px" }}>
                        <summary style={{ cursor: "pointer", fontSize: "12px", color: "var(--text-light)", fontWeight: 600 }}>⚙️ Xem/Sửa JSON nâng cao (tự động đồng bộ)</summary>
                        <textarea
                          className="form-textarea"
                          rows={8}
                          style={{ marginTop: "8px", fontSize: "11.5px", fontFamily: "monospace" }}
                          value={artContent}
                          onChange={e => {
                            setArtContent(e.target.value);
                            try {
                              const parsed = JSON.parse(e.target.value);
                              if (Array.isArray(parsed)) {
                                setVisualTickets(parsed);
                              } else {
                                if (Array.isArray(parsed.tickets)) setVisualTickets(parsed.tickets);
                                if (Array.isArray(parsed.schedules)) setVisualSchedules(parsed.schedules);
                              }
                            } catch { /* ignore */ }
                          }}
                        />
                      </details>
                    </div>
                  ) : (
                    /* ===== PLAIN TEXT TEXTAREA for RAG articles ===== */
                    <div className="form-group">
                      <label className="form-label">Nội dung chi tiết văn bản (RAG Context — AI sẽ đọc và tra cứu)</label>
                      <textarea 
                        className="form-textarea" 
                        required 
                        rows={8}
                        value={artContent} 
                        onChange={e => setArtContent(e.target.value)}
                        placeholder="Nhập nội dung văn bản, markdown được hỗ trợ. AI sẽ sử dụng đoạn này để trả lời câu hỏi của du khách..."
                      />
                    </div>
                  )}

                  <div className="form-group" style={{ flexDirection: "row", gap: "8px", alignItems: "center" }}>
                    <input 
                      type="checkbox" 
                      id="art_pub" 
                      checked={artPublished} 
                      onChange={e => setArtPublished(e.target.checked)} 
                    />
                    <label htmlFor="art_pub" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
                      Đăng tải lên hệ thống tra cứu công khai
                    </label>
                  </div>
                </div>
                <footer className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                  <button type="submit" className="btn btn-primary">
                    {modalType === "add" ? "Tạo & Lập chỉ mục Vector" : "Lưu thay đổi"}
                  </button>
                </footer>
              </form>
            </div>
          )}

          {/* Modal content for Places */}
          {modalResource === "place" && (
            <div className="modal-content">
              <header className="modal-header">
                <h3>{modalType === "add" ? "Thêm địa danh mới" : "Chỉnh sửa địa danh"}</h3>
                <button className="btn btn-secondary btn-xs" onClick={closeModal}>✕</button>
              </header>
              <form onSubmit={handleSavePlace}>
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
                </div>
                <footer className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Lưu thông tin địa danh</button>
                </footer>
              </form>
            </div>
          )}

          {/* Modal content for Announcements */}
          {modalResource === "announcement" && (
            <div className="modal-content">
              <header className="modal-header">
                <h3>{modalType === "add" ? "Tạo bản tin mới" : "Chỉnh sửa bản tin"}</h3>
                <button className="btn btn-secondary btn-xs" onClick={closeModal}>✕</button>
              </header>
              <form onSubmit={handleSaveAnnouncement}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Tiêu đề thông báo (VI)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={annTitle} 
                      onChange={e => setAnnTitle(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label className="form-label">Tiêu đề thông báo (EN)</label>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-xs" 
                        style={{ padding: "2px 8px", marginBottom: "4px" }}
                        disabled={translatingField === "annTitleEn"}
                        onClick={() => handleTranslate(annTitle, "annTitleEn")}
                      >
                        {translatingField === "annTitleEn" ? "Đang dịch..." : "Dịch tự động AI"}
                      </button>
                    </div>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={annTitleEn} 
                      onChange={e => setAnnTitleEn(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cấp độ thông báo</label>
                    <select 
                      className="form-select" 
                      value={annType} 
                      onChange={e => setAnnType(e.target.value as any)}
                    >
                      <option value="general">Thường nhật / Lịch hoạt động</option>
                      <option value="emergency">Khẩn cấp / Sự cố kĩ thuật</option>
                      <option value="weather">Thời tiết / Thiên tai an toàn</option>
                      <option value="festival">Lễ hội / Sự kiện văn hóa</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nội dung chi tiết thông báo (VI)</label>
                    <textarea 
                      className="form-textarea" 
                      required 
                      rows={5}
                      value={annContent} 
                      onChange={e => setAnnContent(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label className="form-label">Nội dung chi tiết thông báo (EN)</label>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-xs" 
                        style={{ padding: "2px 8px", marginBottom: "4px" }}
                        disabled={translatingField === "annContentEn"}
                        onClick={() => handleTranslate(annContent, "annContentEn")}
                      >
                        {translatingField === "annContentEn" ? "Đang dịch..." : "Dịch tự động AI"}
                      </button>
                    </div>
                    <textarea 
                      className="form-textarea" 
                      rows={5}
                      value={annContentEn} 
                      onChange={e => setAnnContentEn(e.target.value)}
                    />
                  </div>
                </div>
                <footer className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Lưu bản tin</button>
                </footer>
              </form>
            </div>
          )}

          {/* Modal content for Feedbacks Resolver */}
          {modalResource === "feedback" && selectedItem && (
            <div className="modal-content">
              <header className="modal-header">
                <h3>Giải quyết phản ánh du khách - Mã {selectedItem.id}</h3>
                <button className="btn btn-secondary btn-xs" onClick={closeModal}>✕</button>
              </header>
              <form onSubmit={handleSaveResolveFeedback}>
                <div className="modal-body">
                  <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-slate)", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <span style={{ fontWeight: 700, color: "var(--primary-navy)" }}>Du khách:</span> {selectedItem.reporter_name || "Nặc danh"} 
                      {selectedItem.phone && ` (SĐT: ${selectedItem.phone})`}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: "var(--primary-navy)" }}>Phân loại phản ánh:</span>{" "}
                      <span style={{ fontWeight: 600 }}>
                        {getFeedbackTypeLabel(selectedItem.report_type)}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: "var(--primary-navy)" }}>Ý kiến du khách:</span>
                      <p style={{ marginTop: "4px", fontSize: "13px", lineHeight: 1.4, color: "var(--text-dark)", whiteSpace: "pre-wrap" }}>
                        💬 &quot;{selectedItem.content}&quot;
                      </p>
                    </div>
                    {selectedItem.image_url && (
                      <div style={{ marginTop: "6px" }}>
                        <span style={{ fontWeight: 700, color: "var(--primary-navy)", display: "block", marginBottom: "6px" }}>
                          🖼️ Minh chứng đính kèm:
                        </span>
                        <a 
                          href={selectedItem.image_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ display: "inline-block", position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--accent-gold)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", transition: "all 0.2s" }}
                        >
                          <img 
                            src={selectedItem.image_url} 
                            alt="Ảnh minh chứng từ du khách" 
                            style={{ display: "block", maxHeight: "180px", maxWidth: "100%", objectFit: "contain", borderRadius: "8px" }} 
                          />
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(11, 37, 69, 0.85)", color: "white", padding: "4px 8px", fontSize: "10.5px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                            <ExternalLink size={10} />
                            <span>Nhấn để phóng to ở tab mới</span>
                          </div>
                        </a>
                      </div>
                    )}
                    {selectedItem.latitude && selectedItem.longitude && (
                      <div style={{ marginTop: "4px" }}>
                        <span style={{ fontWeight: 700, color: "var(--primary-navy)" }}>Tọa độ gửi kèm:</span>{" "}
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedItem.latitude},${selectedItem.longitude}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: "var(--secondary-blue)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <MapPin size={12} />
                          <span>{selectedItem.latitude.toFixed(6)}, {selectedItem.longitude.toFixed(6)} (Xem vị trí thực địa)</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quyết định trạng thái</label>
                    <select 
                      className="form-select" 
                      value={fbStatus} 
                      onChange={e => setFbStatus(e.target.value as any)}
                    >
                      <option value="new">Chưa xử lý (Chờ duyệt)</option>
                      <option value="in_progress">Đang xử lý (Đã giao việc liên quan)</option>
                      <option value="resolved">Đã giải quyết xong (Đóng phản ánh)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Giải pháp hành chính / Ghi chú phản hồi nội bộ</label>
                    <textarea 
                      className="form-textarea" 
                      placeholder="Nhập nội dung xử lý của Ban Quản lý..."
                      rows={4}
                      value={fbNotes} 
                      onChange={e => setFbNotes(e.target.value)}
                    />
                  </div>
                </div>
                <footer className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Lưu kết quả giải quyết</button>
                </footer>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
