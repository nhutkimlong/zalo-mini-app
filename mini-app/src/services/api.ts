// Tourism PWA Website - API Client Service
// Uses Supabase JS client directly for data + 9Router for TTS + FastAPI backend for RAG (Hướng dẫn viên 4.0)

import { createClient } from "@supabase/supabase-js";

// ─── Supabase Config ──────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Type Definitions ──────────────────────────────────────────────────────────
export interface TouristPlace {
  id: string;
  name: string;
  name_en?: string;
  name_km?: string;
  slug: string;
  short_description: string;
  short_description_en?: string;
  short_description_km?: string;
  full_description: string;
  full_description_en?: string;
  full_description_km?: string;
  image_url: string;
  audio_url?: string | null;
  audio_url_en?: string | null;
  audio_url_km?: string | null;
  audio_enabled?: boolean;
  latitude: number;
  longitude: number;
  category: string;
  display_order?: number;
}

export type MapPlace = Omit<TouristPlace, "full_description" | "full_description_en" | "full_description_km">;

type AudioGuidePlace = Pick<TouristPlace, "audio_url" | "audio_url_en" | "audio_url_km" | "audio_enabled">;

export const hasAudioGuide = (place: AudioGuidePlace, language: string) => {
  const url = language === "km" && place.audio_url_km 
    ? place.audio_url_km 
    : language === "en" && place.audio_url_en 
      ? place.audio_url_en 
      : place.audio_url;
  const hasUrl = !!url && url.trim().toLowerCase() !== "none";
  return place.audio_enabled === true && hasUrl;
};

export const getAudioGuideUrl = (place: AudioGuidePlace, language: string) => {
  if (!hasAudioGuide(place, language)) return null;
  return language === "km" && place.audio_url_km 
    ? place.audio_url_km 
    : language === "en" && place.audio_url_en 
      ? place.audio_url_en 
      : place.audio_url ?? null;
};

export interface Announcement {
  id: string;
  title: string;
  title_en?: string;
  title_km?: string;
  content: string;
  content_en?: string;
  content_km?: string;
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
  km?: string;
}

export interface Itinerary {
  id: string;
  name: string;
  name_en?: string;
  name_km?: string;
  duration: string;
  duration_en?: string;
  duration_km?: string;
  color: string;
  place_slugs: string[];
  steps: ItineraryStep[];
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  status?: string;
  visibility?: string;
  source?: string;
  created_at: string;
  updated_at: string;
  title_en?: string;
  content_en?: string;
  title_km?: string;
  content_km?: string;
}

// ─── API Client ───────────────────────────────────────────────────────────────
class ApiClient {
  private backendUrl: string;

  constructor() {
    this.backendUrl = (import.meta.env.VITE_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  }

  private async backendRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.backendUrl}${path}`;
    
    // Inject Supabase Auth session JWT if available
    let token: string | undefined;
    try {
      const sessionRes = await supabase.auth.getSession();
      token = sessionRes.data.session?.access_token;
    } catch (err) {
      console.warn("[API] Failed to get session:", err);
    }

    const headers: Record<string, string> = { 
      "Content-Type": "application/json", 
      ...(options.headers as Record<string, string> || {}) 
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

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
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (category) query = query.eq("category", category);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as TouristPlace[]) ?? [];
  }

  async getMapPlaces(): Promise<MapPlace[]> {
    const { data, error } = await supabase
      .from("tourist_places")
      .select("id,name,name_en,name_km,slug,short_description,short_description_en,short_description_km,image_url,audio_url,audio_url_en,audio_url_km,audio_enabled,latitude,longitude,category,display_order")
      .eq("status", "published")
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return (data as MapPlace[]) ?? [];
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
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [],
    userInfo?: { zalo_user_id?: string; name?: string; avatar_url?: string }
  ): Promise<ChatResponse> {
    return this.backendRequest<ChatResponse>("/api/chat/", {
      method: "POST",
      body: JSON.stringify({
        question,
        channel: "mini_app",
        language,
        conversation_history: conversationHistory,
        user_info: userInfo,
      }),
      signal,
    });
  }

  // ─── Tri thức/Knowledge Articles ─ Direct Supabase ───────
  async getArticlesByCategory(category: string): Promise<KnowledgeArticle[]> {
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
    return (data as KnowledgeArticle[]) ?? [];
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

  // ─── Option B: Real-time Status ────────────────────────
  async getRealtimeStatus(): Promise<{
    weather_auto: boolean;
    weather_status: string;
    weather_temp: number;
    cable_peak_queue: string;
    cable_peak_wait_time: number;
    cable_temple_queue: string;
    cable_temple_wait_time: number;
  }> {
    return this.backendRequest<any>("/api/tourism/realtime");
  }

  // ─── User Profile ──────────────────────────────────────
  async getMyProfile(): Promise<any> {
    return this.backendRequest<any>("/api/users/me");
  }

  async updateMyProfile(profileData: { name?: string; phone?: string; avatar_url?: string }): Promise<any> {
    return this.backendRequest<any>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  // ─── Favorites ─────────────────────────────────────────
  async getMyFavorites(): Promise<TouristPlace[]> {
    return this.backendRequest<TouristPlace[]>("/api/users/favorites");
  }

  async toggleFavorite(placeId: string): Promise<{ favorited: boolean; message: string }> {
    return this.backendRequest<{ favorited: boolean; message: string }>("/api/users/favorites/toggle", {
      method: "POST",
      body: JSON.stringify({ place_id: placeId }),
    });
  }

  // ─── Stamp Rally & Rewards ─────────────────────────────
  async getMyStamps(): Promise<Array<{ place_slug: string; created_at: string; verified_via: string }>> {
    return this.backendRequest<any[]>("/api/tourism/stamps");
  }

  async getAllStamps(): Promise<Array<{ place_slug: string; created_at: string }>> {
    return this.backendRequest<any[]>("/api/tourism/stamps/all");
  }

  async checkinPlace(placeSlug: string, latitude: number, longitude: number): Promise<{
    status: "success" | "too_far";
    message: string;
    distance_meters: number;
    total_stamps: number;
    reward_granted: boolean;
  }> {
    return this.backendRequest<any>("/api/tourism/checkin", {
      method: "POST",
      body: JSON.stringify({ place_slug: placeSlug, latitude, longitude, verified_via: "gps" }),
    });
  }

  async getMyRewards(): Promise<Array<{
    id: string;
    reward_code: string;
    title: string;
    title_en?: string;
    title_km?: string;
    status: "unused" | "used";
    created_at: string;
  }>> {
    return this.backendRequest<any[]>("/api/tourism/rewards");
  }
}

export const api = new ApiClient();
export default api;
