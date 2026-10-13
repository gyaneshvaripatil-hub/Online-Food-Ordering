// auth.js — login/session helpers
// Change API_BASE to your backend URL.
export const API_BASE = "http://localhost:3000/api";

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

export function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
        return null;
    }
}

export function isLoggedIn() {
    return Boolean(getToken());
}

// UI-only check. The backend MUST also enforce this on every admin endpoint.
export function isAdmin() {
    return getUser()?.role === "admin";
}

export function logout() {
    clearSession();
    window.location.reload();
}

export async function login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Login failed");

    // Expected response: { token: "...", user: { id, name, email, role } }
    saveSession(data.token, data.user);
    return data.user;
}

// fetch wrapper that sends the token and handles auth errors
export async function authFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            Authorization: `Bearer ${getToken()}`
        }
    });

    if (res.status === 401) {
        clearSession();
        window.location.reload();
        throw new Error("Session expired. Please log in again.");
    }
    if (res.status === 403) {
        throw new Error("You are not allowed to do this.");
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
}
