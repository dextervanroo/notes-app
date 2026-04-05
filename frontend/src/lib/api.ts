const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// --- Token helpers ---

function getToken(key: "access_token" | "refresh_token"): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("access_token");
}

// --- Error class ---

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// --- Token refresh ---

async function tryRefresh(): Promise<boolean> {
  const refresh = getToken("refresh_token");
  if (!refresh) return false;
  const res = await fetch(`${API_BASE}/users/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  localStorage.setItem("access_token", data.access);
  if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
  return true;
}

// --- Core fetch wrapper ---

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken("access_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (!refreshed) {
      clearTokens();
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new ApiError(401, "Unauthorized");
    }
    const newToken = getToken("access_token");
    const retryHeaders = {
      ...headers,
      ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
    };
    const retry = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: retryHeaders,
    });
    if (!retry.ok) throw new ApiError(retry.status, await retry.text());
    if (retry.status === 204) return undefined as T;
    return retry.json();
  }

  if (!res.ok) throw new ApiError(res.status, await res.text());
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Auth ---

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/users/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  const { access, refresh } = await res.json();
  setTokens(access, refresh);
}

export async function register(data: {
  username: string;
  email: string;
  password: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/users/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
}

// --- Types ---

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

// --- Categories ---

export async function getCategories(sort: string = "name"): Promise<Category[]> {
  const qs = new URLSearchParams();
  qs.set("sort", sort);
  const query = `?${qs}`;
  const data = await apiFetch<Category[] | { results: Category[] }>(
    `/notes/categories/${query}`,
  );
  return Array.isArray(data) ? data : data.results;
}

export async function createCategory(name: string, color: string): Promise<Category> {
  return apiFetch<Category>("/notes/categories/", {
    method: "POST",
    body: JSON.stringify({ name, color }),
  });
}

// --- Notes ---

export interface NoteListParams {
  category?: string;
  name?: string;
}

export async function getNotes(params: NoteListParams = {}): Promise<Note[]> {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.name) qs.set("name", params.name);
  const query = qs.toString() ? `?${qs}` : "";
  const data = await apiFetch<Note[] | { results: Note[] }>(`/notes/${query}`);
  return Array.isArray(data) ? data : data.results;
}

export async function getNote(id: string): Promise<Note> {
  return apiFetch<Note>(`/notes/${id}/`);
}

export async function createNote(data: {
  title: string;
  body: string;
  categoryId: string;
}): Promise<Note> {
  return apiFetch<Note>("/notes/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateNote(
  id: string,
  data: { title?: string; body?: string; categoryId?: string },
): Promise<Note> {
  return apiFetch<Note>(`/notes/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteNote(id: string): Promise<void> {
  return apiFetch<void>(`/notes/${id}/`, { method: "DELETE" });
}

// --- Utils ---

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatFullDate(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
  return `${datePart} at ${timePart}`;
}
