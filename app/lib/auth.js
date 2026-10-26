import { WORKER_URL } from "./worker-url";

/** undefined = not fetched yet; null = fetched, logged out; object = logged in */
let _user = undefined;
let _fetchPromise = null;

export function setUser(user) {
  _user = user;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("srh-auth-change"));
  }
}

/**
 * Fetches the current session from the Worker via the httpOnly cookie.
 * Concurrent calls share the same in-flight request to avoid duplicate
 * network round-trips (e.g. Navbar + protected page mounting simultaneously).
 */
export async function fetchCurrentUser() {
  if (typeof window === "undefined") return null;
  if (_user !== undefined) return _user;
  if (_fetchPromise) return _fetchPromise;
  _fetchPromise = (async () => {
    try {
      const res = await fetch(`${WORKER_URL}/?action=me`, {
        credentials: "include",
      });
      if (!res.ok) {
        _user = null;
        return null;
      }
      const data = await res.json();
      _user = data.user || null;
      return _user;
    } catch {
      _user = null;
      return null;
    } finally {
      _fetchPromise = null;
    }
  })();
  return _fetchPromise;
}

/**
 * Signs out on the server (which revokes every token for the account) and only
 * then forgets the user locally. Resolves false when the server could not be
 * reached: showing a signed-out page while the session cookie is still valid
 * would mislead someone leaving a shared computer.
 */
export async function logout() {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch(`${WORKER_URL}/?action=logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
  } catch {
    return false;
  }
  _user = null;
  window.dispatchEvent(new Event("srh-auth-change"));
  return true;
}
