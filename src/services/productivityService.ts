import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

export interface ProdFilters {
  dateFrom?: string;
  dateTo?: string;
}

export interface ProductivitySummary {
  overall_score: number; // 0-100
  attendance_rate: number; // %
  punctuality: number; // %
  present_today: number;
  total_employees: number;
}

export interface DepartmentRanking {
  id: string;
  name: string;
  employees: number;
  score: number; // 0-100
  attendance: number; // %
  punctuality: number; // %
  avg_hours: number;
}

export interface LeaderboardRow {
  punctuality_rate: number;
  id: string;
  name: string;
  email?: string;
  department?: string;
  initials?: string;
  rank: number;
  score: number;
  attendance: number;
  punctuality: number;
  avg_hours: number;
  late_count: number;
}

export interface EmployeeTimelineRow {
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  hours?: number;
  status: "present" | "absent" | "late" | "leave";
}

export interface EmployeeDetail {
  id: string;
  name: string;
  email?: string;
  department?: string;
  initials?: string;
  score: number;
  days_present: number;
  days_total: number;
  attendance_rate: number;
  punctuality: number;
  total_hours: number;
  timeline: EmployeeTimelineRow[];
}

// ---------- API response shapes (actual) ----------
interface ApiLeaderboardRow {
  overall_score?: number;
  attendance_rate?: number;
  punctuality_rate?: number;
  days_present?: number;
  days_absent?: number;
  late_arrivals?: number;
  avg_hours_per_day?: number;
  total_hours?: number;
  rank?: number;
  employee?: {
    id?: number | string;
    name?: string;
    department?: string;
    avatar?: string | null;
    initials?: string;
    email?: string;
  };
  // flat shape (fallback)
  id?: number | string;
  name?: string;
  department?: string;
  score?: number;
  attendance?: number;
  punctuality?: number;
  avg_hours?: number;
  late_count?: number;
  initials?: string;
}

interface ApiDepartmentRow {
  department?: string;
  name?: string;
  id?: string | number;
  employee_count?: number;
  employees?: number;
  avg_overall_score?: number;
  score?: number;
  avg_attendance_rate?: number;
  attendance?: number;
  avg_punctuality_rate?: number;
  punctuality?: number;
  avg_hours_per_day?: number;
  avg_hours?: number;
}

function normalizeLeaderboardRow(
  r: ApiLeaderboardRow,
  idx: number
): LeaderboardRow {
  const emp = r.employee ?? {};
  const id = String(emp.id ?? r.id ?? idx);
  const name = emp.name ?? r.name ?? "";
  return {
    id,
    name,
    email: r.employee?.email ?? undefined,
    department: emp.department ?? r.department ?? "Unassigned",
    initials:
      emp.initials ??
      r.initials ??
      (name ? name.slice(0, 1).toUpperCase() : "?"),
    rank: r.rank ?? idx + 1,
    score: r.overall_score ?? r.score ?? 0,
    attendance: r.attendance_rate ?? r.attendance ?? 0,
    punctuality: r.punctuality_rate ?? r.punctuality ?? 0,
    punctuality_rate: r.punctuality_rate ?? r.punctuality ?? 0,
    avg_hours: r.avg_hours_per_day ?? r.avg_hours ?? 0,
    late_count: r.late_arrivals ?? r.late_count ?? 0,
  };
}

function normalizeDepartmentRow(
  r: ApiDepartmentRow,
  idx: number
): DepartmentRanking {
  const name = r.department ?? r.name ?? "Unknown";
  return {
    id: String(r.id ?? r.department ?? idx),
    name,
    employees: r.employee_count ?? r.employees ?? 0,
    score: r.avg_overall_score ?? r.score ?? 0,
    attendance: r.avg_attendance_rate ?? r.attendance ?? 0,
    punctuality: r.avg_punctuality_rate ?? r.punctuality ?? 0,
    avg_hours: r.avg_hours_per_day ?? r.avg_hours ?? 0,
  };
}

