import assert from "node:assert/strict";
import test from "node:test";
import {
  clampSoundVolume,
  createSoundMemory,
  decideSound,
  holdClick,
  readSoundPrefs,
} from "./soundPolicy.js";

test("sound preferences fall back to a conservative volume", () => {
  assert.deepEqual(readSoundPrefs(""), { muted: false, volume: 0.4 });
  assert.deepEqual(readSoundPrefs("{"), { muted: false, volume: 0.4 });
  assert.deepEqual(readSoundPrefs('{"muted":true,"volume":2}'), { muted: true, volume: 1 });
  assert.equal(clampSoundVolume(-3), 0);
});

test("a game sound suppresses the click from the same interaction", () => {
  let memory = createSoundMemory();
  const win = decideSound("win", memory, 1000);
  assert.equal(win.allow, true);
  memory = win.memory;
  assert.equal(decideSound("click", memory, 1020).allow, false);
  assert.equal(decideSound("click", memory, 1060).allow, true);
});

test("starting a spin holds the button click from that same press", () => {
  const memory = holdClick(createSoundMemory(), 1000);
  assert.equal(decideSound("click", memory, 1020).allow, false);
  assert.equal(decideSound("click", memory, 1060).allow, true);
});

test("mine, reward, and gem sounds do not stack from a repeated trigger", () => {
  let memory = createSoundMemory();
  const first = decideSound("boom", memory, 0);
  memory = first.memory;
  assert.equal(decideSound("boom", memory, 100).allow, false);
  assert.equal(decideSound("gem", memory, 100).allow, true);
  const gem = decideSound("gem", memory, 100);
  assert.equal(decideSound("gem", gem.memory, 120).allow, false);
  assert.equal(decideSound("gem", gem.memory, 160).allow, true);
});
