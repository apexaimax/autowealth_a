import test from "node:test";
import assert from "node:assert/strict";
import { buildCommercialResearchSeeds } from "./commercial-seeds.js";
import type { DemandRecommendation } from "./demand-intelligence.js";

const recommendation:DemandRecommendation={
 key:"asset:proofrail",lane:"EXISTING_PRODUCT",action:"ADAPT_EXISTING",evidenceCount:2,
 sourceUrls:["https://github.com/acme/product/issues/7"],matchedAssetId:"proofrail",matchedAssetName:"ProofRail",
 matchedAssetStatus:"PARTIAL",matchedKeywords:["ai agent","approval"],
 verificationNeeds:["BUYER_INTENT","PAYMENT_PATH","COMPETITION","ASSET_READINESS"],speculative:true
};

test("hourly demand evidence becomes discovery-only Mode B research seed",()=>{
 const [seed]=buildCommercialResearchSeeds([recommendation]);
 assert.ok(seed);
 assert.equal(seed.organizationHint,"acme");
 assert.equal(seed.repositoryHint,"acme/product");
 assert.equal(seed.authoritativeCommercialEvidence,false);
 assert.ok(seed.requiredVerification.includes("AUTHORITATIVE_WORKFLOW"));
 assert.ok(seed.requiredVerification.includes("VERIFIED_CONTACT"));
});

test("unmatched new-product ideas do not enter capability-to-buyer lane",()=>{
 const newIdea:DemandRecommendation={...recommendation,key:"new:x",lane:"NEW_PRODUCT",action:"CREATE_NEW",matchedAssetId:undefined,matchedAssetName:undefined,matchedAssetStatus:undefined,matchedKeywords:[]};
 const seeds=buildCommercialResearchSeeds([newIdea]);
 assert.equal(seeds.length,0);
});
