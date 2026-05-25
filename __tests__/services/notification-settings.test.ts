import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
  verifyTelegram,
  sendTestTelegram,
  sendTestEmail,
  type NotificationSettings,
} from '@/services/notificationSettingsService';
import { apiFetch } from '@/lib/api';

vi.mock('@/lib/api');

describe('NotificationSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSettings: NotificationSettings = {
    telegramEnabled: true,
    telegramBotToken: '123456:ABC-DEF',
    telegramChatId: '-5131023516',
    telegramVerified: true,
    emailEnabled: true,
    emailRecipients: ['user@example.com'],
    allAlertTypes: true,
    alertTypes: [],
    cooldownMinutes: 5,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    deliverySummary: false,
    waitViolationAlerts: true,
  };

  describe('fetchNotificationSettings', () => {
    it('should fetch notification settings successfully', async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockSettings);

      const result = await fetchNotificationSettings();

      expect(result).toEqual(mockSettings);
      expect(apiFetch).toHaveBeenCalled();
    });

    it('should handle API response with data wrapper', async () => {
      vi.mocked(apiFetch).mockResolvedValue({ data: mockSettings });

      const result = await fetchNotificationSettings();

      expect(result).toEqual(mockSettings);
    });

    it('should handle null response', async () => {
      vi.mocked(apiFetch).mockResolvedValue(null);

      const result = await fetchNotificationSettings();

      expect(result.telegramEnabled).toBe(false);
      expect(result.emailEnabled).toBe(false);
    });

    it('should throw on API error', async () => {
      vi.mocked(apiFetch).mockRejectedValue(new Error('API error'));

      await expect(fetchNotificationSettings()).rejects.toThrow('API error');
    });

    it('should map snake_case API response to camelCase', async () => {
      const snakeCaseResponse = {
        telegram_enabled: true,
        telegram_bot_token: '123456:ABC-DEF',
        telegram_chat_id: '-5131023516',
        telegram_verified: true,
        email_enabled: true,
        email_recipients: ['user@example.com'],
        all_alert_types: true,
        alert_types: [],
        cooldown_minutes: 5,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        delivery_summary: false,
        wait_violation_alerts: true,
      };

      vi.mocked(apiFetch).mockResolvedValue(snakeCaseResponse);

      const result = await fetchNotificationSettings();

      expect(result.telegramEnabled).toBe(true);
      expect(result.emailRecipients).toEqual(['user@example.com']);
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update settings successfully', async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockSettings);

      const patch: Partial<NotificationSettings> = {
        telegramEnabled: true,
        cooldownMinutes: 10,
      };

      const result = await updateNotificationSettings(patch);

      expect(result).toEqual(mockSettings);
      expect(apiFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(Object),
        })
      );
    });

    it('should convert camelCase to snake_case in request', async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockSettings);

      const patch: Partial<NotificationSettings> = {
        telegramBotToken: 'new-token',
        emailRecipients: ['new@example.com'],
      };

      await updateNotificationSettings(patch);

      const callArgs = vi.mocked(apiFetch).mock.calls[0];
      const body = callArgs[1]?.body as Record<string, unknown>;

      expect(body.telegram_bot_token).toBe('new-token');
      expect(body.email_recipients).toEqual(['new@example.com']);
    });

    it('should only include modified fields in request', async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockSettings);

      const patch: Partial<NotificationSettings> = {
        cooldownMinutes: 15,
      };

      await updateNotificationSettings(patch);

      const callArgs = vi.mocked(apiFetch).mock.calls[0];
      const body = callArgs[1]?.body as Record<string, unknown>;

      expect(body.cooldown_minutes).toBe(15);
      expect(Object.keys(body).length).toBe(1);
    });

    it('should handle update error', async () => {
      vi.mocked(apiFetch).mockRejectedValue(new Error('Update failed'));

      const patch: Partial<NotificationSettings> = { cooldownMinutes: 10 };

      await expect(updateNotificationSettings(patch)).rejects.toThrow();
    });
  });

  describe('verifyTelegram', () => {
    it('should send verify request', async () => {
      vi.mocked(apiFetch).mockResolvedValue({ success: true });

      await verifyTelegram();

      expect(apiFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle verify error', async () => {
      vi.mocked(apiFetch).mockRejectedValue(new Error('Verification failed'));

      await expect(verifyTelegram()).rejects.toThrow();
    });
  });

  describe('sendTestTelegram', () => {
    it('should send test telegram message', async () => {
      vi.mocked(apiFetch).mockResolvedValue({ success: true });

      await sendTestTelegram();

      expect(apiFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle test send error', async () => {
      vi.mocked(apiFetch).mockRejectedValue(new Error('Send failed'));

      await expect(sendTestTelegram()).rejects.toThrow();
    });
  });

  describe('sendTestEmail', () => {
    it('should send test email', async () => {
      vi.mocked(apiFetch).mockResolvedValue({ success: true });

      await sendTestEmail('test@example.com');

      expect(apiFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({ email: 'test@example.com' }),
        })
      );
    });

    it('should handle email send error', async () => {
      vi.mocked(apiFetch).mockRejectedValue(new Error('Email send failed'));

      await expect(sendTestEmail('test@example.com')).rejects.toThrow();
    });
  });

  describe('Data type conversions', () => {
    it('should convert string to boolean correctly', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        telegram_enabled: '1',
        email_enabled: 'true',
        all_alert_types: 'false',
      });

      const result = await fetchNotificationSettings();

      expect(result.telegramEnabled).toBe(true);
      expect(result.emailEnabled).toBe(true);
      expect(result.allAlertTypes).toBe(false);
    });

    it('should convert number to boolean correctly', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        telegram_enabled: 1,
        email_enabled: 0,
      });

      const result = await fetchNotificationSettings();

      expect(result.telegramEnabled).toBe(true);
      expect(result.emailEnabled).toBe(false);
    });

    it('should handle array and string email recipients', async () => {
      vi.mocked(apiFetch).mockResolvedValueOnce({
        email_recipients: 'a@example.com, b@example.com',
      });

      const result = await fetchNotificationSettings();

      expect(result.emailRecipients).toEqual(['a@example.com', 'b@example.com']);

      vi.mocked(apiFetch).mockResolvedValueOnce({
        email_recipients: ['c@example.com', 'd@example.com'],
      });

      const result2 = await fetchNotificationSettings();

      expect(result2.emailRecipients).toEqual(['c@example.com', 'd@example.com']);
    });
  });

  describe('Edge cases', () => {
    it('should validate quiet hours format', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      });

      const result = await fetchNotificationSettings();

      expect(result.quietHoursStart).toBe('22:00');
      expect(result.quietHoursEnd).toBe('08:00');
    });

    it('should handle cooldown minutes boundaries', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        cooldown_minutes: 60,
      });

      const result = await fetchNotificationSettings();

      expect(result.cooldownMinutes).toBe(60);
    });

    it('should sanitize email recipients', async () => {
      vi.mocked(apiFetch).mockResolvedValue({
        email_recipients: ['', 'valid@example.com', 'another@example.com'],
      });

      const result = await fetchNotificationSettings();

      // The service filters out empty strings using `.filter(Boolean)`
      expect(result.emailRecipients).toEqual(['valid@example.com', 'another@example.com']);
    });
  });
});