const demoSummary: ProductivitySummary = {
  overall_score: 0,
  attendance_rate: 0,
  punctuality: 0,
  present_today: 0,
  total_employees: 6,
};

const demoDepartments: DepartmentRanking[] = [
  {
    id: "unassigned",
    name: "Unassigned",
    employees: 6,
    score: 0,
    attendance: 0,
    punctuality: 0,
    avg_hours: 0,
  },
];

const demoLeaderboard: LeaderboardRow[] = [
  {
    id: "1",
    name: "sales",
    email: "sales@rgeeb.com",
    department: "Unassigned",
    initials: "S",
    rank: 1,
    score: 0,
    attendance: 0,
    punctuality: 0,
    avg_hours: 0,
    late_count: 0,
    punctuality_rate: 0,
  },
  {
    id: "2",
    name: "Fatima Hassan",
    department: "Unassigned",
    initials: "F",
    rank: 2,
    score: 0,
    attendance: 0,
    punctuality: 0,
    avg_hours: 0,
    late_count: 0,
    punctuality_rate: 0,
  },
  {
    id: "3",
    name: "Khalid Omar",
    department: "Unassigned",
    initials: "K",
    rank: 3,
    score: 0,
    attendance: 0,
    punctuality: 0,
    avg_hours: 0,
    late_count: 0,
    punctuality_rate: 0,
  },
  {
    id: "4",
    name: "Ahmed Ali",
    department: "Unassigned",
    initials: "A",
    rank: 4,
    score: 0,
    attendance: 0,
    punctuality: 0,
    avg_hours: 0,
    late_count: 0,
    punctuality_rate: 0,
  },
  {
    id: "5",
    name: "Sara Mohammed",
    department: "Unassigned",
    initials: "S",
    rank: 5,
    score: 0,
    attendance: 0,
    punctuality: 0,
    avg_hours: 0,
    late_count: 0,
    punctuality_rate: 0,
  },
  {
    id: "6",
    name: "Abdullah Elshazly",
    department: "Unassigned",
    initials: "A",
    rank: 6,
    score: 0,
    attendance: 0,
    punctuality: 0,
    avg_hours: 0,
    late_count: 0,
    punctuality_rate: 0,
  },
];

const demoEmployeeDetail = (id: string): EmployeeDetail => {
  const emp = demoLeaderboard.find((e) => e.id === id) ?? demoLeaderboard[0];
  return {
    id: emp.id,
    name: emp.name,
    email:
      emp.email ??
      `${(emp.name ?? "employee").split(" ")[0].toLowerCase()}@rgeeb.com`,
    department: emp.department ?? "Unassigned",
    initials:
      emp.initials ?? (emp.name ? emp.name.slice(0, 1).toUpperCase() : "?"),
    score: 0,
    days_present: 0,
    days_total: 16,
    attendance_rate: 0,
    punctuality: 0,
    total_hours: 0,
    timeline: [],
  };
};

async function safe<T>(p: Promise<T>, fb: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fb;
  }
}
function q(f: ProdFilters, extra: Record<string, string | number> = {}) {
  const out: Record<string, string | number | undefined> = {
    date_from: f.dateFrom,
    date_to: f.dateTo,
    ...extra,
  };
  return out;
}
function unwrap<T>(r: T | { data: T }): T {
  return (
    r && typeof r === "object" && "data" in (r as object)
      ? (r as { data: T }).data
      : r
  ) as T;
}

/**
 * Total working days (Sun–Thu, the local business week — Fri/Sat are the
 * weekend) within [from, to] inclusive. When no range is selected, falls back
 * to the last two weeks (≈10 working days) so the "Days Present" denominator
 * reflects a real period instead of collapsing to 0 — matching the old project
 * (e.g. "0/10") rather than the broken "0/0".
 */
