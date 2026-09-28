import test from "node:test";
import assert from "node:assert/strict";
import { orchestrateDiscovery, discoverySummary, rankDiscoveryBatch } from "./orchestrator.js";
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


test("ranking only accepts candidates that passed discovery economics gate",()=>{
 const batch=orchestrateDiscovery([[
  row("ready"),
  row("unknown",{requiresUpfrontSpend:"UNKNOWN"}),
  row("reject",{rewardType:"token"})
 ]]);
 const estimates=new Map([
  ["source:ready",{expectedNetUsd:100,manualHours:1,automationLeverage:0.9,expectedDaysToPayment:7,competitionCount:2,uncertainty:0.1}],
  ["source:unknown",{expectedNetUsd:1000,manualHours:0.1,automationLeverage:1,expectedDaysToPayment:1,competitionCount:0,uncertainty:0}],
  ["source:reject",{expectedNetUsd:1000,manualHours:0.1,automationLeverage:1,expectedDaysToPayment:1,competitionCount:0,uncertainty:0}]
 ]);
 const result=rankDiscoveryBatch(batch,estimates);
 assert.deepEqual(result.ranked.map(x=>x.ranking.candidateId),["source:ready"]);
});

test("ready candidate remains unranked when estimates are missing",()=>{
 const batch=orchestrateDiscovery([[row("ready")]]);
 const result=rankDiscoveryBatch(batch,new Map());
 assert.equal(result.ranked.length,0);
 assert.deepEqual(result.missingEstimates.map(x=>x.candidate.id),["source:ready"]);
});
