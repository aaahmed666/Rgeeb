/**
 * securityService unit tests
 * Tests: 2FA status normalisation (boolean/number/string truthiness),
 * setup payload mapping (snake/camel), enable/disable refetch behaviour.
 */

jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import {
  disableTwoFactor,
  enableTwoFactor,
  fetchTwoFactorStatus,
  setupTwoFactor,
  verifyTwoFactor,
} from "@/services/securityService";

const mockFetch = apiFetch as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("fetchTwoFactorStatus", () => {
  it("reads booleans from the data envelope", async () => {
    mockFetch.mockResolvedValue({ data: { enabled: true, confirmed: false } });
    const res = await fetchTwoFactorStatus();
    expect(mockFetch).toHaveBeenCalledWith(endpoints.security.twoFactorStatus);
    expect(res).toEqual({ enabled: true, confirmed: false });
  });

  it("coerces numeric and string truthiness", async () => {
    mockFetch.mockResolvedValue({ data: { is_enabled: 1, is_confirmed: "true" } });
    expect(await fetchTwoFactorStatus()).toEqual({ enabled: true, confirmed: true });

    mockFetch.mockResolvedValue({ data: { two_factor_enabled: "0", two_factor_confirmed: 0 } });
    expect(await fetchTwoFactorStatus()).toEqual({ enabled: false, confirmed: false });
  });

  it("handles a flat (non-enveloped) response", async () => {
    mockFetch.mockResolvedValue({ enabled: "1", confirmed: true });
    expect(await fetchTwoFactorStatus()).toEqual({ enabled: true, confirmed: true });
  });

  it("defaults to disabled on an empty response", async () => {
    mockFetch.mockResolvedValue(null);
    expect(await fetchTwoFactorStatus()).toEqual({ enabled: false, confirmed: false });
  });
});

describe("setupTwoFactor", () => {
  it("maps snake_case payloads", async () => {
    mockFetch.mockResolvedValue({
      data: {
        qr_code: "data:image/png;base64,QR",
        secret: "ABC123",
        recovery_codes: ["r1", "r2"],
      },
    });
    const res = await setupTwoFactor();
    expect(mockFetch).toHaveBeenCalledWith(endpoints.security.twoFactorSetup, { method: "POST" });
    expect(res).toEqual({
      qrCode: "data:image/png;base64,QR",
      secret: "ABC123",
      recoveryCodes: ["r1", "r2"],
    });
  });

  it("maps camelCase payloads and alternative qr keys", async () => {
    mockFetch.mockResolvedValue({
      data: { qrCode: "QRC", code: "SECRET2", recoveryCodes: [1, 2] },
    });
    const res = await setupTwoFactor();
    expect(res.qrCode).toBe("QRC");
    expect(res.secret).toBe("SECRET2");
    expect(res.recoveryCodes).toEqual(["1", "2"]);
  });

  it("returns undefined fields when the payload is empty", async () => {
    mockFetch.mockResolvedValue({});
    const res = await setupTwoFactor();
    expect(res.qrCode).toBeUndefined();
    expect(res.secret).toBeUndefined();
    expect(res.recoveryCodes).toBeUndefined();
  });
});

describe("enable / verify / disable", () => {
  it("enableTwoFactor posts the code under both keys, then refetches status", async () => {
    mockFetch
      .mockResolvedValueOnce({}) // enable call
      .mockResolvedValueOnce({ data: { enabled: 1, confirmed: 1 } }); // status refetch
    const res = await enableTwoFactor("123456");
    expect(mockFetch).toHaveBeenNthCalledWith(1, endpoints.security.twoFactorEnable, {
      method: "POST",
      body: { code: "123456", otp: "123456" },
    });
    expect(res).toEqual({ enabled: true, confirmed: true });
  });

  it("verifyTwoFactor posts the code", async () => {
    mockFetch.mockResolvedValue({});
    await verifyTwoFactor("654321");
    expect(mockFetch).toHaveBeenCalledWith(endpoints.security.twoFactorVerify, {
      method: "POST",
      body: { code: "654321", otp: "654321" },
    });
  });

  it("disableTwoFactor includes the password only when provided", async () => {
    mockFetch
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: { enabled: 0, confirmed: 0 } });
    await disableTwoFactor("hunter2");
    expect(mockFetch).toHaveBeenNthCalledWith(1, endpoints.security.twoFactorDisable, {
      method: "POST",
      body: { password: "hunter2" },
    });

    mockFetch
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: {} });
    await disableTwoFactor();
    expect(mockFetch).toHaveBeenNthCalledWith(3, endpoints.security.twoFactorDisable, {
      method: "POST",
      body: {},
    });
  });
});
