import test from "node:test";
import assert from "node:assert/strict";
import { buildCustomerLeadQueries } from "./customer-lead-queries.js";
import type { CustomerLeadProfile } from "./customer-leads.js";

const make=(id:string,offer:string,industry:string,problem:string,solution:string):CustomerLeadProfile=>({id,name:id,offer,targetIndustries:[industry],targetRoles:["operations"],targetRegions:["US"],problemTerms:[problem],solutionTerms:[solution],exclusions:[]});
test("generates distinct searches for unrelated customer profiles",()=>{
 const roofing=buildCustomerLeadQueries(make("roofer","Roof replacement","property management","roof leak","roof replacement"));
 const extension=buildCustomerLeadQueries(make("extension","Browser extension automation","software","manual browser workflow","chrome extension"));
 const security=buildCustomerLeadQueries(make("security","AI agent security audit","software","unsafe agent action","human approval"));
 assert.notDeepEqual(roofing,extension);assert.notDeepEqual(extension,security);
 assert.ok(roofing.web.some(x=>x.includes("roof leak")));
 assert.ok(extension.github.some(x=>x.includes("manual browser workflow")));
 assert.ok(security.web.some(x=>x.includes("unsafe agent action")));
});
test("query generation is bounded and deterministic",()=>{
 const p:CustomerLeadProfile={id:"x",name:"x",offer:"x",targetIndustries:["a","b","c","d"],targetRoles:["r1","r2","r3","r4"],targetRegions:["US"],problemTerms:["p1","p2","p3","p4","p5"],solutionTerms:["s1","s2","s3","s4"],exclusions:[]};
 const a=buildCustomerLeadQueries(p),b=buildCustomerLeadQueries(p);assert.deepEqual(a,b);assert.ok(a.github.length<=19);assert.ok(a.web.length<=25);
});
