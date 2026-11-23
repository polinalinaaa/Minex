export const SOUND_IDS = ["boom", "win", "gem", "click"];

export const DEFAULT_SOUND_VOLUME = 0.4;

const PRIORITY = { boom: 4, win: 3, gem: 2, click: 1 };

const GAP_MS = { boom: 900, win: 400, gem: 45, click: 50 };

const CLICK_SUPPRESS_MS = 50;

export function clampSoundVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_SOUND_VOLUME;
  return Math.min(1, Math.max(0, number));
}

export function readSoundPrefs(raw) {
  try {
    const parsed = JSON.parse(raw);
    return {
      muted: Boolean(parsed.muted),
      volume: clampSoundVolume(parsed.volume),
    };
  } catch {
    return { muted: false, volume: DEFAULT_SOUND_VOLUME };
  }
}

export function createSoundMemory() {
  return { lastAt: {}, rankAt: 0, rank: 0 };
}

export function holdClick(memory, now) {
  return { ...memory, rankAt: now, rank: PRIORITY.gem };
}

export function decideSound(id, memory, now) {
  const rank = PRIORITY[id];
  if (!rank) return { allow: false, memory };
  if (id === "click" && memory.rank > rank && now - memory.rankAt < CLICK_SUPPRESS_MS) {
    return { allow: false, memory };
  }
  const previous = memory.lastAt[id] ?? Number.NEGATIVE_INFINITY;
  if (now - previous < GAP_MS[id]) return { allow: false, memory };
  return {
    allow: true,
    memory: {
      lastAt: { ...memory.lastAt, [id]: now },
      rankAt: rank > PRIORITY.click ? now : memory.rankAt,
      rank: rank > PRIORITY.click ? rank : memory.rank,
    },
  };
}
