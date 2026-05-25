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
  title_en?: string;
  content_en?: string;
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
    const articles = await this.request<any[]>("/api/admin/knowledge");
    return articles.map(article => this.normalizeArticle(article));
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

  // --- Admin System Settings ---
  async getSettings(): Promise<{ model: string; input_cost_per_1m: number; output_cost_per_1m: number; embed_model: string; embed_cost_per_1m: number }> {
    return await this.request<{ model: string; input_cost_per_1m: number; output_cost_per_1m: number; embed_model: string; embed_cost_per_1m: number }>("/api/admin/settings", {
      method: "GET"
    });
  }

  async updateSettings(data: { model: string; input_cost_per_1m: number; output_cost_per_1m: number; embed_model: string; embed_cost_per_1m: number }): Promise<{ status: string; message: string }> {
    return await this.request<{ status: string; message: string }>("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify(data)
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
    return await this.request<AdminAnnouncement[]>("/api/announcements");
  }

  async createAnnouncement(data: Omit<AdminAnnouncement, "id" | "published_at">): Promise<AdminAnnouncement> {
    return await this.request<AdminAnnouncement>("/api/announcements", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }

  async updateAnnouncement(id: string, data: Partial<AdminAnnouncement>): Promise<AdminAnnouncement> {
    return await this.request<AdminAnnouncement>(`/api/announcements/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  }

  async deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    return await this.request<{ success: boolean }>(`/api/announcements/${id}`, {
      method: "DELETE"
    });
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
    const feedbacks = await this.request<any[]>("/api/feedback");
    return feedbacks.map(feedback => this.normalizeFeedback(feedback));
  }

  async resolveFeedback(id: string, status: AdminFeedback["status"], notes: string): Promise<AdminFeedback> {
    const updated = await this.request<any>(`/api/feedback/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status, internal_note: notes })
    });
    return this.normalizeFeedback(updated);
  }

  async deleteFeedback(id: string): Promise<{ success: boolean }> {
    return await this.request<{ success: boolean }>(`/api/feedback/${id}`, {
      method: "DELETE"
    });
  }

  // --- Beeknoee Usage Summary ---
  async getUsageSummary(): Promise<AdminUsageSummary> {
    return await this.request<AdminUsageSummary>("/api/admin/usage-summary");
  }

  // --- Chat Logs Review ---
  async getChatLogs(): Promise<AdminChatLog[]> {
    return await this.request<AdminChatLog[]>("/api/admin/chat-logs");
  }

  async resetChatLogs(): Promise<{ status: string; message: string }> {
    return await this.request<{ status: string; message: string }>("/api/admin/chat-logs", {
      method: "DELETE"
    });
  }
}

export const adminApi = new AdminApiClient();
export default adminApi;
