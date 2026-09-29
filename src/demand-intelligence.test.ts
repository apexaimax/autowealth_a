import test from "node:test";
import assert from "node:assert/strict";
import { analyzeDemand, DEFAULT_PROJECT_ASSETS, type DemandObservation } from "./demand-intelligence.js";

function observation(id:string,title:string,body:string,intent:"MARKET_PAIN"|"SERVICE_REQUEST"|"REMOTE_WORK"="MARKET_PAIN"):DemandObservation {
  return {id,title,body,url:`https://example.test/${id}`,observedAt:"2026-09-29T00:00:00Z",intent};
}

test("repeated demand matching a verified asset becomes an existing-product signal",()=>{
  const result=analyzeDemand([
    observation("1","Need a ZIP archive release comparison workflow","Manual release verification is slow."),
    observation("2","ZIP archive release comparison is tedious","Need automation for release verification.")
  ],DEFAULT_PROJECT_ASSETS);
  const match=result.find(row=>row.matchedAssetId==="version-vault");
  assert.ok(match);
  assert.equal(match.lane,"EXISTING_PRODUCT");
  assert.equal(match.action,"USE_EXISTING");
  assert.equal(match.evidenceCount,2);
  assert.ok(!match.verificationNeeds.includes("RECURRENCE"));
  assert.ok(match.verificationNeeds.includes("BUYER_INTENT"));
  assert.ok(match.verificationNeeds.includes("PAYMENT_PATH"));
});

test("partial existing asset is adaptation, not a claim that the product is ready",()=>{
  const [match]=analyzeDemand([
    observation("3","Need AI agent approval and authorization","Manual audit trail for AI agent changes is painful.")
  ],DEFAULT_PROJECT_ASSETS);
  assert.ok(match);
  assert.equal(match.matchedAssetId,"proofrail");
  assert.equal(match.action,"ADAPT_EXISTING");
  assert.ok(match.verificationNeeds.includes("ASSET_READINESS"));
});

test("unmatched pain becomes a speculative new-product lead with recurrence still required",()=>{
  const [match]=analyzeDemand([
    observation("4","Need automation for aquarium feeding logs","Manual tank notes are repetitive and slow.")
  ],DEFAULT_PROJECT_ASSETS);
  assert.ok(match);
  assert.equal(match.lane,"NEW_PRODUCT");
  assert.equal(match.action,"CREATE_NEW");
  assert.equal(match.speculative,true);
  assert.ok(match.verificationNeeds.includes("RECURRENCE"));
  assert.ok(match.verificationNeeds.includes("BUYER_INTENT"));
});

test("remote work stays in a separate lane",()=>{
  const [match]=analyzeDemand([
    observation("5","Remote QA workflow role","Need help with repetitive QA documentation.","REMOTE_WORK")
  ],DEFAULT_PROJECT_ASSETS);
  assert.ok(match);
  assert.equal(match.lane,"REMOTE_WORK");
  assert.equal(match.action,"PURSUE_REMOTE_WORK");
});

test("service requests stay separate from product creation",()=>{
  const [match]=analyzeDemand([
    observation("6","Need someone to compare ZIP releases","Looking for help with archive release verification.","SERVICE_REQUEST")
  ],DEFAULT_PROJECT_ASSETS);
  assert.ok(match);
  assert.equal(match.lane,"SERVICE");
  assert.equal(match.action,"OFFER_SERVICE");
  assert.equal(match.matchedAssetId,"version-vault");
});

test("ordinary text without a demand signal is ignored",()=>{
  const result=analyzeDemand([
    observation("7","Release notes","ZIP archive parser documentation.")
  ],DEFAULT_PROJECT_ASSETS);
  assert.equal(result.length,0);
});
