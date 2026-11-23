export const PROFILE_KEY = "minex.profile";
export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 24;
export const DEFAULT_DISPLAY_NAME = "Player";

export function normalizeDisplayName(value) {
  return String(value ?? "").trim();
}

export function displayNameError(value) {
  const name = normalizeDisplayName(value);
  if (name.length < DISPLAY_NAME_MIN || name.length > DISPLAY_NAME_MAX) {
    return "Use 2–24 characters.";
  }
  return "";
}

export function readDisplayName(storage) {
  let raw = null;
  try {
    raw = storage.getItem(PROFILE_KEY);
  } catch {
    return DEFAULT_DISPLAY_NAME;
  }
  if (!raw) return DEFAULT_DISPLAY_NAME;
  try {
    const parsed = JSON.parse(raw);
    const name = normalizeDisplayName(parsed?.displayName);
    if (displayNameError(name)) return DEFAULT_DISPLAY_NAME;
    return name;
  } catch {
    return DEFAULT_DISPLAY_NAME;
  }
}

export function saveDisplayName(storage, value) {
  const displayName = normalizeDisplayName(value);
  if (displayNameError(displayName)) return null;
  storage.setItem(PROFILE_KEY, JSON.stringify({ displayName }));
  return displayName;
}
