export function parseModeratorEmails(env) {
  const raw = env.MODERATOR_EMAILS || env.MODERATOR_EMAIL || "";
  return String(raw)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isModeratorEmail(email, env) {
  const list = parseModeratorEmails(env);
  if (!list.length) return false;
  return list.includes(String(email || "").trim().toLowerCase());
}

export function userIsModerator(user, env) {
  if (!user) return false;
  return Boolean(user.is_moderator) || isModeratorEmail(user.email, env);
}

export async function syncModeratorFromEmail(user, env) {
  if (!user || !env?.DB) return user;
  const emailGrant = isModeratorEmail(user.email, env);
  if (emailGrant && !user.is_moderator) {
    await env.DB.prepare("UPDATE users SET is_moderator = 1 WHERE id = ?")
      .bind(user.id)
      .run();
    user.is_moderator = 1;
  }
  return user;
}
