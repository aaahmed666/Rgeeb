/**
 * Lookups service — wraps the public reference endpoints used by the
 * registration wizard (countries, cities, business categories, packages).
 */
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";

interface Envelope<T> {
  status?: boolean;
  message?: string;
  data?: T | { data?: T };
}

function unwrap<T>(raw: Envelope<T>): T {
  const d = raw?.data as unknown;
  if (d && typeof d === "object" && "data" in (d as Record<string, unknown>)) {
    const inner = (d as { data?: T }).data;
    if (inner !== undefined) return inner;
  }
  return (raw?.data ?? []) as T;
}

export interface Country {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  code?: string;
}

export interface City {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  country_id?: string;
}

export interface Category {
  id: number | string;
  name?: string;
  name_ar?: string;
  name_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  image?: string | null;
}

export interface PackageItem {
  id: number | string;
  name?: string;
  name_ar?: string;
  name_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  price?: number | string;
  duration?: number | string;
  duration_unit?: string;
  category_id?: number | string;
}

export async function fetchCountries(): Promise<Country[]> {
  const raw = await apiFetch<Envelope<Country[]>>(endpoints.lookups.countries);
  return unwrap<Country[]>(raw) ?? [];
}

export async function fetchCities(countryId: string | number): Promise<City[]> {
  const raw = await apiFetch<Envelope<City[]>>(endpoints.lookups.cities, {
    query: { country_id: countryId },
  });
  return unwrap<City[]>(raw) ?? [];
}

export async function fetchCategories(): Promise<Category[]> {
  const raw = await apiFetch<Envelope<Category[]>>(endpoints.lookups.categories);
  return unwrap<Category[]>(raw) ?? [];
}

export async function fetchPackages(params?: { all?: boolean; category_id?: string | number }): Promise<PackageItem[]> {
  const query: Record<string, string | number | boolean | undefined> = {};
  if (params?.all) query.all = 1;
  if (params?.category_id) query.category_id = params.category_id;
  const raw = await apiFetch<Envelope<PackageItem[]>>(endpoints.lookups.packages, { query });
  return unwrap<PackageItem[]>(raw) ?? [];
}
