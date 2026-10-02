import test from "node:test";
import assert from "node:assert/strict";
import { qualifyLead,type CustomerLeadProfile } from "./customer-leads.js";
const profile:CustomerLeadProfile={id:"extension-consultant",name:"Extension Consultant",offer:"Browser extension workflow automation",targetIndustries:["healthcare","software"],targetRoles:["engineering manager","operations"],targetRegions:["us"],problemTerms:["need help","manual workflow","browser extension"],solutionTerms:["automation","chrome"],exclusions:["internship"]};
test("keeps fit and intent evidence explicit and does not overclaim buyer intent",()=>{
 const lead=qualifyLead(profile,{source:"public-web",url:"https://example.com/a?utm_source=x",title:"Healthcare team needs help with browser extension",body:"US operations team has a manual workflow and needs help with automation",observedAt:"2026-10-01T20:00:00Z",evidenceKind:"REQUEST_FOR_HELP",company:"Example Health",person:"A. Buyer",role:"Operations"});
 assert.equal(lead.decision,"QUALIFIED");assert.ok(lead.fitReasons.length>0);assert.ok(lead.intentReasons.includes("signal:request_for_help"));assert.deepEqual(lead.unknowns,[]);
});
test("research signal is a seed, not a qualified buyer",()=>{
 const lead=qualifyLead(profile,{source:"public-web",url:"https://example.com/b",title:"Chrome automation research",body:"software team researching browser extension automation",observedAt:"2026-10-01T20:00:00Z",evidenceKind:"RESEARCH",company:"Example"});
 assert.equal(lead.decision,"RESEARCH_SEED");assert.ok(lead.unknowns.includes("CONTACT_IDENTITY"));
});
test("explicit exclusions fail closed",()=>{
 const lead=qualifyLead(profile,{source:"public-web",url:"https://example.com/c",title:"Browser extension internship",body:"need help with chrome automation",observedAt:"2026-10-01T20:00:00Z",evidenceKind:"DECLARED_NEED"});
 assert.equal(lead.decision,"REJECT");assert.ok(lead.unknowns.some(x=>x==="EXCLUDED:internship"));
});
