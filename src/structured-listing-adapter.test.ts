import test from "node:test";
import assert from "node:assert/strict";
import { ingestStructuredListings } from "./structured-listing-adapter.js";
import { normalizeRawOpportunity } from "./collector.js";
import { classifyCandidate } from "./discovery-policy.js";

test("authoritative paid research listing enters verification when eligibility is unknown",()=>{
 const [raw]=ingestStructuredListings([{provider:"research-provider",id:"study-1",title:"Paid interview",url:"https://provider.example/study-1",authoritative:true,category:"research_study",rewardType:"cash",rewardUsd:75,open:true,paymentVerifiable:true}], "2026-09-28T00:00:00Z");
 assert.ok(raw);
 assert.equal(classifyCandidate(normalizeRawOpportunity(raw).candidate).decision,"NEEDS_VERIFICATION");
});

test("aggregated challenge remains non-authoritative",()=>{
 const [raw]=ingestStructuredListings([{provider:"challenge-index",id:"c1",title:"$500 challenge",url:"https://index.example/c1",authoritative:false,category:"competition_prize",rewardType:"cash",rewardUsd:500,open:true,probabilityDependent:true}], "2026-09-28T00:00:00Z");
 assert.ok(raw);
 const d=classifyCandidate(normalizeRawOpportunity(raw).candidate);
 assert.equal(d.decision,"REJECT");
 assert.ok(d.reasons.includes("NOT_AUTHORITATIVE"));
});
