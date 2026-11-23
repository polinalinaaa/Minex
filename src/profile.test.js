import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_DISPLAY_NAME,
  PROFILE_KEY,
  displayNameError,
  readDisplayName,
  saveDisplayName,
} from "./profile.js";

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    dump: data,
  };
}

test("display names are trimmed, limited to 2–24 characters, and stored on the profile", () => {
  assert.equal(displayNameError("  Ab  "), "");
  assert.equal(displayNameError("  A "), "Use 2–24 characters.");
  assert.equal(displayNameError(`  ${"A".repeat(24)}  `), "");
  assert.equal(displayNameError("A".repeat(25)), "Use 2–24 characters.");

  const storage = memoryStorage();
  assert.equal(readDisplayName(storage), DEFAULT_DISPLAY_NAME);
  assert.equal(saveDisplayName(storage, "  Mina  "), "Mina");
  assert.equal(storage.dump[PROFILE_KEY], JSON.stringify({ displayName: "Mina" }));
  assert.equal(readDisplayName(storage), "Mina");
  assert.equal(saveDisplayName(storage, " A "), null);
  assert.equal(readDisplayName(storage), "Mina");
  assert.equal(readDisplayName(memoryStorage({ [PROFILE_KEY]: "{" })), DEFAULT_DISPLAY_NAME);
  assert.equal(
    readDisplayName(memoryStorage({ [PROFILE_KEY]: JSON.stringify({ displayName: " " }) })),
    DEFAULT_DISPLAY_NAME,
  );
});
