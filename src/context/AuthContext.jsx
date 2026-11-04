import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const AuthContext = createContext(null);
const AUTH_SESSION_KEY = "yoda-admin-auth-session";
const AUTH_CREDENTIALS_KEY = "yoda-admin-auth-credentials";
const ADMIN_CREDENTIALS_REF = doc(db, "settings", "admin");
const PBKDF2_ITERATIONS = 210000;
const INACTIVITY_TIMEOUT = 10 * 60 * 1000;
const authApiUrl = import.meta.env.VITE_ADMIN_API_URL?.replace(/\/$/, "");

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function hashPassword(password, salt) {
  if (!globalThis.crypto?.subtle) throw new Error("Secure password verification is unavailable in this browser.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return bytesToBase64(new Uint8Array(bits));
}

async function createCredentialRecord(username, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return {
    username,
    salt: bytesToBase64(salt),
    passwordHash: await hashPassword(password, salt),
    iterations: PBKDF2_ITERATIONS,
  };
}

function isCredentialRecord(record) {
  return typeof record?.username === "string"
    && typeof record?.salt === "string"
    && typeof record?.passwordHash === "string";
}

async function getAdminCredentials() {
  const snapshot = await getDoc(ADMIN_CREDENTIALS_REF);
  if (!snapshot.exists()) return null;

  const credentials = snapshot.data();
  if (!isCredentialRecord(credentials)) {
    throw new Error("Stored administrator credentials are invalid.");
  }
  return credentials;
}

function matchesHash(left, right) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

function readDemoSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null");
    const lastActivityAt = Number(stored?.lastActivityAt ?? stored?.issuedAt);
    if (stored?.token && stored?.user?.username && Date.now() - lastActivityAt < INACTIVITY_TIMEOUT) {
      return stored.user;
    }
    if (stored) localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        if (authApiUrl) {
          const response = await fetch(`${authApiUrl}/auth/session`, { credentials: "include" });
          if (response.status === 401) return;
          if (!response.ok) throw new Error(`Authentication service unavailable (HTTP ${response.status}).`);
          const result = await response.json();
          if (active && result?.user?.username) setUser(result.user);
          return;
        }

        let credentials = await getAdminCredentials();
        if (!credentials) {
          const cachedCredentials = JSON.parse(localStorage.getItem(AUTH_CREDENTIALS_KEY) || "null");
          credentials = isCredentialRecord(cachedCredentials)
            ? cachedCredentials
            : await createCredentialRecord("admin", "admin1234");
          credentials.fullName ||= "Administrator";
          credentials.email ||= "admin@yodapro.com";
          await setDoc(ADMIN_CREDENTIALS_REF, credentials);
          localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(credentials));
        }
        if (active) setUser(readDemoSession());
      } catch (error) {
        if (active) setAuthError(error.message || "Authentication could not be initialized.");
      } finally {
        if (active) setAuthReady(true);
      }
    }
    initialize();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (username, password) => {
    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password) throw new Error("Invalid username or password");

    if (authApiUrl) {
      let response;
      try {
        response = await fetch(`${authApiUrl}/auth/login`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: normalizedUsername, password }),
        });
      } catch {
        throw new Error("Unable to reach the authentication service.");
      }
      if (response.status === 401 || response.status === 403) throw new Error("Invalid username or password");
      if (!response.ok) throw new Error(`Authentication failed (HTTP ${response.status}).`);
      const result = await response.json();
      if (!result?.user?.username) throw new Error("Authentication service returned an invalid session.");
      setUser(result.user);
      setAuthError("");
      return;
    }

    const credentials = await getAdminCredentials();
    if (!credentials) throw new Error("Demo credentials are unavailable.");
    const suppliedHash = await hashPassword(password, base64ToBytes(credentials.salt));
    if (normalizedUsername !== credentials.username || !matchesHash(suppliedHash, credentials.passwordHash)) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      setUser(null);
      throw new Error("Invalid username or password");
    }
    const token = bytesToBase64(crypto.getRandomValues(new Uint8Array(32)));
    const account = { username: credentials.username, fullName: credentials.fullName || "Administrator", email: credentials.email || "admin@yodapro.com" };
    const now = Date.now();
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ user: account, token, issuedAt: now, lastActivityAt: now }));
    setUser(account);
    setAuthError("");
  }, []);

  const updateAdminProfile = useCallback(async ({ username, fullName, email, password }) => {
    const normalizedUsername = username.trim();
    if (!normalizedUsername || !fullName.trim() || !email.trim()) throw new Error("Username, full name, and email are required.");
    if (authApiUrl) {
      let response;
      try {
        response = await fetch(`${authApiUrl}/auth/profile`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: normalizedUsername, fullName: fullName.trim(), email: email.trim(), ...(password ? { password } : {}) }),
        });
      } catch {
        throw new Error("Unable to update the profile through the authentication service.");
      }
      if (!response.ok) throw new Error(`Profile update failed (HTTP ${response.status}).`);
      const result = response.status === 204 ? null : await response.json();
      setUser(result?.user || { ...user, username: normalizedUsername, fullName: fullName.trim(), email: email.trim() });
      return;
    }
    const stored = await getAdminCredentials();
    if (!stored) throw new Error("Demo credentials are unavailable.");
    const record = password
      ? await createCredentialRecord(normalizedUsername, password)
      : { ...stored, username: normalizedUsername };
    record.fullName = fullName.trim();
    record.email = email.trim();
    await setDoc(ADMIN_CREDENTIALS_REF, record);
    localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(record));
    const nextUser = { username: normalizedUsername, fullName: record.fullName, email: record.email };
    const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null");
    if (session?.token) localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ ...session, user: nextUser }));
    setUser(nextUser);
  }, [user]);

  const logout = useCallback(async () => {
    setUser(null);
    if (!authApiUrl) localStorage.removeItem(AUTH_SESSION_KEY);

    if (authApiUrl) {
      let response;
      try {
        response = await fetch(`${authApiUrl}/auth/logout`, { method: "POST", credentials: "include" });
      } catch {
        throw new Error("Unable to reach the authentication service to end the session.");
      }
      if (!response.ok) throw new Error(`Logout failed (HTTP ${response.status}).`);
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    let lastActivityAt = Date.now();
    if (!authApiUrl) {
      try {
        const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null");
        const storedActivityAt = Number(session?.lastActivityAt ?? session?.issuedAt);
        if (Number.isFinite(storedActivityAt)) lastActivityAt = storedActivityAt;
      } catch {
        localStorage.removeItem(AUTH_SESSION_KEY);
      }
    }

    let backgroundAt = document.visibilityState === "hidden" ? Date.now() : null;
    let inactivityTimer;
    let lastPersistedActivityAt = 0;
    let expired = false;

    function expireSession() {
      if (expired) return;
      expired = true;
      clearTimeout(inactivityTimer);
      logout().catch((error) => {
        setAuthError(error.message || "Unable to end the expired session.");
      });
    }

    function scheduleInactivityLock() {
      clearTimeout(inactivityTimer);
      const remaining = INACTIVITY_TIMEOUT - (Date.now() - lastActivityAt);
      inactivityTimer = window.setTimeout(expireSession, Math.max(remaining, 0));
    }

    function recordActivity() {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      lastActivityAt = now;
      backgroundAt = null;
      if (!authApiUrl && now - lastPersistedActivityAt >= 1000) {
        try {
          const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null");
          if (session?.token) {
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ ...session, lastActivityAt: now }));
            lastPersistedActivityAt = now;
          }
        } catch {
          localStorage.removeItem(AUTH_SESSION_KEY);
        }
      }
      scheduleInactivityLock();
    }

    function markBackground() {
      if (backgroundAt === null) backgroundAt = Date.now();
    }

    function resumeFromBackground() {
      if (document.visibilityState === "hidden" || !document.hasFocus()) {
        markBackground();
        return;
      }
      if (Date.now() - lastActivityAt >= INACTIVITY_TIMEOUT
        || (backgroundAt !== null && Date.now() - backgroundAt > INACTIVITY_TIMEOUT)) {
        expireSession();
        return;
      }
      recordActivity();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") markBackground();
      else resumeFromBackground();
    }

    window.addEventListener("mousemove", recordActivity, { passive: true });
    window.addEventListener("keydown", recordActivity);
    window.addEventListener("scroll", recordActivity, { passive: true });
    window.addEventListener("pointerdown", recordActivity, { passive: true });
    window.addEventListener("touchstart", recordActivity, { passive: true });
    window.addEventListener("blur", markBackground);
    window.addEventListener("focus", resumeFromBackground);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    scheduleInactivityLock();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener("mousemove", recordActivity);
      window.removeEventListener("keydown", recordActivity);
      window.removeEventListener("scroll", recordActivity);
      window.removeEventListener("pointerdown", recordActivity);
      window.removeEventListener("touchstart", recordActivity);
      window.removeEventListener("blur", markBackground);
      window.removeEventListener("focus", resumeFromBackground);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, logout]);

  const value = useMemo(() => ({
    user,
    authReady,
    authError,
    demoMode: !authApiUrl,
    login,
    logout,
    updateAdminProfile,
  }), [user, authReady, authError, login, logout, updateAdminProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