function workingDaysInPeriod(from?: string, to?: string): number {
  let start: Date;
  let end: Date;
  if (from && to) {
    start = new Date(`${from}T00:00:00`);
    end = new Date(`${to}T00:00:00`);
  } else {
    end = new Date();
    start = new Date();
    start.setDate(end.getDate() - 13); // last 14 calendar days
  }
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 0;
  }
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay(); // 0=Sun … 6=Sat
    if (day !== 5 && day !== 6) count += 1; // exclude Fri & Sat
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export const productivityService = {
  summary: (f: ProdFilters) =>
    safe(
      apiFetch<ProductivitySummary | { data: ProductivitySummary }>(
        endpoints.productivity.summary,
        { query: q(f) }
      ).then(unwrap),
      demoSummary
    ),
  leaderboard: (f: ProdFilters) =>
    safe(
      apiFetch<ApiLeaderboardRow[] | { data: ApiLeaderboardRow[] }>(
        endpoints.productivity.leaderboard,
        { query: q(f) }
      ).then((r) => {
        const rows = unwrap(r) as ApiLeaderboardRow[];
        return Array.isArray(rows)
          ? rows.map(normalizeLeaderboardRow)
          : demoLeaderboard;
      }),
      demoLeaderboard
    ),
  departments: (f: ProdFilters) =>
    safe(
      apiFetch<ApiDepartmentRow[] | { data: ApiDepartmentRow[] }>(
        endpoints.productivity.departments,
        { query: q(f) }
      ).then((r) => {
        const rows = unwrap(r) as ApiDepartmentRow[];
        return Array.isArray(rows)
          ? rows.map(normalizeDepartmentRow)
          : demoDepartments;
      }),
      demoDepartments
    ),
  employee: (id: string, f: ProdFilters) =>
    safe(
      apiFetch<unknown>(endpoints.productivity.employeeDetail(id), {
        query: q(f),
      }).then((r) => {
        // API may return the row in same shape as leaderboard (nested employee object)
        // or as a flat EmployeeDetail — normalize both
        const raw = unwrap(
          r as EmployeeDetail | { data: EmployeeDetail }
        ) as unknown as Record<string, unknown>;
        const emp = (raw.employee as Record<string, unknown> | undefined) ?? {};
        const name = String(emp.name ?? raw.name ?? "");
        const timeline = Array.isArray(raw.timeline)
          ? (raw.timeline as EmployeeDetail["timeline"])
          : [];
        const daysPresent = Number(raw.days_present ?? 0);
        const daysAbsent = Number(raw.days_absent ?? 0);
        // Denominator = total working days in the period.
        //   1. backend `days_total` when it provides one;
        //   2. present + absent when the employee has tracked days;
        //   3. otherwise the period length (timeline rows, else working days in
        //      the selected range, defaulting to the last two weeks).
        // Step 3 is the fix: an employee with no records used to fall through
        // to present+absent = 0 and render "0/0" instead of "0/10".
        const backendTotal = Number(
          raw.days_total ?? raw.total_days ?? raw.working_days ?? NaN
        );
        const trackedDays = daysPresent + daysAbsent;
        const daysTotal = Math.max(
          Number.isFinite(backendTotal) && backendTotal > 0
            ? backendTotal
            : trackedDays > 0
              ? trackedDays
              : timeline.length ||
                workingDaysInPeriod(f.dateFrom, f.dateTo),
          daysPresent
        );
        const detail: EmployeeDetail = {
          id: String(emp.id ?? raw.id ?? id),
          name,
          email: String(emp.email ?? raw.email ?? ""),
          department: String(emp.department ?? raw.department ?? "Unassigned"),
          initials: String(
            emp.initials ??
              raw.initials ??
              (name ? name.slice(0, 1).toUpperCase() : "?")
          ),
          score: Number(raw.overall_score ?? raw.score ?? 0),
          days_present: daysPresent,
          days_total: daysTotal,
          attendance_rate: Number(raw.attendance_rate ?? raw.attendance ?? 0),
          punctuality: Number(raw.punctuality_rate ?? raw.punctuality ?? 0),
          total_hours: Number(raw.total_hours ?? raw.avg_hours_per_day ?? 0),
          timeline,
        };
        return detail;
      }),
      demoEmployeeDetail(id)
    ),
};
