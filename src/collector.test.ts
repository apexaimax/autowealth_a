import test from "node:test";
import assert from "node:assert/strict";
import { collectUnique, normalizeRawOpportunity, RawOpportunity } from "./collector.js";
import { classifyCandidate } from "./discovery-policy.js";

const raw: RawOpportunity = {
  sourceId:"buyer", externalId:"42", title:"Paid QA task", url:"https://buyer.example/tasks/42",
  sourceKind:"authoritative", category:"qa_testing", rewardType:"cash", advertisedRewardUsd:25,
  requiresUpfrontSpend:false, openStatus:"OPEN", participationMode:"ASSISTED",
  eligible:true, deviceCompatible:true, paymentVerifiable:true, probabilityDependent:false,
  observedAt:"2026-09-28T00:00:00Z"
};

test("authoritative observation normalizes into a verifiable candidate",()=>{
  const {candidate}=normalizeRawOpportunity(raw);
  assert.equal(candidate.authorityStatus,"AUTHORITATIVE");
  assert.equal(candidate.authoritativeReference,raw.url);
  assert.equal(classifyCandidate(candidate).decision,"PASS_TO_ECONOMICS");
});

test("search result cannot become authoritative merely by collection",()=>{
  const {candidate}=normalizeRawOpportunity({...raw,sourceKind:"search"});
  assert.equal(candidate.authorityStatus,"UNVERIFIED");
  assert.equal(classifyCandidate(candidate).decision,"REJECT");
});

test("missing facts remain unknown",()=>{
  const {candidate}=normalizeRawOpportunity({
    sourceId:"lead",externalId:"x",title:"Possible task",url:"https://example.test/x",
    sourceKind:"community",category:"direct_service",observedAt:"2026-09-28T00:00:00Z"
  });
  assert.equal(candidate.rewardType,"unknown");
  assert.equal(candidate.openStatus,"UNKNOWN");
  assert.equal(candidate.eligible,"UNKNOWN");
});

test("collector deduplicates source/external id",()=>{
  assert.equal(collectUnique([raw,{...raw,title:"duplicate"}]).length,1);
});
