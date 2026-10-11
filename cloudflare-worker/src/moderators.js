/**
 * The only account with moderator access. It is fixed in code on purpose, so
 * that granting access always goes through a reviewed change rather than a
 * secret or a database flag that nobody can see in the repository.
 */
export const MODERATOR_EMAIL = "edonaamulaj@gmail.com";

/** Kept as a list for callers that iterate; it always has exactly one entry. */
export function parseModeratorEmails() {
  return [MODERATOR_EMAIL];
}

export function isModeratorEmail(email) {
  return String(email || "").trim().toLowerCase() === MODERATOR_EMAIL;
}

/**
 * Moderator status comes from the verified email address alone. The
 * `users.is_moderator` column is ignored when deciding, so a stale flag in the
 * database cannot grant access.
 */
export function userIsModerator(user) {
  return Boolean(user) && isModeratorEmail(user.email);
}

/** Keeps the (informational) `is_moderator` column in step with the rule above. */
export async function syncModeratorFromEmail(user, env) {
  if (!user || !env?.DB) return user;
  const shouldBe = isModeratorEmail(user.email) ? 1 : 0;
  if (Number(user.is_moderator || 0) !== shouldBe) {
    await env.DB.prepare("UPDATE users SET is_moderator = ? WHERE id = ?")
      .bind(shouldBe, user.id)
      .run();
    user.is_moderator = shouldBe;
  }
  return user;
}
