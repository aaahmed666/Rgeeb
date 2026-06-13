/**
 * productivityService unit tests
 * Tests: both nested (employee obj) and flat API shapes, demo fallback, normalizers
 */

jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));
jest.mock("@/lib/endpoints", () => ({
  endpoints: {
    productivity: {
      summary:        "/customer/productivity/summary",
      leaderboard:    "/customer/productivity/leaderboard",
      departments:    "/customer/productivity/departments",
      employeeDetail: (id: string) => `/customer/productivity/employee/${id}`,
    },
  },
}));

import { apiFetch } from "@/lib/api";
import { productivityService } from "@/services/productivityService";

const mockFetch = apiFetch as jest.Mock;

// Nested employee-object shape (real API)
const NESTED_LEADERBOARD = [
  {
    rank: 1,
    overall_score: 88,
    attendance_rate: 95,
    punctuality_rate: 90,
    late_arrivals: 2,
    avg_hours_per_day: 7.5,
    employee: { id: "101", name: "Ahmed Ali", department: "IT", email: "ahmed@co.com", initials: "A" },
  },
  {
    rank: 2,
    overall_score: 75,
    attendance_rate: 80,
    punctuality_rate: 77,
    late_arrivals: 5,
    avg_hours_per_day: 7.0,
    employee: { id: "102", name: "Sara Omar", department: "HR", initials: "S" },
  },
];

// Flat shape (fallback)
const FLAT_LEADERBOARD = [
  { id: "201", name: "Khalid", department: "Finance", rank: 1, score: 91, attendance: 98, punctuality: 94, avg_hours: 8, late_count: 1 },
];

const DEPARTMENTS_RAW = [
  { id: "d1", name: "IT",      employee_count: 10, avg_overall_score: 85, avg_attendance_rate: 92, avg_punctuality_rate: 88, avg_hours_per_day: 7.5 },
  { id: "d2", name: "HR",      employee_count: 6,  avg_overall_score: 72, avg_attendance_rate: 80, avg_punctuality_rate: 75, avg_hours_per_day: 7.0 },
];

const SUMMARY_RAW = {
  overall_score: 82,
  attendance_rate: 90,
  punctuality: 88,
  present_today: 12,
  total_employees: 15,
};

beforeEach(() => jest.clearAllMocks());

// ─── summary ───────────────────────────────────────────────────────────────────

describe("productivityService.summary", () => {
  test("returns mapped summary from API", async () => {
    mockFetch.mockResolvedValue(SUMMARY_RAW);
    const s = await productivityService.summary({});
    expect(s.overall_score).toBe(82);
    expect(s.attendance_rate).toBe(90);
    expect(s.present_today).toBe(12);
    expect(s.total_employees).toBe(15);
  });

  test("returns demo summary on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    const s = await productivityService.summary({});
    expect(s).toHaveProperty("overall_score");
    expect(s).toHaveProperty("total_employees");
    expect(typeof s.overall_score).toBe("number");
  });
});

// ─── leaderboard ──────────────────────────────────────────────────────────────

describe("productivityService.leaderboard", () => {
  test("normalises nested employee-object shape", async () => {
    mockFetch.mockResolvedValue({ data: NESTED_LEADERBOARD });
    const rows = await productivityService.leaderboard({});
    expect(rows.length).toBe(2);
    const ahmed = rows.find(r => r.name === "Ahmed Ali");
    expect(ahmed).toBeDefined();
    expect(ahmed?.id).toBe("101");
    expect(ahmed?.rank).toBe(1);
    expect(ahmed?.score).toBe(88);
    expect(ahmed?.attendance).toBe(95);
    expect(ahmed?.late_count).toBe(2);
  });

  test("normalises flat shape", async () => {
    mockFetch.mockResolvedValue({ data: FLAT_LEADERBOARD });
    const rows = await productivityService.leaderboard({});
    expect(rows[0].id).toBe("201");
    expect(rows[0].name).toBe("Khalid");
    expect(rows[0].score).toBe(91);
  });

  test("assigns initials from employee object when provided", async () => {
    mockFetch.mockResolvedValue({ data: NESTED_LEADERBOARD });
    const rows = await productivityService.leaderboard({});
    expect(rows[0].initials).toBe("A");
  });

  test("generates initials from name when not provided", async () => {
    mockFetch.mockResolvedValue({ data: [
      { rank: 1, overall_score: 70, attendance_rate: 80, punctuality_rate: 75,
        late_arrivals: 0, avg_hours_per_day: 7,
        employee: { id: "999", name: "Fatima Hassan" } }
    ]});
    const rows = await productivityService.leaderboard({});
    expect(rows[0].initials).toBe("F");
  });

  test("each row has all required fields", async () => {
    mockFetch.mockResolvedValue({ data: NESTED_LEADERBOARD });
    const rows = await productivityService.leaderboard({});
    const required = ["id","name","rank","score","attendance","punctuality","avg_hours","late_count"];
    for (const row of rows) {
      for (const k of required) expect(row).toHaveProperty(k);
    }
  });

  test("returns demo leaderboard on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    const rows = await productivityService.leaderboard({});
    expect(rows.length).toBeGreaterThan(0);
  });
});

