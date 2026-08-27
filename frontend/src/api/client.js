/**
 * API client for the Beta Sigma backend.
 *
 * All fetch calls go through this module so base URLs, error handling,
 * and response parsing live in one place.
 *
 * Two categories of helpers:
 *   Public  — no auth header, used by the public-facing pages
 *   Admin   — include Authorization: Bearer <token>, used by admin pages
 */

// In development, Vite proxies /api and /media to localhost:8000.
// In production, set VITE_API_URL to your deployed backend origin.
const API_BASE = import.meta.env.VITE_API_URL || "";

// -------------------------------------------------------------------------- //
// Low-level helpers
// -------------------------------------------------------------------------- //

/** GET with optional auth token. */
async function apiGet(endpoint, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API_BASE}${endpoint}`, { headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${response.status}`);
  }
  return response.json();
}

/** POST JSON body with optional auth token. */
async function apiPost(endpoint, body, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${response.status}`);
  }
  return response.json();
}

/** POST multipart FormData (for file uploads). No Content-Type header — browser sets it. */
async function apiPostForm(endpoint, formData, token) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${response.status}`);
  }
  return response.json();
}

/** PUT JSON body with auth token. */
async function apiPut(endpoint, body, token) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${response.status}`);
  }
  return response.json();
}

/** PUT multipart FormData (for file + field updates). */
async function apiPutForm(endpoint, formData, token) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${response.status}`);
  }
  return response.json();
}

