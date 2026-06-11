/**
 * attendanceService unit tests
 * Tests: record mapping (nested employee/branch), dashboard normalisation,
 * multipart check-in when a photo is attached, plain JSON otherwise,
 * check-out contract.
 */

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import {
  checkIn,
  checkOut,
  fetchAttendanceDashboard,
  fetchAttendances,
} from "@/services/attendanceService";

const mockGet = (api as unknown as { get: jest.Mock }).get;
const mockPost = (api as unknown as { post: jest.Mock }).post;

beforeEach(() => jest.clearAllMocks());

describe("fetchAttendances", () => {
  it("maps API rows including nested employee/branch objects", async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 5,
          employee: { id: "e1", name: "Ahmed" },
          branch: { id: "b1", name: "Main Branch" },
          check_in: "2026-06-11T08:00:00Z",
          check_out: "2026-06-11T16:00:00Z",
          duration: 480,
          status: "present",
          date: "2026-06-11",
          face_verified: true,
        },
      ],
    });
    const [rec] = await fetchAttendances({ branch_id: "b1" });
    expect(mockGet).toHaveBeenCalledWith(endpoints.attendance.list, {
      query: { branch_id: "b1" },
    });
    expect(rec.id).toBe("5");
    expect(rec.employeeName).toBe("Ahmed");
    expect(rec.branchName).toBe("Main Branch");
    expect(rec.duration).toBe(480);
    expect(rec.faceVerified).toBe(true);
  });

  it("returns [] for an empty payload", async () => {
    mockGet.mockResolvedValue({});
    expect(await fetchAttendances()).toEqual([]);
  });
});

describe("fetchAttendanceDashboard", () => {
  it("normalises summary counters and recent records", async () => {
    mockGet.mockResolvedValue({
      data: {
        total_employees: 12,
        present: 9,
        absent: 2,
        late: 1,
        avg_duration: 430,
        recent: [{ id: 1, employee_name: "Sara", status: "present" }],
      },
    });
    const dash = await fetchAttendanceDashboard({ branch_id: "b1" });
    expect(dash.totalEmployees).toBe(12);
    expect(dash.presentToday).toBe(9);
    expect(dash.absentToday).toBe(2);
    expect(dash.lateToday).toBe(1);
    expect(dash.avgDuration).toBe(430);
    expect(dash.recentRecords[0].employeeName).toBe("Sara");
  });

  it("defaults all counters to 0 when missing", async () => {
    mockGet.mockResolvedValue({ data: {} });
    const dash = await fetchAttendanceDashboard();
    expect(dash).toMatchObject({
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      avgDuration: 0,
      recentRecords: [],
    });
  });
});

describe("checkIn", () => {
  it("sends multipart FormData when a photo is attached", async () => {
    mockPost.mockResolvedValue({ data: { id: 9, status: "present" } });
    const photo = new File(["x"], "face.jpg", { type: "image/jpeg" });
    await checkIn({ user_id: "u1", photo_file: photo, branch_id: "b1", notes: "on time" });

    const [url, body] = mockPost.mock.calls[0];
    expect(url).toBe(endpoints.attendance.checkIn);
    expect(body).toBeInstanceOf(FormData);
    const fd = body as FormData;
    expect(fd.get("user_id")).toBe("u1");
    expect(fd.get("photo_file")).toBe(photo);
    expect(fd.get("branch_id")).toBe("b1");
    expect(fd.get("notes")).toBe("on time");
  });

  it("sends plain JSON without a photo", async () => {
    mockPost.mockResolvedValue({ data: { id: 10 } });
    const rec = await checkIn({ user_id: "u2" });
    expect(mockPost).toHaveBeenCalledWith(endpoints.attendance.checkIn, {
      user_id: "u2",
      branch_id: undefined,
      notes: undefined,
    });
    expect(rec.id).toBe("10");
  });
});

describe("checkOut", () => {
  it("posts the attendance_id (API contract)", async () => {
    mockPost.mockResolvedValue({ data: { id: 9, check_out: "2026-06-11T16:00:00Z" } });
    const rec = await checkOut({ attendance_id: "9", notes: "done" });
    expect(mockPost).toHaveBeenCalledWith(endpoints.attendance.checkOut, {
      attendance_id: "9",
      notes: "done",
    });
    expect(rec.checkOut).toBe("2026-06-11T16:00:00Z");
  });
});