// ─── departments ──────────────────────────────────────────────────────────────

describe("productivityService.departments", () => {
  test("normalises department rows", async () => {
    mockFetch.mockResolvedValue({ data: DEPARTMENTS_RAW });
    const depts = await productivityService.departments({});
    expect(depts.length).toBe(2);
    const it = depts.find(d => d.name === "IT");
    expect(it?.employees).toBe(10);
    expect(it?.score).toBe(85);
    expect(it?.attendance).toBe(92);
    expect(it?.avg_hours).toBe(7.5);
  });

  test("uses alternative field names (name, employees, score)", async () => {
    mockFetch.mockResolvedValue([
      { name: "Operations", employees: 8, score: 68, attendance: 74, punctuality: 70, avg_hours: 6.5 }
    ]);
    const depts = await productivityService.departments({});
    expect(depts[0].name).toBe("Operations");
    expect(depts[0].employees).toBe(8);
  });

  test("returns demo on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    const depts = await productivityService.departments({});
    expect(depts.length).toBeGreaterThan(0);
  });
});

// ─── employee detail ──────────────────────────────────────────────────────────

describe("productivityService.employee", () => {
  const EMPLOYEE_DETAIL = {
    employee: { id: "101", name: "Ahmed Ali", department: "IT", email: "ahmed@co.com" },
    overall_score: 88,
    days_present: 18,
    days_absent: 2,
    attendance_rate: 90,
    punctuality_rate: 88,
    total_hours: 135,
    timeline: [
      { date: "2026-05-01", check_in: "09:00", check_out: "17:00", hours: 8, status: "present" },
      { date: "2026-05-02", check_in: "09:30", check_out: "17:00", hours: 7.5, status: "late" },
    ],
  };

  test("normalises nested employee shape", async () => {
    mockFetch.mockResolvedValue({ data: EMPLOYEE_DETAIL });
    const emp = await productivityService.employee("101", {});
    expect(emp.id).toBe("101");
    expect(emp.name).toBe("Ahmed Ali");
    expect(emp.score).toBe(88);
    expect(emp.days_present).toBe(18);
    expect(emp.attendance_rate).toBe(90);
    expect(emp.total_hours).toBe(135);
  });

  test("computes days_total = days_present + days_absent when not provided", async () => {
    mockFetch.mockResolvedValue({ data: EMPLOYEE_DETAIL });
    const emp = await productivityService.employee("101", {});
    expect(emp.days_total).toBe(20); // 18 + 2
  });

  test("falls back to the period (10 working days) when the employee has no records", async () => {
    // No days_total, no tracked days, empty timeline — used to render "0/0".
    // The denominator should now reflect the period: any 14-day window has
    // exactly 10 Sun–Thu working days, matching the old project's "0/10".
    mockFetch.mockResolvedValue({
      data: {
        employee: { id: "7", name: "sales", email: "sales@rgeeb.com" },
        days_present: 0,
        days_absent: 0,
        attendance_rate: 0,
        punctuality_rate: 0,
        total_hours: 0,
        timeline: [],
      },
    });
    const emp = await productivityService.employee("7", {});
    expect(emp.days_present).toBe(0);
    expect(emp.days_total).toBe(10);
  });

  test("uses working days within an explicitly selected range", async () => {
    mockFetch.mockResolvedValue({
      data: {
        employee: { id: "7", name: "sales" },
        days_present: 0,
        days_absent: 0,
        timeline: [],
      },
    });
    // 2026-06-01 (Mon) .. 2026-06-14 (Sun) = two weeks = 10 working days.
    const emp = await productivityService.employee("7", {
      dateFrom: "2026-06-01",
      dateTo: "2026-06-14",
    });
    expect(emp.days_total).toBe(10);
  });

  test("respects a backend-provided days_total", async () => {
    mockFetch.mockResolvedValue({
      data: {
        employee: { id: "7", name: "sales" },
        days_present: 3,
        days_absent: 0,
        days_total: 22,
        timeline: [],
      },
    });
    const emp = await productivityService.employee("7", {});
    expect(emp.days_total).toBe(22);
  });

  test("includes timeline rows with correct shape", async () => {
    mockFetch.mockResolvedValue({ data: EMPLOYEE_DETAIL });
    const emp = await productivityService.employee("101", {});
    expect(emp.timeline.length).toBe(2);
    expect(emp.timeline[0].status).toBe("present");
    expect(emp.timeline[1].status).toBe("late");
  });

  test("returns demo detail on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    const emp = await productivityService.employee("999", {});
    expect(emp.id).toBeDefined();
    expect(emp.name).toBeDefined();
    expect(typeof emp.score).toBe("number");
  });
});
