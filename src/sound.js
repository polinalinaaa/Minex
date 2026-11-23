import gemUrl from "./assets/sounds/gem-collect.wav";
import clickUrl from "./assets/sounds/ui-click.mp3";
import boomUrl from "./assets/sounds/mine-boom.mp3";
import winUrl from "./assets/sounds/reward-win.wav";
import {
  createSoundMemory,
  decideSound,
  holdClick,
  readSoundPrefs,
  clampSoundVolume,
} from "./soundPolicy.js";

const STORAGE_KEY = "minex.sound";

const URLS = {
  gem: gemUrl,
  click: clickUrl,
  boom: boomUrl,
  win: winUrl,
};

const listeners = new Set();
let memory = createSoundMemory();
let context = null;
let master = null;
let installed = false;
const encoded = new Map();
const decoded = new Map();
const active = new Map();
let tickSource = null;
let tickAt = 0;
let tickToken = 0;
const TICK_GAP_MS = 88;
const TICK_SECONDS = 0.08;

function storedPrefs() {
  if (typeof localStorage === "undefined") {
    return readSoundPrefs("");
  }
  try {
    return readSoundPrefs(localStorage.getItem(STORAGE_KEY) ?? "");
  } catch {
    return readSoundPrefs("");
  }
}

let prefs = storedPrefs();

function emit() {
  const snapshot = getSoundPrefs();
  listeners.forEach((listener) => listener(snapshot));
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Playback still follows the in-memory preference.
  }
  emit();
}

function applyGain() {
  if (!master) return;
  master.gain.value = prefs.muted || prefs.volume <= 0 ? 0 : prefs.volume;
}

export function getSoundPrefs() {
  return { muted: prefs.muted, volume: prefs.volume };
}

export function subscribeSound(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSoundMuted(muted) {
  prefs = { ...prefs, muted: Boolean(muted) };
  applyGain();
  persist();
}

export function setSoundVolume(volume) {
  prefs = { ...prefs, volume: clampSoundVolume(volume) };
  applyGain();
  persist();
}

function loadEncoded(id) {
  if (!encoded.has(id)) {
    encoded.set(
      id,
      fetch(URLS[id])
        .then((response) => {
          if (!response.ok) throw new Error("missing sound");
          return response.arrayBuffer();
        })
        .catch(() => null),
    );
  }
  return encoded.get(id);
}

async function ensureContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!context) {
    context = new Ctx();
    master = context.createGain();
    applyGain();
    master.connect(context.destination);
  }
  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return null;
    }
  }
  return context.state === "running" ? context : null;
}

async function bufferFor(id, ctx) {
  if (decoded.has(id)) return decoded.get(id);
  const raw = await loadEncoded(id);
  if (!raw) return null;
  try {
    const buffer = await ctx.decodeAudioData(raw.slice(0));
    decoded.set(id, buffer);
    return buffer;
  } catch {
    return null;
  }
}

async function output(id) {
  try {
    const ctx = await ensureContext();
    if (!ctx || prefs.muted || prefs.volume <= 0) return;
    const buffer = await bufferFor(id, ctx);
    if (!buffer || prefs.muted || prefs.volume <= 0) return;
    const previous = active.get(id);
    if (previous) {
      try {
        previous.stop();
      } catch {
        // The previous voice already ended.
      }
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(master);
    active.set(id, source);
    source.onended = () => {
      if (active.get(id) === source) active.delete(id);
      try {
        source.disconnect();
      } catch {
        // The node is already disconnected.
      }
    };
    source.start();
  } catch {
    // Autoplay or decode failures stay silent.
  }
}

function stopNode(node) {
  if (!node) return;
  try {
    node.stop();
  } catch {
    // The voice already ended.
  }
}

export function stopSpinTicks() {
  tickToken += 1;
  stopNode(tickSource);
  tickSource = null;
}

export function playSpinTick() {
  if (prefs.muted || prefs.volume <= 0) return;
  const now = performance.now();
  if (now - tickAt < TICK_GAP_MS) return;
  tickAt = now;
  void outputTick();
}

export function holdUiClick() {
  memory = holdClick(memory, performance.now());
}

async function outputTick() {
  const token = tickToken;
  try {
    const ctx = await ensureContext();
    if (token !== tickToken || !ctx || prefs.muted || prefs.volume <= 0) return;
    const buffer = await bufferFor("gem", ctx);
    if (token !== tickToken || !buffer || prefs.muted || prefs.volume <= 0) return;
    stopNode(tickSource);
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.004);
    gain.gain.linearRampToValueAtTime(0, now + TICK_SECONDS);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(master);
    tickSource = source;
    source.onended = () => {
      if (tickSource === source) tickSource = null;
      try {
        source.disconnect();
        gain.disconnect();
      } catch {
        // The nodes are already disconnected.
      }
    };
    source.start(now, 0, TICK_SECONDS);
  } catch {
    // Autoplay or decode failures stay silent.
  }
}

export function playSound(id) {
  if (prefs.muted || prefs.volume <= 0) return;
  if (id === "win" || id === "boom") stopSpinTicks();
  const decision = decideSound(id, memory, performance.now());
  memory = decision.memory;
  if (!decision.allow) return;
  void output(id);
}

export function installSound() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  Object.keys(URLS).forEach((id) => {
    void loadEncoded(id);
  });
  const arm = () => {
    void ensureContext();
  };
  window.addEventListener("pointerdown", arm, { capture: true, passive: true });
  window.addEventListener("keydown", arm, { capture: true });
}
