// Admin Dashboard - API Client Service with high-fidelity offline fallback engines.

export interface AdminKnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  is_published: boolean;
  status?: string;
  visibility?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminPlace {
  id: string;
  name: string;
  name_en?: string;
  slug: string;
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
  category: string;
  display_order?: number;
}

export interface AdminItineraryStep {
  vi: string;
  en: string;
}

export interface AdminItinerary {
  id: string;
  name: string;
  name_en?: string;
  duration: string;
  duration_en?: string;
  color: string;
  place_slugs: string[];
  steps: AdminItineraryStep[];
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  type: "general" | "emergency" | "weather" | "festival";
  published_at: string;
}

export interface AdminFeedback {
  id: string;
  reporter_name?: string;
  phone?: string;
  report_type: string;
  content: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  status: "new" | "in_progress" | "resolved";
  admin_notes?: string;
  internal_note?: string;
  assigned_unit?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminChatLog {
  id: string;
  question: string;
  answer: string;
  confidence_score: number;
  matched_chunks: string; // JSON or text summary of cited items
  channel: string;
  model?: string | null;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  estimated_cost_usd?: number;
  created_at: string;
}

export interface AdminUsageRow {
  date?: string;
  model?: string;
  request_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

export interface AdminUsageSummary {
  request_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  daily: AdminUsageRow[];
  by_model: AdminUsageRow[];
}

class AdminApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ((import.meta as any).env?.VITE_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        let message = `HTTP Error: ${res.status}`;
        try {
          const errorBody = await res.json();
          message = errorBody.detail || message;
        } catch (_) {}
        throw new Error(message);
      }
      return await res.json();
    } catch (err) {
      console.warn("FastAPI backend is offline. Using local mock dataset for this request.");
      throw err;
    }
  }

  private normalizeArticle(article: any): AdminKnowledgeArticle {
    return {
      ...article,
      id: String(article.id),
      is_published: article.is_published ?? article.status === "published",
      created_at: article.created_at,
      updated_at: article.updated_at
    };
  }

  private normalizeFeedback(feedback: any): AdminFeedback {
    return {
      ...feedback,
      id: String(feedback.id),
      admin_notes: feedback.admin_notes ?? feedback.internal_note ?? "",
      status: feedback.status
    };
  }

  private toArticlePayload(data: Partial<AdminKnowledgeArticle>) {
    const { is_published, created_at, updated_at, id, ...rest } = data;
    return {
      ...rest,
      ...(typeof is_published === "boolean" ? { status: is_published ? "published" : "draft" } : {})
    };
  }

  // --- Upload, Translation, and TTS Integration ---
  async uploadFile(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const url = `${this.baseUrl}/api/admin/upload`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return await res.json();
    } catch (err) {
      console.warn("Upload service offline. Using local object URL fallback.");
      const localUrl = URL.createObjectURL(file);
      return { url: localUrl };
    }
  }

  async translateText(text: string, targetLang: "vi" | "en" = "en"): Promise<{ translated_text: string }> {
    return await this.request<{ translated_text: string }>("/api/admin/translate", {
      method: "POST",
      body: JSON.stringify({ text, target_lang: targetLang })
    });
  }



  // --- Knowledge Articles (CRUD) ---
  async getArticles(): Promise<AdminKnowledgeArticle[]> {
    try {
      const articles = await this.request<any[]>("/api/admin/knowledge");
      return articles.map(article => this.normalizeArticle(article));
    } catch (e) {
      return MOCK_ARTICLES.map(article => this.normalizeArticle(article));
    }
  }

  async createArticle(data: Omit<AdminKnowledgeArticle, "id" | "created_at" | "updated_at">): Promise<AdminKnowledgeArticle> {
    const created = await this.request<any>("/api/admin/knowledge", {
      method: "POST",
      body: JSON.stringify(this.toArticlePayload(data))
    });
    return this.normalizeArticle(created);
  }

  async updateArticle(id: string, data: Partial<AdminKnowledgeArticle>): Promise<AdminKnowledgeArticle> {
    const updated = await this.request<any>(`/api/admin/knowledge/${id}`, {
      method: "PUT",
      body: JSON.stringify(this.toArticlePayload(data))
    });
    return this.normalizeArticle(updated);
  }

  async deleteArticle(id: string): Promise<{ success: boolean }> {
    return await this.request<{ success: boolean }>(`/api/admin/knowledge/${id}`, {
      method: "DELETE"
    });
  }

  async reindexKnowledge(): Promise<{ status: string; indexed_articles: number; failed_article_ids: string[] }> {
    return await this.request<{ status: string; indexed_articles: number; failed_article_ids: string[] }>("/api/admin/reindex-knowledge", {
      method: "POST"
    });
  }

  // --- Places (CRUD) ---
  async getPlaces(): Promise<AdminPlace[]> {
    return await this.request<AdminPlace[]>("/api/places");
  }

  async createPlace(data: Omit<AdminPlace, "id">): Promise<AdminPlace> {
    return await this.request<AdminPlace>("/api/places", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async updatePlace(id: string, data: Partial<AdminPlace>): Promise<AdminPlace> {
    return await this.request<AdminPlace>(`/api/places/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  async deletePlace(id: string): Promise<{ success: boolean }> {
    return await this.request<{ success: boolean }>(`/api/places/${id}`, {
      method: "DELETE"
    });
  }

  // --- Announcements (CRUD) ---
  async getAnnouncements(): Promise<AdminAnnouncement[]> {
    try {
      return await this.request<AdminAnnouncement[]>("/api/announcements");
    } catch (e) {
      return MOCK_ANNOUNCEMENTS;
    }
  }

  async createAnnouncement(data: Omit<AdminAnnouncement, "id" | "published_at">): Promise<AdminAnnouncement> {
    try {
      return await this.request<AdminAnnouncement>("/api/announcements", {
        method: "POST",
        body: JSON.stringify(data)
      });
    } catch (e) {
      const newAnn: AdminAnnouncement = {
        ...data,
        id: `ann-${Math.floor(Math.random() * 100000)}`,
        published_at: new Date().toISOString()
      };
      MOCK_ANNOUNCEMENTS.unshift(newAnn);
      return newAnn;
    }
  }

  async updateAnnouncement(id: string, data: Partial<AdminAnnouncement>): Promise<AdminAnnouncement> {
    try {
      return await this.request<AdminAnnouncement>(`/api/announcements/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    } catch (e) {
      const idx = MOCK_ANNOUNCEMENTS.findIndex(a => a.id === id);
      if (idx === -1) throw new Error("Announcement not found");
      const updated = { ...MOCK_ANNOUNCEMENTS[idx], ...data };
      MOCK_ANNOUNCEMENTS[idx] = updated;
      return updated;
    }
  }

  async deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/announcements/${id}`, {
        method: "DELETE"
      });
    } catch (e) {
      const idx = MOCK_ANNOUNCEMENTS.findIndex(a => a.id === id);
      if (idx !== -1) MOCK_ANNOUNCEMENTS.splice(idx, 1);
      return { success: true };
    }
  }

  // --- Itineraries (CRUD) ---
  async getItineraries(): Promise<AdminItinerary[]> {
    return await this.request<AdminItinerary[]>("/api/itineraries");
  }

  async createItinerary(data: Omit<AdminItinerary, "id" | "created_at" | "updated_at">): Promise<AdminItinerary> {
    return await this.request<AdminItinerary>("/api/itineraries", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async updateItinerary(id: string, data: Partial<AdminItinerary>): Promise<AdminItinerary> {
    return await this.request<AdminItinerary>(`/api/itineraries/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  async deleteItinerary(id: string): Promise<{ success: boolean }> {
    return await this.request<{ success: boolean }>(`/api/itineraries/${id}`, {
      method: "DELETE"
    });
  }

  // --- Feedbacks Manager ---
  async getFeedbacks(): Promise<AdminFeedback[]> {
    try {
      const feedbacks = await this.request<any[]>("/api/feedback");
      return feedbacks.map(feedback => this.normalizeFeedback(feedback));
    } catch (e) {
      return MOCK_FEEDBACKS;
    }
  }

  async resolveFeedback(id: string, status: AdminFeedback["status"], notes: string): Promise<AdminFeedback> {
    try {
      const updated = await this.request<any>(`/api/feedback/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status, internal_note: notes })
      });
      return this.normalizeFeedback(updated);
    } catch (e) {
      const idx = MOCK_FEEDBACKS.findIndex(f => f.id === id);
      if (idx === -1) throw new Error("Feedback not found");
      const updated = {
        ...MOCK_FEEDBACKS[idx],
        status,
        admin_notes: notes
      };
      MOCK_FEEDBACKS[idx] = updated;
      return updated;
    }
  }

  // --- Beeknoee Usage Summary ---
  async getUsageSummary(): Promise<AdminUsageSummary> {
    try {
      return await this.request<AdminUsageSummary>("/api/admin/usage-summary");
    } catch (e) {
      return buildMockUsageSummary();
    }
  }

  // --- Chat Logs Review ---
  async getChatLogs(): Promise<AdminChatLog[]> {
    try {
      return await this.request<AdminChatLog[]>("/api/admin/chat-logs");
    } catch (e) {
      return MOCK_CHAT_LOGS;
    }
  }
}

// Extensive pre-seeded local datasets for standalone developer testing
const MOCK_ARTICLES: AdminKnowledgeArticle[] = [
  {
    id: "a1",
    title: "Thông tin giá vé cáp treo Núi Bà Đen năm 2026",
    category: "ve_va_gio_mo_cua",
    content: "Giá vé cáp treo Sun World BaDen Mountain năm 2026 cụ thể như sau:\n\n1. Tuyến cáp Vân Sơn (Lên Đỉnh Núi):\n- Vé khứ hồi người lớn: 400.000 VNĐ\n- Vé khứ hồi trẻ em (1m-1m4): 300.000 VNĐ\n- Trẻ em dưới 1m: Miễn phí.\n\n2. Tuyến cáp Chùa Hang (Lên Chùa Bà):\n- Vé khứ hồi người lớn: 250.000 VNĐ\n- Vé khứ hồi trẻ em: 150.000 VNĐ.\n\nCombo cả hai tuyến khứ hồi là 550.000 VNĐ (người lớn) và 400.000 VNĐ (trẻ em).",
    is_published: true,
    created_at: "2026-05-20T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z"
  },
  {
    id: "a2",
    title: "Giờ hoạt động chi tiết của Khu du lịch",
    category: "ve_va_gio_mo_cua",
    content: "Khu du lịch Núi Bà Đen hoạt động như sau:\n\n- Tuyến cáp Vân Sơn (lên đỉnh núi): Thứ 2 - Thứ 6 mở cửa 07:00 - 18:00. Thứ Bảy và Chủ Nhật mở cửa 06:00 - 21:00 để ngắm đèn LED đỉnh núi.\n- Tuyến cáp Chùa Hang (lên Chùa Bà): Thứ 2 - Thứ 6 mở cửa 06:00 - 18:00. Thứ Bảy và Chủ Nhật mở rộng từ 05:30 - 22:00.\n- Chùa Bà và Điện Bà đón khách từ 06:00 đến 22:00 hàng ngày.",
    is_published: true,
    created_at: "2026-05-21T08:00:00Z",
    updated_at: "2026-05-21T08:00:00Z"
  },
  {
    id: "a3",
    title: "Quy định trang phục và quy tắc ứng xử",
    category: "noi_quy",
    content: "Khi chiêm bái các chùa di tích (Chùa Bà, Điện Bà), du khách lưu ý:\n\n1. Trang phục kín đáo, lịch sự. Tránh áo sát nách, hai dây, quần short ngắn hoặc váy trên đầu gối.\n2. Giữ trật tự, đi nhẹ nói khẽ trong chánh điện.\n3. Không xả rác bừa bãi và không mang vật nuôi vào chùa.\n4. Giày dép lịch sự, nên đi giày thể thao vì địa hình dốc bậc tam cấp.",
    is_published: true,
    created_at: "2026-05-19T09:00:00Z",
    updated_at: "2026-05-19T09:00:00Z"
  },
  {
    id: "a4",
    title: "Hướng dẫn di chuyển đến Núi Bà Đen",
    category: "di_chuyen",
    content: "Quãng đường từ TP. Hồ Chí Minh đến Núi Bà Đen khoảng 110km. Bạn có thể chọn:\n\n1. Xe cá nhân (Xe máy/ô tô): Đi QL22 đến ngã ba Trảng Bàng rẽ phải Tỉnh lộ 782, hoặc đi thẳng Gò Dầu rẽ QL22B rồi đi tiếp đường Bời Lời (khoảng 2.5 - 3 tiếng).\n2. Xe khách Limousine: Có giá vé 150.000 - 200.000 VNĐ chạy thẳng đưa đón tận nơi.\n3. Xe buýt: Đi tuyến bến xe An Sương - bến xe Tây Ninh rồi bắt taxi/bus nội tỉnh đến núi.",
    is_published: true,
    created_at: "2026-05-18T14:00:00Z",
    updated_at: "2026-05-18T14:00:00Z"
  },
  {
    id: "a5",
    title: "Lịch sử và sự tích Linh Sơn Thánh Mẫu",
    category: "lich_su",
    content: "Sự tích Linh Sơn Thánh Mẫu (Bà Đen) kể về nàng Lý Thị Thiên Hương trung trinh tiết liệt thế kỷ 18. Nàng đem lòng yêu chàng Lê Sĩ Triệt. Khi chàng tòng quân, nàng bị kẻ xấu vây bắt cưỡng đoạt đã nhảy xuống khe núi quyên sinh giữ trọn trinh tiết. Nàng hiển linh báo mộng và cứu giúp nhân dân vượt qua dịch bệnh thiên tai. Triều đình nhà Nguyễn sắc phong nàng là 'Linh Sơn Thánh Mẫu' và nhân dân lập đền Điện Bà thờ phụng trang trọng.",
    is_published: true,
    created_at: "2026-05-17T07:30:00Z",
    updated_at: "2026-05-17T07:30:00Z"
  }
];


const MOCK_ANNOUNCEMENTS: AdminAnnouncement[] = [
  {
    id: "an1",
    title: "Thông báo bảo trì định kỳ tuyến cáp treo Vân Sơn ngày 25/05/2026",
    content: "Ban quản lý Sun World BaDen Mountain trân trọng thông báo đến Quý du khách: Tuyến cáp treo Vân Sơn (đưa khách lên đỉnh núi) sẽ tạm ngưng hoạt động trong ngày thứ Hai 25/05/2026 để tiến hành công tác bảo trì kỹ thuật định kỳ. Tuyến cáp treo Chùa Hang vẫn hoạt động bình thường.",
    type: "emergency",
    published_at: "2026-05-20T08:00:00Z"
  },
  {
    id: "an2",
    title: "Khai mạc Lễ hội Vía Bà Linh Sơn Thánh Mẫu năm 2026",
    content: "Lễ hội Vía Bà Linh Sơn Thánh Mẫu - Di sản văn hóa phi vật thể quốc gia sẽ chính thức khai mạc từ ngày mùng 4 đến mùng 6 tháng 5 Âm lịch tại Khu di tích Núi Bà Đen. Kính mời du khách gần xa về tham dự chiêm bái.",
    type: "festival",
    published_at: "2026-05-21T07:00:00Z"
  },
  {
    id: "an3",
    title: "Khuyến cáo an toàn phòng tránh giông sét ban chiều trên đỉnh núi",
    content: "Theo dự báo, khu vực Núi Bà Đen xuất hiện mưa rào và giông kèm sấm sét vào các buổi chiều muộn. Ban Quản lý khuyến cáo du khách di chuyển vào nhà ga cáp treo khi trời nổi giông.",
    type: "weather",
    published_at: "2026-05-21T15:00:00Z"
  }
];

const MOCK_FEEDBACKS: AdminFeedback[] = [
  {
    id: "fb-10293",
    reporter_name: "Nguyễn Văn Hùng",
    phone: "0901234567",
    report_type: "pricing",
    content: "Tại khu vực gần cổng ga cáp treo có một số người chèo kéo mua nước uống, thức ăn với giá khá cao so với niêm yết của khu du lịch, đề nghị Ban Quản lý có biện pháp nhắc nhở để bảo vệ hình ảnh du khách.",
    image_url: "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?w=800",
    latitude: 11.372102,
    longitude: 106.163245,
    status: "new",
    created_at: "2026-05-21T09:30:00Z"
  },
  {
    id: "fb-10294",
    reporter_name: "Trần Thị Lan",
    phone: "0987654321",
    report_type: "hygiene",
    content: "Khu vực sảnh chờ ga Vân Sơn có một số vỏ hộp nước do khách bỏ lại chưa kịp dọn. Nên bổ sung thêm các sọt rác công cộng có nắp đậy dọc lối đi lên đài Quan Âm.",
    latitude: 11.385499,
    longitude: 106.172499,
    status: "in_progress",
    admin_notes: "Đã chỉ đạo tổ vệ sinh môi trường tăng tần suất thu gom rác tại đỉnh núi mỗi 30 phút một lần và bổ sung thêm 5 thùng rác gỗ mỹ quan xung quanh khu vực tượng Phật Bà.",
    created_at: "2026-05-21T10:45:00Z"
  },
  {
    id: "fb-10295",
    reporter_name: "Phạm Minh Tuấn",
    phone: "0912345678",
    report_type: "security",
    content: "Hôm nay tôi thấy có một bé trai khoảng 5 tuổi bị lạc ở khu vực Điện Bà, rất may có các anh nhân viên an ninh đã tận tình giữ cháu và dùng loa phát thanh hỗ trợ tìm được bố mẹ nhanh chóng. Rất cảm ơn tổ an ninh!",
    latitude: 11.378512,
    longitude: 106.169101,
    status: "resolved",
    admin_notes: "Ghi nhận phản hồi tích cực. Đã biểu dương tổ an ninh Điện Bà tại cuộc họp giao ban tuần.",
    created_at: "2026-05-20T14:15:00Z"
  }
];

const MOCK_CHAT_LOGS: AdminChatLog[] = [
  {
    id: "log-1",
    question: "Giá vé cáp treo khứ hồi đỉnh núi bao nhiêu?",
    answer: "Giá vé cáp treo Sun World BaDen Mountain khứ hồi lên đỉnh núi (Tuyến Vân Sơn) năm 2026 là 400.000 VNĐ đối với người lớn và 300.000 VNĐ đối với trẻ em từ 1m-1m4. Trẻ em dưới 1m được miễn phí vé.",
    confidence_score: 0.98,
    matched_chunks: "['Thông tin giá vé cáp treo Núi Bà Đen năm 2026' - Trùng khớp: 98%]",
    channel: "mini_app",
    model: "gemini-3.1-flash-lite",
    prompt_tokens: 1200,
    completion_tokens: 180,
    total_tokens: 1380,
    estimated_cost_usd: 0,
    created_at: "2026-05-21T15:20:00Z"
  },
  {
    id: "log-2",
    question: "Có thể mặc quần short đi viếng Chùa Bà được không?",
    answer: "Theo quy định trang phục khi chiêm bái Chùa Bà và Điện Bà, du khách cần trang phục kín đáo, lịch sự. Tránh mặc các loại áo sát nách, hai dây, quần short ngắn hoặc váy trên đầu gối. Do vậy, anh/chị không nên mặc quần short ngắn khi đi viếng chùa.",
    confidence_score: 0.95,
    matched_chunks: "['Quy định trang phục và quy tắc ứng xử' - Trùng khớp: 95%]",
    channel: "zalo_oa",
    model: "gemini-3.1-flash-lite",
    prompt_tokens: 980,
    completion_tokens: 160,
    total_tokens: 1140,
    estimated_cost_usd: 0,
    created_at: "2026-05-21T14:45:00Z"
  },
  {
    id: "log-3",
    question: "Tải bản đồ du lịch leo núi ở đâu?",
    answer: "Hiện hệ thống chưa có thông tin được duyệt về nội dung này. Anh/chị vui lòng liên hệ Ban Quản lý để được hỗ trợ.",
    confidence_score: 0.12,
    matched_chunks: "[Không tìm thấy chunk phù hợp trên ngưỡng 0.5]",
    channel: "mini_app",
    model: "untracked",
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    estimated_cost_usd: 0,
    created_at: "2026-05-21T13:10:00Z"
  }
];

const buildMockUsageSummary = (): AdminUsageSummary => {
  const dailyMap = new Map<string, AdminUsageRow>();
  const modelMap = new Map<string, AdminUsageRow>();

  MOCK_CHAT_LOGS.forEach((log) => {
    const date = log.created_at.slice(0, 10);
    const model = log.model || "gemini-3.1-flash-lite";
    const rows: Array<[Map<string, AdminUsageRow>, string, Partial<AdminUsageRow>]> = [
      [dailyMap, date, { date }],
      [modelMap, model, { model }]
    ];

    rows.forEach(([map, key, base]) => {
      const current = map.get(key) || {
        ...base,
        request_count: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        estimated_cost_usd: 0,
      } as AdminUsageRow;
      current.request_count += 1;
      current.prompt_tokens += log.prompt_tokens || 0;
      current.completion_tokens += log.completion_tokens || 0;
      current.total_tokens += log.total_tokens || 0;
      current.estimated_cost_usd += log.estimated_cost_usd || 0;
      map.set(key, current);
    });
  });

  const daily = Array.from(dailyMap.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const by_model = Array.from(modelMap.values()).sort((a, b) => b.total_tokens - a.total_tokens);

  return {
    request_count: MOCK_CHAT_LOGS.length,
    prompt_tokens: MOCK_CHAT_LOGS.reduce((sum, log) => sum + (log.prompt_tokens || 0), 0),
    completion_tokens: MOCK_CHAT_LOGS.reduce((sum, log) => sum + (log.completion_tokens || 0), 0),
    total_tokens: MOCK_CHAT_LOGS.reduce((sum, log) => sum + (log.total_tokens || 0), 0),
    estimated_cost_usd: MOCK_CHAT_LOGS.reduce((sum, log) => sum + (log.estimated_cost_usd || 0), 0),
    daily,
    by_model,
  };
};

export const adminApi = new AdminApiClient();
export default adminApi;
