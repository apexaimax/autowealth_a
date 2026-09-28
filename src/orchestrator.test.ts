import test from "node:test";
import assert from "node:assert/strict";
import { orchestrateDiscovery, discoverySummary } from "./orchestrator.js";
import type { RawOpportunity } from "./collector.js";

function row(id:string, overrides:Partial<RawOpportunity>={}):RawOpportunity {
 return {
  sourceId:"source",externalId:id,title:id,url:"https://example.test/"+id,
  sourceKind:"authoritative",category:"qa_testing",rewardType:"cash",
  advertisedRewardUsd:20,requiresUpfrontSpend:false,openStatus:"OPEN",
  participationMode:"ASSISTED",eligible:true,deviceCompatible:true,
  paymentVerifiable:true,probabilityDependent:false,observedAt:"2026-09-28T00:00:00Z",
  ...overrides
 };
}

test("orchestrator deduplicates and partitions candidates",()=>{
 const batch=orchestrateDiscovery([
  [row("ready"),row("verify",{eligible:"UNKNOWN"})],
  [row("ready"),row("reject",{rewardType:"token"})]
 ]);
 assert.deepEqual(discoverySummary(batch),{
  totalObserved:4,uniqueCandidates:3,readyForEconomics:1,needsVerification:1,rejected:1
 });
 assert.equal(batch.readyForEconomics[0]?.candidate.id,"source:ready");
});

test("non-authoritative lead never reaches economics",()=>{
 const batch=orchestrateDiscovery([[row("lead",{sourceKind:"search"})]]);
 assert.equal(batch.readyForEconomics.length,0);
 assert.equal(batch.rejected.length,1);
 assert.ok(batch.rejected[0]?.decision.reasons.includes("NOT_AUTHORITATIVE"));
});
