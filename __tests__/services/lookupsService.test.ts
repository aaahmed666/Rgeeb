/**
 * lookupsService unit tests
 * Tests: envelope unwrapping ({data}, {data:{data}}), query construction
 * for cities / categories / packages, empty fallbacks.
 */

jest.mock("@/lib/api", () => ({ apiFetch: jest.fn() }));

import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import {
  fetchCategories,
  fetchCities,
  fetchCountries,
  fetchPackages,
} from "@/services/lookupsService";

const mockFetch = apiFetch as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("fetchCountries", () => {
  it("unwraps a single data envelope", async () => {
    mockFetch.mockResolvedValue({ data: [{ id: "1", name: "Egypt" }] });
    const res = await fetchCountries();
    expect(mockFetch).toHaveBeenCalledWith(endpoints.lookups.countries);
    expect(res).toEqual([{ id: "1", name: "Egypt" }]);
  });

  it("unwraps a nested data.data envelope", async () => {
    mockFetch.mockResolvedValue({
      data: { data: [{ id: "2", name: "Saudi Arabia" }] },
    });
    expect(await fetchCountries()).toEqual([{ id: "2", name: "Saudi Arabia" }]);
  });

  it("returns [] when the payload is empty", async () => {
    mockFetch.mockResolvedValue({});
    expect(await fetchCountries()).toEqual([]);
  });
});

describe("fetchCities", () => {
  it("passes the country filter in the query", async () => {
    mockFetch.mockResolvedValue({ data: [{ id: "c1", name: "Cairo" }] });
    const res = await fetchCities("1");
    expect(mockFetch).toHaveBeenCalledWith(endpoints.lookups.cities, {
      query: { country_id: "1" },
    });
    expect(res).toHaveLength(1);
  });
});

describe("fetchCategories", () => {
  it("omits lang when not provided", async () => {
    mockFetch.mockResolvedValue({ data: [] });
    await fetchCategories();
    expect(mockFetch).toHaveBeenCalledWith(endpoints.lookups.categories, { query: {} });
  });

  it("sends lang when provided", async () => {
    mockFetch.mockResolvedValue({ data: [{ id: 1, name_ar: "مطاعم" }] });
    const res = await fetchCategories("ar");
    expect(mockFetch).toHaveBeenCalledWith(endpoints.lookups.categories, {
      query: { lang: "ar" },
    });
    expect(res[0].name_ar).toBe("مطاعم");
  });
});

describe("fetchPackages", () => {
  it("requests all packages with all=1", async () => {
    mockFetch.mockResolvedValue({ data: [] });
    await fetchPackages({ all: true });
    expect(mockFetch).toHaveBeenCalledWith(endpoints.lookups.packages, {
      query: { all: 1 },
    });
  });

  it("filters by category", async () => {
    mockFetch.mockResolvedValue({ data: [{ id: 9, name: "Pro" }] });
    const res = await fetchPackages({ category_id: 3 });
    expect(mockFetch).toHaveBeenCalledWith(endpoints.lookups.packages, {
      query: { category_id: 3 },
    });
    expect(res).toEqual([{ id: 9, name: "Pro" }]);
  });

  it("sends an empty query without params", async () => {
    mockFetch.mockResolvedValue({ data: { data: [] } });
    expect(await fetchPackages()).toEqual([]);
    expect(mockFetch).toHaveBeenCalledWith(endpoints.lookups.packages, { query: {} });
  });
});
