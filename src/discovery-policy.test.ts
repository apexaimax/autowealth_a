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
  const d=classifyCandidate({...base,id:"stale",authorityStatus:"UNVERIFIED",authoritativeReference:undefined});
  assert.equal(d.decision,"REJECT");
  assert.ok(d.reasons.includes("NOT_AUTHORITATIVE"));
});

test("unknown eligibility stays in verification rather than being invented",()=>{
  const d=classifyCandidate({...base,id:"unknown",eligible:"UNKNOWN"});
  assert.equal(d.decision,"NEEDS_VERIFICATION");
});

test("prize can pass discovery but remains marked speculative",()=>{
  const d=classifyCandidate({...base,id:"prize",category:"competition_prize",participationMode:"ASSISTED",probabilityDependent:true});
  assert.equal(d.decision,"PASS_TO_ECONOMICS");
  assert.equal(d.speculative,true);
});
