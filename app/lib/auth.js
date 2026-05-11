export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("srh_token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("srh_user"));
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("srh_token");
  localStorage.removeItem("srh_user");
  window.dispatchEvent(new Event("srh-auth-change"));
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function saveAuth(token, user) {
  localStorage.setItem("srh_token", token);
  localStorage.setItem("srh_user", JSON.stringify(user));
  window.dispatchEvent(new Event("srh-auth-change"));
}
