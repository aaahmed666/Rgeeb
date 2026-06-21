import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEmployee, updateEmployee } from '@/services/organizationService';
import { apiFetch } from '@/lib/api';

vi.mock('@/lib/api');

function entries(fd: FormData): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, v] of fd.entries()) {
    (out[k] ??= []).push(String(v));
  }
  return out;
}
function dayValues(fd: FormData): string[] {
  const out: string[] = [];
  for (const [k, v] of fd.entries()) {
    if (/^working_hours\[\d+\]\[day\]$/.test(k)) out.push(String(v));
  }
  return out;
}

const workingHours = [
  { day: 'Sunday', is_day_off: false, start_time: '09:00', end_time: '17:00' },
  { day: 'Monday', is_day_off: false, start_time: '09:00', end_time: '17:00' },
  { day: 'Friday', is_day_off: true, start_time: '09:00', end_time: '17:00' },
];

const roledInput = {
  name: 'Test',
  email: 'test@example.com',
  role_id: '3',
  working_hours: workingHours,
};

describe('employee working_hours — parity with legacy project', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiFetch).mockResolvedValue({ data: {} });
  });

  it('lowercases day on create (backend rejects "Sunday")', async () => {
    await createEmployee(roledInput as never);
    const fd = vi.mocked(apiFetch).mock.calls[0][1]?.body as FormData;
    expect(dayValues(fd)).toEqual(['sunday', 'monday', 'friday']);
  });

  it('lowercases day on update', async () => {
    await updateEmployee('42', roledInput as never);
    const fd = vi.mocked(apiFetch).mock.calls[0][1]?.body as FormData;
    expect(dayValues(fd)).toEqual(['sunday', 'monday', 'friday']);
  });

  it('sends start_time/end_time for EVERY day, including days off', async () => {
    await createEmployee(roledInput as never);
    const fd = vi.mocked(apiFetch).mock.calls[0][1]?.body as FormData;
    const e = entries(fd);
    // 3 days → 3 start_time and 3 end_time entries (Friday is a day off)
    expect(e['working_hours[0][start_time]']).toEqual(['09:00']);
    expect(e['working_hours[2][is_day_off]']).toEqual(['1']);
    expect(e['working_hours[2][start_time]']).toEqual(['09:00']);
    expect(e['working_hours[2][end_time]']).toEqual(['17:00']);
  });

  it('defaults missing times to 09:00/17:00 (legacy fallback)', async () => {
    await createEmployee({
      ...roledInput,
      working_hours: [{ day: 'saturday', is_day_off: true }],
    } as never);
    const fd = vi.mocked(apiFetch).mock.calls[0][1]?.body as FormData;
    const e = entries(fd);
    expect(e['working_hours[0][start_time]']).toEqual(['09:00']);
    expect(e['working_hours[0][end_time]']).toEqual(['17:00']);
  });

  it('sends email when a role is assigned', async () => {
    await createEmployee(roledInput as never);
    const fd = vi.mocked(apiFetch).mock.calls[0][1]?.body as FormData;
    expect(fd.get('email')).toBe('test@example.com');
  });

  it('strips email/password for attendance-only employees (no role_id)', async () => {
    await createEmployee({
      name: 'NoRole',
      email: 'x@example.com',
      password: 'secret',
      working_hours: workingHours,
    } as never);
    const fd = vi.mocked(apiFetch).mock.calls[0][1]?.body as FormData;
    expect(fd.get('email')).toBeNull();
    expect(fd.get('password')).toBeNull();
  });
});
