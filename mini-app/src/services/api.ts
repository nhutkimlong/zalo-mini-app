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

export interface UserProfile {
  id: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  email?: string;
  link_type?: string;
}

export interface UserItinerary {
  id: string;
  user_id: string;
  itinerary_id: string;
  created_at: string;
}

export interface RealtimeStatus {
  weather_auto: boolean;
  weather_status: string;
  weather_temp: number;
}

// ─── API Client ───────────────────────────────────────────────────────────────
class ApiClient {
  private backendUrl: string;

  constructor() {
    this.backendUrl = (
      import.meta.env.VITE_BASE_URL ||
      "https://nui-ba-den-travel-assistant-backend.onrender.com"
    ).replace(/\/$/, "");
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

  // ─── Itineraries ─ Direct Supabase ──────────────────────
  async getItineraries(): Promise<Itinerary[]> {
    const { data, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as Itinerary[]) ?? [];
  }

  async getMyItineraries(): Promise<UserItinerary[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("user_itineraries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as UserItinerary[]) ?? [];
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
        channel: "web",
        language,
        conversation_history: conversationHistory,
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
  async getRealtimeStatus(): Promise<RealtimeStatus> {
    return this.backendRequest<RealtimeStatus>("/api/tourism/realtime");
  }

  // ─── User Profile ──────────────────────────────────────
  async getMyProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("app_users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) {
      return { ...(data as UserProfile), email: user.email };
    }
    
    // Fail-safe: Auto-create profile in app_users if not found
    const metadata = user.user_metadata || {};
    const name = metadata.name || user.email?.split("@")[0] || "Khách du lịch";
    const { data: inserted, error: insertError } = await supabase
      .from("app_users")
      .insert({
        id: user.id,
        name: name,
        phone: metadata.phone || null,
        avatar_url: metadata.avatar_url || null,
        role: "visitor"
      })
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);
    return { ...(inserted as UserProfile), email: user.email };
  }

  async updateMyProfile(profileData: { name?: string; phone?: string; avatar_url?: string }): Promise<UserProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");
    const { data, error } = await supabase
      .from("app_users")
      .update(profileData)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...(data as UserProfile), email: user.email };
  }

  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    const sessionRes = await supabase.auth.getSession();
    const token = sessionRes.data.session?.access_token;
    
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.backendUrl}/api/users/me/avatar`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Upload failed: ${response.status}`);
    }

    return response.json();
  }

  // ─── Favorites ─────────────────────────────────────────
  async getMyFavorites(): Promise<TouristPlace[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("user_favorites")
      .select("place_id, tourist_places(*)")
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
    const favorites: TouristPlace[] = [];
    if (data) {
      for (const item of data) {
        if (item.tourist_places) {
          favorites.push(item.tourist_places as any);
        }
      }
    }
    return favorites;
  }

  async toggleFavorite(placeId: string): Promise<{ favorited: boolean; message: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");
    const { data: existing, error: checkError } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("place_id", placeId)
      .maybeSingle();
    if (checkError) throw new Error(checkError.message);

    if (existing) {
      const { error: deleteError } = await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("place_id", placeId);
      if (deleteError) throw new Error(deleteError.message);
      return { favorited: false, message: "Đã bỏ địa danh khỏi danh sách yêu thích." };
    } else {
      const { error: insertError } = await supabase
        .from("user_favorites")
        .insert({ user_id: user.id, place_id: placeId });
      if (insertError) throw new Error(insertError.message);
      return { favorited: true, message: "Đã thêm địa danh vào danh sách yêu thích." };
    }
  }

  // ─── Stamp Rally & Rewards ─────────────────────────────
  async getMyStamps(): Promise<Array<{ place_slug: string; created_at: string; verified_via: string }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("user_stamps")
      .select("*")
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getAllStamps(): Promise<Array<{ place_slug: string; created_at: string }>> {
    const { data, error } = await supabase
      .from("user_stamps")
      .select("place_slug, created_at");
    if (error) throw new Error(error.message);
    return data ?? [];
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("user_rewards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as any[]) ?? [];
  }

  async getBadges(): Promise<any[]> {
    const { data, error } = await supabase
      .from("badge_rules")
      .select("*")
      .order("xp_required", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getLeaderboard(): Promise<any[]> {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("total_xp", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return data ?? [];
  }
}

export const api = new ApiClient();
export default api;
