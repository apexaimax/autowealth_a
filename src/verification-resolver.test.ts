import test from "node:test";
import assert from "node:assert/strict";
import { resolveAuthoritativeText } from "./verification-resolver.js";
import type { RawOpportunity } from "./collector.js";

const base:RawOpportunity={
 sourceId:"github:a/b",externalId:"1",title:"$100 bounty",url:"https://github.com/a/b/issues/1",
 sourceKind:"authoritative",category:"bounty",rewardType:"cash",advertisedRewardUsd:100,
 requiresUpfrontSpend:"UNKNOWN",openStatus:"OPEN",participationMode:"ASSISTED",
 eligible:"UNKNOWN",deviceCompatible:"UNKNOWN",paymentVerifiable:"UNKNOWN",
 probabilityDependent:true,observedAt:"2026-09-28T00:00:00Z"
};

test("explicit no-fee language resolves upfront spend false",()=>{
 const r=resolveAuthoritativeText(base,"$100 bounty. Free to participate. Payment released after acceptance.");
 assert.equal(r.resolved.requiresUpfrontSpend,false);
 assert.equal(r.resolved.paymentVerifiable,true);
 assert.equal(r.evidence.length,2);
});

test("deposit or stake language resolves upfront spend true",()=>{
 const r=resolveAuthoritativeText(base,"Claim requires a $2 deposit before starting.");
 assert.equal(r.resolved.requiresUpfrontSpend,true);
});

test("generic paid wording does not invent payment verification",()=>{
 const r=resolveAuthoritativeText(base,"This is a paid bounty worth $100.");
 assert.equal(r.resolved.paymentVerifiable,"UNKNOWN");
 assert.equal(r.resolved.requiresUpfrontSpend,"UNKNOWN");
});

test("non-authoritative text cannot resolve facts",()=>{
 const r=resolveAuthoritativeText({...base,sourceKind:"aggregator"},"Free to enter. Bounty funded in escrow.");
 assert.equal(r.resolved.requiresUpfrontSpend,"UNKNOWN");
 assert.equal(r.resolved.paymentVerifiable,"UNKNOWN");
 assert.equal(r.evidence.length,0);
});

test("resolver never invents user-specific eligibility or device fit",()=>{
 const r=resolveAuthoritativeText(base,"Anyone can apply from any device.");
 assert.equal(r.resolved.eligible,"UNKNOWN");
 assert.equal(r.resolved.deviceCompatible,"UNKNOWN");
});
