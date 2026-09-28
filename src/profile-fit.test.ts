import test from "node:test";
import assert from "node:assert/strict";
import { resolveProfileFit, type UserCapabilityProfile } from "./profile-fit.js";
import type { RawOpportunity } from "./collector.js";

const raw:RawOpportunity={
 sourceId:"source",externalId:"1",title:"Task",url:"https://example.test/1",
 sourceKind:"authoritative",category:"qa_testing",rewardType:"cash",
 requiresUpfrontSpend:false,openStatus:"OPEN",participationMode:"ASSISTED",
 eligible:"UNKNOWN",deviceCompatible:"UNKNOWN",paymentVerifiable:true,
 probabilityDependent:false,observedAt:"2026-09-28T00:00:00Z"
};
const profile:UserCapabilityProfile={
 devices:["PHONE","TABLET"],workCapabilities:["GITHUB_REVIEW","QA"],countries:["US"]
};

test("explicit country and device requirements can verify profile fit",()=>{
 const r=resolveProfileFit(raw,profile,{allowedCountries:["US"],requiredDevices:["TABLET"]});
 assert.equal(r.resolved.eligible,true);
 assert.equal(r.resolved.deviceCompatible,true);
});

test("missing required device creates a verified incompatibility",()=>{
 const r=resolveProfileFit(raw,profile,{requiredDevices:["DESKTOP"]});
 assert.equal(r.resolved.deviceCompatible,false);
});

test("country exclusion creates verified ineligibility",()=>{
 const r=resolveProfileFit(raw,profile,{allowedCountries:["CA","GB"]});
 assert.equal(r.resolved.eligible,false);
});

test("unknown requirements stay unknown instead of being guessed",()=>{
 const r=resolveProfileFit(raw,profile,{});
 assert.equal(r.resolved.eligible,"UNKNOWN");
 assert.equal(r.resolved.deviceCompatible,"UNKNOWN");
});

test("missing required work capability can reject eligibility",()=>{
 const r=resolveProfileFit({...raw,eligible:true},profile,{requiredWorkCapabilities:["LOCAL_DEV"]});
 assert.equal(r.resolved.eligible,false);
});
