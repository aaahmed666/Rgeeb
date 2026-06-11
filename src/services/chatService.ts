import { apiFetch, getAuthToken } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

// ── Types matching backend exactly ────────────────────────────────────────

export interface ChatMessage {
  id?: number | string;
  conversation_id: string;
  sender: "user" | "bot";
  message: string;
  reply?: string | null;
  intent?: string | null;
  language: "ar" | "en";
  created_at: string;
}

export interface ChatResponse {
  success: boolean;
  reply?: string; // some endpoints return reply
  message?: string; // other endpoints return message — both are the bot text
  language: "ar" | "en";
  intent: string;
  data: Record<string, unknown> | null;
  suggestions: string[];
  conversation_id: string;
  response_time_ms: number;
  source: "keyword" | "gemini" | "knowledge_base";
}

export interface ChatHistoryResponse {
  data: ChatMessage[];
  meta: { current_page: number; total: number };
}

// ── Service ───────────────────────────────────────────────────────────────

function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export const chatService = {
  sendMessage: async (
    message: string,
    conversationId?: string | null
  ): Promise<ChatResponse> => {
    const endpoint = isAuthenticated()
      ? endpoints.chat.send
      : endpoints.chat.sendPublic;
    const body: Record<string, unknown> = { message };
    // API contract (see Postman "Send Chat Message"): the field is
    // `session_id`, not `conversation_id`. Sending the wrong key meant the
    // backend never received the session, breaking conversation context.
    if (conversationId) body.session_id = conversationId;
    const res = await apiFetch<ChatResponse | { data: ChatResponse }>(
      endpoint,
      {
        method: "POST",
        body,
      }
    );
    // unwrap if needed
    const payload =
      "data" in res &&
      ((res as { data: ChatResponse }).data?.reply !== undefined ||
        (res as { data: ChatResponse }).data?.message !== undefined)
        ? (res as { data: ChatResponse }).data
        : (res as ChatResponse);
    // Normalize: backend may return the session under `session_id`.
    const raw = payload as ChatResponse & { session_id?: string };
    if (!raw.conversation_id && raw.session_id) {
      raw.conversation_id = raw.session_id;
    }
    return raw;
  },

  getHistory: async (perPage = 50, page = 1): Promise<ChatHistoryResponse> => {
    try {
      // API contract: pagination uses `per_page` (not `limit`).
      const res = await apiFetch<ChatHistoryResponse>(endpoints.chat.history, {
        query: { per_page: perPage, page },
      });
      return res;
    } catch {
      return { data: [], meta: { current_page: 1, total: 0 } };
    }
  },
};
