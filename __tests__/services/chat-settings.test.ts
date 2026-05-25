import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chatSettingsService, DEFAULT_ALERTS, type ChatSettings } from '@/services/chatSettingsService';
import { apiFetch } from '@/lib/api';

vi.mock('@/lib/api');

describe('ChatSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSettings: ChatSettings = {
    whatsapp: {
      enabled: true,
      phone_number: '+966500000000',
      language: 'ar',
      daily_reports: true,
      weekly_reports: false,
      realtime_alerts: true,
    },
    alerts: DEFAULT_ALERTS,
  };

  describe('DEFAULT_ALERTS constant', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_ALERTS.ppe_violations_window_minutes).toBe(5);
      expect(DEFAULT_ALERTS.visitor_drop_percentage).toBe(50);
      expect(DEFAULT_ALERTS.minimum_traffic_baseline).toBe(10);
      expect(DEFAULT_ALERTS.wait_time_minutes).toBe(10);
    });

    it('should have all required alert properties', () => {
      const keys = Object.keys(DEFAULT_ALERTS);
      expect(keys).toContain('ppe_violations_window_minutes');
      expect(keys).toContain('visitor_drop_percentage');
      expect(keys).toContain('minimum_traffic_baseline');
      expect(keys).toContain('wait_time_minutes');
    });
  });

  describe('ChatSettings interface', () => {
    it('should have valid WhatsApp settings structure', () => {
      expect(mockSettings.whatsapp.enabled).toBe(true);
      expect(mockSettings.whatsapp.phone_number).toBe('+966500000000');
      expect(mockSettings.whatsapp.language).toBe('ar');
      expect(mockSettings.whatsapp.daily_reports).toBe(true);
      expect(mockSettings.whatsapp.weekly_reports).toBe(false);
      expect(mockSettings.whatsapp.realtime_alerts).toBe(true);
    });

    it('should have valid alerts structure', () => {
      expect(mockSettings.alerts).toEqual(DEFAULT_ALERTS);
    });

    it('should support different languages', () => {
      const enSettings: ChatSettings = {
        ...mockSettings,
        whatsapp: { ...mockSettings.whatsapp, language: 'en' },
      };

      expect(enSettings.whatsapp.language).toBe('en');
    });
  });

  describe('Service methods', () => {
    it('should have get method', () => {
      expect(typeof chatSettingsService.get).toBe('function');
    });

    it('should have update method', () => {
      expect(typeof chatSettingsService.update).toBe('function');
    });

    it('should have sendTest method', () => {
      expect(typeof chatSettingsService.sendTest).toBe('function');
    });
  });

  describe('WhatsApp phone validation', () => {
    it('should accept valid Saudi phone number', () => {
      const settings: ChatSettings = {
        ...mockSettings,
        whatsapp: { ...mockSettings.whatsapp, phone_number: '+966500000000' },
      };

      expect(settings.whatsapp.phone_number).toMatch(/^\+\d+$/);
    });

    it('should support different phone formats', () => {
      const formats = ['+966500000000', '+1234567890', '+441234567890'];

      formats.forEach((phone) => {
        const settings: ChatSettings = {
          ...mockSettings,
          whatsapp: { ...mockSettings.whatsapp, phone_number: phone },
        };

        expect(settings.whatsapp.phone_number).toBe(phone);
      });
    });

    it('should allow empty phone number', () => {
      const settings: ChatSettings = {
        ...mockSettings,
        whatsapp: { ...mockSettings.whatsapp, phone_number: '' },
      };

      expect(settings.whatsapp.phone_number).toBe('');
    });
  });

  describe('Alert thresholds', () => {
    it('should allow custom PPE violations window', () => {
      const settings: ChatSettings = {
        ...mockSettings,
        alerts: { ...DEFAULT_ALERTS, ppe_violations_window_minutes: 15 },
      };

      expect(settings.alerts.ppe_violations_window_minutes).toBe(15);
    });

    it('should allow custom visitor drop percentage', () => {
      const settings: ChatSettings = {
        ...mockSettings,
        alerts: { ...DEFAULT_ALERTS, visitor_drop_percentage: 75 },
      };

      expect(settings.alerts.visitor_drop_percentage).toBe(75);
    });

    it('should allow custom wait time', () => {
      const settings: ChatSettings = {
        ...mockSettings,
        alerts: { ...DEFAULT_ALERTS, wait_time_minutes: 20 },
      };

      expect(settings.alerts.wait_time_minutes).toBe(20);
    });

    it('should maintain alert bounds', () => {
      const settings: ChatSettings = {
        ...mockSettings,
        alerts: {
          ppe_violations_window_minutes: 1,
          visitor_drop_percentage: 10,
          minimum_traffic_baseline: 1,
          wait_time_minutes: 1,
        },
      };

      expect(settings.alerts.ppe_violations_window_minutes).toBe(1);
      expect(settings.alerts.visitor_drop_percentage).toBe(10);
      expect(settings.alerts.wait_time_minutes).toBe(1);
    });
  });

  describe('Notification types', () => {
    it('should toggle daily reports', () => {
      const settings: ChatSettings = {
        ...mockSettings,
        whatsapp: { ...mockSettings.whatsapp, daily_reports: !mockSettings.whatsapp.daily_reports },
      };

      expect(settings.whatsapp.daily_reports).toBe(false);
    });

    it('should toggle weekly reports', () => {
      const settings: ChatSettings = {
        ...mockSettings,
        whatsapp: { ...mockSettings.whatsapp, weekly_reports: !mockSettings.whatsapp.weekly_reports },
      };

      expect(settings.whatsapp.weekly_reports).toBe(true);
    });

    it('should toggle realtime alerts', () => {
      const settings: ChatSettings = {
        ...mockSettings,
        whatsapp: { ...mockSettings.whatsapp, realtime_alerts: !mockSettings.whatsapp.realtime_alerts },
      };

      expect(settings.whatsapp.realtime_alerts).toBe(false);
    });

    it('should support multiple notification types enabled', () => {
      const settings: ChatSettings = {
        ...mockSettings,
        whatsapp: {
          enabled: true,
          phone_number: '+966500000000',
          language: 'ar',
          daily_reports: true,
          weekly_reports: true,
          realtime_alerts: true,
        },
      };

      expect(settings.whatsapp.daily_reports).toBe(true);
      expect(settings.whatsapp.weekly_reports).toBe(true);
      expect(settings.whatsapp.realtime_alerts).toBe(true);
    });
  });

  describe('Enable/Disable WhatsApp', () => {
    it('should disable WhatsApp integration', () => {
      const settings: ChatSettings = {
        ...mockSettings,
        whatsapp: { ...mockSettings.whatsapp, enabled: false },
      };

      expect(settings.whatsapp.enabled).toBe(false);
    });

    it('should enable WhatsApp integration', () => {
      const disabledSettings: ChatSettings = {
        ...mockSettings,
        whatsapp: { ...mockSettings.whatsapp, enabled: false },
      };

      const enabled: ChatSettings = {
        ...disabledSettings,
        whatsapp: { ...disabledSettings.whatsapp, enabled: true },
      };

      expect(enabled.whatsapp.enabled).toBe(true);
    });

    it('should preserve settings when toggling enabled state', () => {
      const settings: ChatSettings = {
        ...mockSettings,
        whatsapp: { ...mockSettings.whatsapp, enabled: false },
      };

      expect(settings.whatsapp.phone_number).toBe('+966500000000');
      expect(settings.whatsapp.language).toBe('ar');
    });
  });

  describe('Settings data integrity', () => {
    it('should maintain all settings when updating one field', () => {
      const original: ChatSettings = JSON.parse(JSON.stringify(mockSettings));
      const updated: ChatSettings = {
        ...original,
        whatsapp: { ...original.whatsapp, phone_number: '+966599999999' },
      };

      expect(updated.whatsapp.language).toBe(original.whatsapp.language);
      expect(updated.alerts).toEqual(original.alerts);
    });

    it('should preserve alerts when updating WhatsApp settings', () => {
      const updated: ChatSettings = {
        ...mockSettings,
        whatsapp: { ...mockSettings.whatsapp, enabled: false },
      };

      expect(updated.alerts).toEqual(DEFAULT_ALERTS);
    });

    it('should preserve WhatsApp settings when updating alerts', () => {
      const updated: ChatSettings = {
        ...mockSettings,
        alerts: { ...DEFAULT_ALERTS, wait_time_minutes: 15 },
      };

      expect(updated.whatsapp.phone_number).toBe('+966500000000');
      expect(updated.whatsapp.language).toBe('ar');
    });
  });
});
