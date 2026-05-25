// Zalo Mini App - API Client Service
// Uses Supabase JS client directly for data + 9Router for TTS + FastAPI backend for RAG (Hướng dẫn viên 4.0)

import { createClient } from "@supabase/supabase-js";

// ─── Supabase Config ──────────────────────────────────────────────────────────
const SUPABASE_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || "");
const SUPABASE_ANON_KEY = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "");

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Type Definitions ──────────────────────────────────────────────────────────
export interface TouristPlace {
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

export const hasAudioGuide = (place: TouristPlace, language: string) => {
  const url = language === "en" && place.audio_url_en ? place.audio_url_en : place.audio_url;
  const hasUrl = !!url && url.trim().toLowerCase() !== "none";
  return place.audio_enabled === true && hasUrl;
};

export const getAudioGuideUrl = (place: TouristPlace, language: string) => {
  if (!hasAudioGuide(place, language)) return null;
  return language === "en" && place.audio_url_en ? place.audio_url_en : place.audio_url ?? null;
};

export interface Announcement {
  id: string;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  type: "general" | "emergency" | "weather" | "festival";
  published_at: string;
}

export interface ChatResponse {
  answer: string;
  confidence_score: number;
  sources: Array<{
    article_id: string;
    title: string;
    category: string;
    source?: string;
  }>;
}

export interface ItineraryStep {
  vi: string;
  en: string;
}

export interface Itinerary {
  id: string;
  name: string;
  name_en?: string;
  duration: string;
  duration_en?: string;
  color: string;
  place_slugs: string[];
  steps: ItineraryStep[];
  status?: string;
  created_at: string;
  updated_at: string;
}

// ─── API Client ───────────────────────────────────────────────────────────────
class ApiClient {
  private backendUrl: string;

  constructor() {
    this.backendUrl = (((import.meta as any).env?.VITE_BASE_URL || "http://localhost:8000")).replace(/\/$/, "");
  }

  private async backendRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.backendUrl}${path}`;
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) throw new Error(`Backend error: ${response.status}`);
    return response.json();
  }

  // ─── Tourist Places ─ Direct Supabase ───────────────────
  async getPlaces(category?: string): Promise<TouristPlace[]> {
    let query = supabase
      .from("tourist_places")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: true });

    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as TouristPlace[]) ?? [];
  }

  async getPlaceBySlug(slug: string): Promise<TouristPlace> {
    const { data, error } = await supabase
      .from("tourist_places")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Không tìm thấy địa điểm");
    return data as TouristPlace;
  }

  // ─── Announcements ─ Direct Supabase ────────────────────
  async getAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data as Announcement[]) ?? [];
  }

  // ─── Itineraries ─ FastAPI Backend ──────────────────────
  async getItineraries(): Promise<Itinerary[]> {
    return this.backendRequest<Itinerary[]>("/api/itineraries");
  }

  // ─── Hướng dẫn viên 4.0 AI Chat ─ FastAPI RAG backend ───────
  async askAssistant(
    question: string,
    language: string = "vi",
    signal?: AbortSignal,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
  ): Promise<ChatResponse> {
    return this.backendRequest<ChatResponse>("/api/chat/", {
      method: "POST",
      body: JSON.stringify({
        question,
        channel: "mini_app",
        language,
        conversation_history: conversationHistory,
      }),
      signal,
    });
  }

  // ─── Tri thức/Knowledge Articles ─ Direct Supabase ───────
  async getArticlesByCategory(category: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("knowledge_articles")
      .select("*")
      .eq("category", category)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("created_at", { ascending: true });

    if (error) {
      console.warn(`[Knowledge] Fetch for ${category} failed:`, error.message);
      throw new Error(error.message);
    }
    return data ?? [];
  }

  // ─── Storage ─ Supabase upload image ────────────────────
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.backendUrl}/api/admin/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      console.warn("[Storage] Backend upload failed:", message);
      throw new Error(message || `Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.url;
  }

  // ─── Feedback ─ Direct Supabase insert ──────────────────
  async submitFeedback(data: {
    reporter_name?: string;
    phone?: string;
    report_type: string;
    content: string;
    image_url?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{ id: string; status: string }> {
    const inserted = await this.backendRequest<{ id: string; status: string }>("/api/feedback/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { id: inserted.id, status: inserted.status };
  }
}

export const api = new ApiClient();
export default api;
