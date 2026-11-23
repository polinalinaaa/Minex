import assert from "node:assert/strict";
import test from "node:test";
import { INVITE_BONUS_CREDITS, INVITE_CODE_KEY, inviteUrl, readInviteCode } from "./invite.js";

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

test("an invite code is created once and the bonus stays a setting", () => {
  assert.equal(INVITE_BONUS_CREDITS, 100);
  const storage = memoryStorage();
  const first = readInviteCode(storage, () => 0);
  const second = readInviteCode(storage, () => 0.99);
  assert.equal(first, second);
  assert.match(first, /^[a-z0-9]{8}$/);
  assert.equal(storage.dump[INVITE_CODE_KEY], first);
  assert.equal(inviteUrl("http://127.0.0.1:5173", first), `http://127.0.0.1:5173/?invite=${first}`);
  assert.equal(inviteUrl("http://127.0.0.1:5173/", first), `http://127.0.0.1:5173/?invite=${first}`);
});
