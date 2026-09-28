import test from "node:test";
import assert from "node:assert/strict";
import { classifyCandidate, DiscoveryCandidate } from "./discovery-policy.js";

const base: DiscoveryCandidate = {
  id:"voice-study", category:"data_contribution", rewardType:"cash",
  advertisedRewardUsd:18, requiresUpfrontSpend:false,
  authorityStatus:"AUTHORITATIVE", authoritativeReference:"https://example.test/job",
  openStatus:"OPEN", participationMode:"HUMAN_REQUIRED", eligible:true,
  deviceCompatible:true, paymentVerifiable:true, probabilityDependent:false
};

test("verified zero-cost cash task passes to economics",()=>{
  const d=classifyCandidate(base);
  assert.equal(d.decision,"PASS_TO_ECONOMICS");
  assert.equal(d.humanRequired,true);
});

test("token reward is rejected even when advertised value exists",()=>{
  const d=classifyCandidate({...base,id:"token",rewardType:"token"});
  assert.equal(d.decision,"REJECT");
  assert.ok(d.reasons.includes("NON_CASH_REWARD"));
});

test("aggregator-only lead is rejected until authoritative evidence exists",()=>{
  const { authoritativeReference: _omitted, ...withoutAuthority } = base;
  const d=classifyCandidate({...withoutAuthority,id:"stale",authorityStatus:"UNVERIFIED"});
  assert.equal(d.decision,"REJECT");
  assert.ok(d.reasons.includes("NOT_AUTHORITATIVE"));
});

test("unknown eligibility stays in verification with an explicit need",()=>{
  const d=classifyCandidate({...base,id:"unknown",eligible:"UNKNOWN"});
  assert.equal(d.decision,"NEEDS_VERIFICATION");
  assert.deepEqual(d.verificationNeeds,["ELIGIBILITY"]);
});

test("multiple unknown facts produce a deterministic verification queue",()=>{
  const d=classifyCandidate({...base,id:"unknowns",requiresUpfrontSpend:"UNKNOWN",deviceCompatible:"UNKNOWN",paymentVerifiable:"UNKNOWN"});
  assert.equal(d.decision,"NEEDS_VERIFICATION");
  assert.deepEqual(d.verificationNeeds,["UPFRONT_SPEND","DEVICE_COMPATIBILITY","PAYMENT_VERIFIABILITY"]);
});

test("rejected candidate does not request verification work",()=>{
  const d=classifyCandidate({...base,id:"bad",rewardType:"token",eligible:"UNKNOWN"});
  assert.equal(d.decision,"REJECT");
  assert.deepEqual(d.verificationNeeds,[]);
});

test("prize can pass discovery but remains marked speculative",()=>{
  const d=classifyCandidate({...base,id:"prize",category:"competition_prize",participationMode:"ASSISTED",probabilityDependent:true});
  assert.equal(d.decision,"PASS_TO_ECONOMICS");
  assert.equal(d.speculative,true);
});
