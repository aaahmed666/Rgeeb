import { describe, it, expect } from 'vitest';
import { canAccess } from '@/lib/permissions';
const base = { isAdmin: false, rbacProvided: true };

describe('foodics per-child parity', () => {
  const cases: Array<[string, string]> = [
    ['foodics_connection', 'foodics.connect'],
    ['foodics_orders', 'foodics.orders.read'],
    ['foodics_refund', 'foodics.refund_verifications.read'],
    ['foodics_cash_drawer', 'foodics.drawer_audits.read'],
    ['foodics_prep_time', 'foodics.prep_times.read'],
    ['foodics_footfall', 'foodics.conversion.read'],
    ['foodics_inventory', 'foodics.inventory.zones.read'],
    ['foodics_dashboard', 'foodics.dashboard.read'],
    ['foodics_health', 'foodics.dashboard.read'],
  ];
  it.each(cases)('child %s visible with grant %s', (key, grant) => {
    expect(canAccess(key, { ...base, userPerms: [grant] })).toBe(true);
  });
  it('orders child hidden when only dashboard granted', () => {
    expect(canAccess('foodics_orders', { ...base, userPerms: ['foodics.dashboard.read'] })).toBe(false);
  });
  it('parent group visible with any single child grant', () => {
    expect(canAccess('foodics', { ...base, userPerms: ['foodics.prep_times.read'] })).toBe(true);
  });
});
