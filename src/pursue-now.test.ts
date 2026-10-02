import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePursueNow } from "./pursue-now.js";

const ready = {
  candidateId: "bounty-1",
  issue: { state: "open" as const, locked: false, assignees: [], openCompetingPullRequests: 0, checkedAt: "2026-10-02T00:00:00Z" },
  capability: "VERIFIED" as const,
  requiredTools: "AVAILABLE_FREE" as const,
  paymentPath: "VERIFIED" as const,
  effort: { status: "VERIFIED" as const, manualHours: 2 },
  economics: { expectedNetUsd: 200, expectedDaysToPayment: 7 },
  competitionCount: 0,
  automationLeverage: 0.8,
};

test("allows only fully verified actionable work", () => {
  const result = evaluatePursueNow(ready);
  assert.equal(result.decision, "PURSUE_NOW");
  assert.deepEqual(result.reasons, []);
});

test("rejects assigned work even when money is attached", () => {
  const result = evaluatePursueNow({...ready, issue: {...ready.issue, assignees:["someone-else"]}});
  assert.equal(result.decision, "DO_NOT_PURSUE");
  assert.ok(result.reasons.includes("ALREADY_ASSIGNED"));
});

test("holds heavy competition rather than presenting it as pursue-now", () => {
  const result = evaluatePursueNow({...ready, competitionCount: 25});
  assert.equal(result.decision, "NEEDS_VERIFICATION");
  assert.ok(result.reasons.includes("HIGH_COMPETITION"));
});

test("fails closed on unknown capability, tools, payment, or effort", () => {
  const result = evaluatePursueNow({
    ...ready,
    capability:"UNKNOWN",
    requiredTools:"UNKNOWN",
    paymentPath:"UNKNOWN",
    effort:{status:"UNKNOWN"},
  });
  assert.equal(result.decision, "NEEDS_VERIFICATION");
  assert.deepEqual(result.reasons,["CAPABILITY_UNVERIFIED","TOOLS_OR_COST_UNKNOWN","PAYMENT_PATH_UNVERIFIED","EFFORT_UNVERIFIED"]);
});
