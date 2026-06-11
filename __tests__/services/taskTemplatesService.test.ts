/**
 * taskTemplatesService unit tests
 * Tests: list mapping (snake/camel/alias keys, defaults), create, delete,
 * useTemplate id extraction.
 */

jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import {
  createTaskTemplate,
  deleteTaskTemplate,
  fetchTaskTemplates,
  useTemplate,
  type TaskTemplateInput,
} from "@/services/taskTemplatesService";

const mockFetch = apiFetch as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("fetchTaskTemplates", () => {
  it("maps snake_case API rows to the UI model", async () => {
    mockFetch.mockResolvedValue({
      data: [
        {
          id: 7,
          name_en: "Daily cleaning",
          name_ar: "تنظيف يومي",
          category: "Cleaning",
          priority: "HIGH",
          estimated_hours: "2.5",
          title_template: "Clean {branch}",
          used_count: 14,
        },
      ],
    });
    const [tpl] = await fetchTaskTemplates();
    expect(mockFetch).toHaveBeenCalledWith(endpoints.taskTemplates.list);
    expect(tpl).toEqual({
      id: "7",
      nameEn: "Daily cleaning",
      nameAr: "تنظيف يومي",
      description: undefined,
      category: "cleaning",
      priority: "high",
      estimatedHours: 2.5,
      titleTemplate: "Clean {branch}",
      usedCount: 14,
      icon: undefined,
    });
  });

  it("applies defaults for missing category/priority and alias count keys", async () => {
    mockFetch.mockResolvedValue({
      data: [{ id: 1, name: "Fallback name", usage_count: 3 }],
    });
    const [tpl] = await fetchTaskTemplates();
    expect(tpl.nameEn).toBe("Fallback name");
    expect(tpl.category).toBe("other");
    expect(tpl.priority).toBe("medium");
    expect(tpl.usedCount).toBe(3);
    expect(tpl.estimatedHours).toBe(0);
  });

  it("accepts a bare array response and returns [] otherwise", async () => {
    mockFetch.mockResolvedValue([{ id: 2, name_en: "Bare" }]);
    expect((await fetchTaskTemplates())[0].nameEn).toBe("Bare");

    mockFetch.mockResolvedValue({ unexpected: true });
    expect(await fetchTaskTemplates()).toEqual([]);
  });
});

describe("createTaskTemplate", () => {
  it("POSTs the input and maps the created row", async () => {
    const input: TaskTemplateInput = {
      name_en: "Stock check",
      category: "inventory",
      priority: "medium",
      estimated_hours: 1,
      title_template: "Check stock at {branch}",
    };
    mockFetch.mockResolvedValue({ data: { id: 11, name_en: "Stock check", category: "inventory", priority: "medium", estimated_hours: 1, title_template: "Check stock at {branch}", used_count: 0 } });
    const tpl = await createTaskTemplate(input);
    expect(mockFetch).toHaveBeenCalledWith(endpoints.taskTemplates.list, {
      method: "POST",
      body: input,
    });
    expect(tpl.id).toBe("11");
    expect(tpl.category).toBe("inventory");
  });
});

describe("deleteTaskTemplate", () => {
  it("DELETEs the dynamic route", async () => {
    mockFetch.mockResolvedValue({});
    await deleteTaskTemplate("11");
    expect(mockFetch).toHaveBeenCalledWith(endpoints.taskTemplates.delete("11"), {
      method: "DELETE",
    });
  });
});

describe("useTemplate", () => {
  it("returns the created task id from `id`", async () => {
    mockFetch.mockResolvedValue({ data: { id: "t-99" } });
    const res = await useTemplate("11", { branch_id: "b1" });
    expect(mockFetch).toHaveBeenCalledWith(endpoints.taskTemplates.use("11"), {
      method: "POST",
      body: { branch_id: "b1" },
    });
    expect(res).toEqual({ taskId: "t-99" });
  });

  it("falls back to `task_id` and tolerates an empty payload", async () => {
    mockFetch.mockResolvedValue({ data: { task_id: "t-100" } });
    expect(await useTemplate("11", {})).toEqual({ taskId: "t-100" });

    mockFetch.mockResolvedValue(null);
    expect(await useTemplate("11", {})).toEqual({ taskId: undefined });
  });
});
