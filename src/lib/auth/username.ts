/**
 * Students sign up with just a username + password — no real email
 * required. Supabase Auth still needs an email under the hood, so we
 * derive a deterministic, non-deliverable one from the username. Login
 * re-derives the same email from whatever username was typed, so no DB
 * lookup is needed. Admin/Google accounts keep using their real email —
 * the login field accepts either, see `looksLikeEmail`.
 */
const USERNAME_EMAIL_DOMAIN = "users.linguapractice.local";

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (!USERNAME_PATTERN.test(trimmed)) {
    return "Username must be 3-32 characters: letters, numbers, dots, dashes, or underscores.";
  }
  return null;
}

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;
}

export function looksLikeEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value.trim());
}
