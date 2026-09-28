import test from "node:test";
import assert from "node:assert/strict";
import { buildRankingEstimate, type EstimateFact } from "./estimate-verification.js";
import { orchestrateDiscovery } from "./orchestrator.js";
import type { RawOpportunity } from "./collector.js";

function candidate(overrides:Partial<RawOpportunity>={}){
 const raw:RawOpportunity={
  sourceId:"buyer",externalId:"1",title:"Paid audit",url:"https://example.test/1",
  sourceKind:"authoritative",category:"freelance_contract",rewardType:"cash",
  advertisedRewardUsd:200,requiresUpfrontSpend:false,openStatus:"OPEN",
  participationMode:"ASSISTED",eligible:true,deviceCompatible:true,paymentVerifiable:true,
  probabilityDependent:false,observedAt:"2026-09-28T00:00:00Z",...overrides
 };
 return orchestrateDiscovery([[raw]]);
}
const observedAt="2026-09-28T00:00:00Z";
function fact(field:EstimateFact["field"],value:number):EstimateFact {
 return {field,value,sourceKind:"AUTHORITATIVE",reference:"https://example.test/evidence",observedAt};
}

test("complete provenance-backed facts produce ranking input",()=>{
 const batch=candidate();
 const result=buildRankingEstimate(batch.readyForEconomics[0]!,[
  fact("expectedNetUsd",180),fact("manualHours",1),fact("automationLeverage",0.9),
  fact("expectedDaysToPayment",7),fact("competitionCount",4),fact("uncertainty",0.2)
 ]);
 assert.equal(result.status,"READY");
 assert.equal(result.input?.expectedNetUsd,180);
});

test("missing facts stay missing instead of receiving defaults",()=>{
 const batch=candidate();
 const result=buildRankingEstimate(batch.readyForEconomics[0]!,[fact("expectedNetUsd",180)]);
 assert.equal(result.status,"MISSING_FACTS");
 assert.ok(result.missing.includes("manualHours"));
 assert.equal(result.input,undefined);
});

test("fact without provenance is invalid",()=>{
 const batch=candidate();
 const bad={...fact("manualHours",1),reference:""};
 const result=buildRankingEstimate(batch.readyForEconomics[0]!,[bad]);
 assert.equal(result.status,"INVALID_FACTS");
 assert.ok(result.invalid.includes("manualHours"));
});

test("candidate that did not pass discovery cannot be estimated into ranking",()=>{
 const batch=candidate({requiresUpfrontSpend:"UNKNOWN"});
 const blocked=batch.needsVerification[0]!;
 const result=buildRankingEstimate(blocked,[
  fact("expectedNetUsd",999),fact("manualHours",0),fact("automationLeverage",1),
  fact("expectedDaysToPayment",0),fact("competitionCount",0),fact("uncertainty",0)
 ]);
 assert.equal(result.status,"INVALID_FACTS");
 assert.equal(result.input,undefined);
});

test("bounded estimate fields reject impossible values",()=>{
 const batch=candidate();
 const result=buildRankingEstimate(batch.readyForEconomics[0]!,[fact("automationLeverage",1.1)]);
 assert.equal(result.status,"INVALID_FACTS");
 assert.ok(result.invalid.includes("automationLeverage"));
});
