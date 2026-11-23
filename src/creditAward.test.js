import assert from "node:assert/strict";
import test from "node:test";
import {
  balanceNoticeCopy,
  balanceNoticeDetail,
  dismissBalanceNotice,
  dropCreditAward,
  enqueueBalanceNotice,
  heldCreditAwards,
  releaseCreditAward,
  stageCreditAward,
  subscribeCreditAward,
  visibleCredits,
} from "./creditAward.js";

test("staged awards stay hidden until a single release, and notices queue", () => {
  const events = [];
  const unsubscribe = subscribeCreditAward((event) => events.push(event));

  const first = stageCreditAward(25);
  assert.equal(heldCreditAwards(), 25);
  assert.equal(visibleCredits(125), 100);
  assert.equal(releaseCreditAward(first), true);
  assert.equal(releaseCreditAward(first), false);
  assert.equal(visibleCredits(125), 125);

  const second = stageCreditAward(10);
  const third = stageCreditAward(50);
  assert.equal(visibleCredits(185), 125);
  assert.equal(releaseCreditAward(second), true);
  assert.equal(heldCreditAwards(), 50);
  assert.equal(dropCreditAward(third), true);
  assert.equal(dropCreditAward(third), false);
  assert.equal(heldCreditAwards(), 0);
  assert.deepEqual(events.map((event) => event.type), ["present", "show", "present", "settle"]);

  const showing = events.find((event) => event.type === "show");
  assert.equal(showing.notice.tone, "received");
  assert.equal(showing.notice.amount, 25);
  assert.equal(dismissBalanceNotice(showing.notice.id), true);
  assert.equal(dismissBalanceNotice(showing.notice.id), false);
  assert.equal(events.at(-1).type, "show");
  assert.equal(events.at(-1).notice.amount, 10);
  assert.equal(dismissBalanceNotice(events.at(-1).notice.id), true);

  const lost = enqueueBalanceNotice("lost", 50);
  assert.equal(heldCreditAwards(), 0);
  assert.equal(visibleCredits(185), 185);
  assert.equal(events.at(-1).notice.tone, "lost");
  assert.equal(events.at(-1).notice.amount, 50);
  assert.equal(enqueueBalanceNotice("received", 0), 0);
  assert.equal(dismissBalanceNotice(lost), true);

  unsubscribe();
  assert.equal(balanceNoticeCopy("received", 10), "+10.00 credits");
  assert.equal(balanceNoticeCopy("lost", 1.5), "−1.50 credits");
  assert.equal(balanceNoticeDetail("received"), "Added to your balance");
  assert.equal(balanceNoticeDetail("lost"), "Lost in Mines");
});
