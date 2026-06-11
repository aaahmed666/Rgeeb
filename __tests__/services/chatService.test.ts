/**
 * chatService unit tests
 * Tests: endpoint selection by auth state, session_id contract,
 * payload unwrapping + session_id → conversation_id normalisation,
 * history pagination contract and error fallback.
 */

jest.mock("@/lib/api", () => ({
  apiFetch: jest.fn(),
  getAuthToken: jest.fn(),
}));

import { apiFetch, getAuthToken } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { chatService } from "@/services/chatService";

const mockFetch = apiFetch as jest.Mock;
const mockToken = getAuthToken as jest.Mock;

const BOT_REPLY = {
  success: true,
  reply: "Hello!",
  language: "en",
  intent: "greeting",
  data: null,
  suggestions: [],
  conversation_id: "conv-1",
  response_time_ms: 120,
  source: "keyword",
};

beforeEach(() => jest.clearAllMocks());

describe("sendMessage", () => {
  it("uses the authenticated endpoint when a token exists", async () => {
    mockToken.mockReturnValue("jwt-token");
    mockFetch.mockResolvedValue(BOT_REPLY);
    await chatService.sendMessage("hi");
    expect(mockFetch).toHaveBeenCalledWith(endpoints.chat.send, {
      method: "POST",
      body: { message: "hi" },
    });
  });

  it("uses the public endpoint when unauthenticated", async () => {
    mockToken.mockReturnValue(null);
    mockFetch.mockResolvedValue(BOT_REPLY);
    await chatService.sendMessage("hi");
    expect(mockFetch).toHaveBeenCalledWith(endpoints.chat.sendPublic, {
      method: "POST",
      body: { message: "hi" },
    });
  });

  it("sends the conversation under the session_id key (API contract)", async () => {
    mockToken.mockReturnValue("jwt");
    mockFetch.mockResolvedValue(BOT_REPLY);
    await chatService.sendMessage("hi again", "conv-1");
    expect(mockFetch).toHaveBeenCalledWith(endpoints.chat.send, {
      method: "POST",
      body: { message: "hi again", session_id: "conv-1" },
    });
  });

  it("unwraps a { data } envelope", async () => {
    mockToken.mockReturnValue("jwt");
    mockFetch.mockResolvedValue({ data: BOT_REPLY });
    const res = await chatService.sendMessage("hi");
    expect(res.reply).toBe("Hello!");
    expect(res.conversation_id).toBe("conv-1");
  });

  it("normalises session_id → conversation_id", async () => {
    mockToken.mockReturnValue("jwt");
    const { conversation_id: _omit, ...rest } = BOT_REPLY;
    mockFetch.mockResolvedValue({ ...rest, session_id: "sess-42" });
    const res = await chatService.sendMessage("hi");
    expect(res.conversation_id).toBe("sess-42");
  });
});

describe("getHistory", () => {
  it("paginates with per_page (not limit)", async () => {
    mockFetch.mockResolvedValue({ data: [], meta: { current_page: 2, total: 0 } });
    const res = await chatService.getHistory(25, 2);
    expect(mockFetch).toHaveBeenCalledWith(endpoints.chat.history, {
      query: { per_page: 25, page: 2 },
    });
    expect(res.meta.current_page).toBe(2);
  });

  it("returns an empty page when the request fails", async () => {
    mockFetch.mockRejectedValue(new Error("boom"));
    const res = await chatService.getHistory();
    expect(res).toEqual({ data: [], meta: { current_page: 1, total: 0 } });
  });
});