/** DELETE with auth token. Returns true on 204. */
async function apiDelete(endpoint, token) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${response.status}`);
  }
  return true;
}

// -------------------------------------------------------------------------- //
// Public API — no auth needed
// -------------------------------------------------------------------------- //

export const fetchMembersByPledgeClass = () => apiGet("/api/members/by-pledge-class");
export const fetchEvents = () => apiGet("/api/events");
export const fetchAnnouncements = (featuredOnly = false) =>
  apiGet(`/api/announcements${featuredOnly ? "?featured_only=true" : ""}`);
export const fetchRushInfo = () => apiGet("/api/rush");
export const fetchChapterInfo = () => apiGet("/api/about");
export const fetchGallery = (category = null) =>
  apiGet(`/api/gallery${category ? `?category=${category}` : ""}`);
export const fetchGalleryByYear = () => apiGet("/api/gallery/by-year");
export const fetchPledgeClasses = (year = null) =>
  apiGet(`/api/gallery/pledge-classes${year ? `?year=${year}` : ""}`);
export const fetchPledgeYears = () => apiGet("/api/gallery/pledge-classes/years");
export const fetchDonateInfo = () => apiGet("/api/gallery/donate-info");
export const fetchContactInfo = () => apiGet("/api/contact/info");

export const submitContactMessage = (data) => apiPost("/api/contact", data);

// -------------------------------------------------------------------------- //
// Auth
// -------------------------------------------------------------------------- //

/** POST the admin password and return { token, expires_in_hours }. */
export const adminLogin = (password) =>
  apiPost("/api/auth/login", { password });

// -------------------------------------------------------------------------- //
// Admin — Members
// -------------------------------------------------------------------------- //

export const adminGetMembers = (token) => apiGet("/api/admin/members", token);

/** Create a member. data is a plain object; photo is an optional File. */
export function adminCreateMember(data, photo, token) {
  const fd = new FormData();
  // Array fields (e.g. roles) are JSON-encoded so the backend can parse a
  // real list back out instead of FormData's default comma-joined string.
  Object.entries(data).forEach(([k, v]) => fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v));
  if (photo) fd.append("photo", photo);
  return apiPostForm("/api/admin/members", fd, token);
}

/** Update a member. Only include fields you want to change. */
export function adminUpdateMember(id, data, photo, token) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v);
  });
  if (photo) fd.append("photo", photo);
  return apiPutForm(`/api/admin/members/${id}`, fd, token);
}

export const adminDeleteMember = (id, token) =>
  apiDelete(`/api/admin/members/${id}`, token);

// -------------------------------------------------------------------------- //
// Admin — Events
// -------------------------------------------------------------------------- //

export const adminGetEvents = (token) => apiGet("/api/admin/events", token);
export const adminCreateEvent = (data, token) => apiPost("/api/admin/events", data, token);
export const adminUpdateEvent = (id, data, token) => apiPut(`/api/admin/events/${id}`, data, token);
export const adminDeleteEvent = (id, token) => apiDelete(`/api/admin/events/${id}`, token);

// -------------------------------------------------------------------------- //
// Admin — Announcements
// -------------------------------------------------------------------------- //

export const adminGetAnnouncements = (token) => apiGet("/api/admin/announcements", token);
export const adminCreateAnnouncement = (data, token) => apiPost("/api/admin/announcements", data, token);
export const adminUpdateAnnouncement = (id, data, token) => apiPut(`/api/admin/announcements/${id}`, data, token);
export const adminDeleteAnnouncement = (id, token) => apiDelete(`/api/admin/announcements/${id}`, token);

// -------------------------------------------------------------------------- //
// Admin — Gallery (year folders under media/gallery/)
// -------------------------------------------------------------------------- //

export const adminGetGalleryYears = (token) => apiGet("/api/admin/gallery/years", token);

export const adminCreateGalleryYear = (folder, token) =>
  apiPost("/api/admin/gallery/years", { folder }, token);

export const adminGetGalleryPhotos = (folder, token) =>
  apiGet(`/api/admin/gallery/years/${folder}/photos`, token);

/** Upload a new photo/video (a File or cropped Blob) to a year folder. */
export function adminUploadGalleryPhoto(folder, file, token) {
  const fd = new FormData();
  // Cropped photos arrive as a plain Blob (no .name), which FormData would
  // otherwise send with the filename "blob" — the backend needs a real
  // extension to know it's a photo, so give it one explicitly.
  fd.append("file", file, file.name || "upload.jpg");
  return apiPostForm(`/api/admin/gallery/years/${folder}/photos`, fd, token);
}

/** Overwrite an existing photo's bytes in place (used to save a crop). */
export function adminReplaceGalleryPhoto(folder, filename, file, token) {
  const fd = new FormData();
  fd.append("file", file, file.name || "upload.jpg");
  return apiPutForm(`/api/admin/gallery/years/${folder}/photos/${filename}`, fd, token);
}

export const adminDeleteGalleryPhoto = (folder, filename, token) =>
  apiDelete(`/api/admin/gallery/years/${folder}/photos/${filename}`, token);

// -------------------------------------------------------------------------- //
// Admin — Pledge Classes
// -------------------------------------------------------------------------- //

export const adminGetPledgeMedia = (token) => apiGet("/api/admin/pledge-classes", token);
export const adminGetPledgeYears = (token) => apiGet("/api/admin/pledge-classes/years", token);

export function adminUploadPledgeMedia(data, file, token) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.append(k, v));
  fd.append("file", file);
  return apiPostForm("/api/admin/pledge-classes", fd, token);
}

export const adminDeletePledgeMedia = (id, token) =>
  apiDelete(`/api/admin/pledge-classes/${id}`, token);

// -------------------------------------------------------------------------- //
// Admin — Donate Info
// -------------------------------------------------------------------------- //

export const adminGetDonateInfo = (token) => apiGet("/api/admin/donate", token);
export const adminUpdateDonateInfo = (data, token) => apiPut("/api/admin/donate", data, token);

// -------------------------------------------------------------------------- //
// Admin — Contact Info (Contact page's president name/email)
// -------------------------------------------------------------------------- //

export const adminGetContactInfo = (token) => apiGet("/api/admin/contact", token);
export const adminUpdateContactInfo = (data, token) => apiPut("/api/admin/contact", data, token);
