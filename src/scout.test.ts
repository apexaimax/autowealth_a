import test from "node:test";
import assert from "node:assert/strict";
import { buildScoutPlan, deriveUnverifiedHypotheses } from "./scout.js";
import type { UserCapabilityProfile } from "./profile-fit.js";

const profile:UserCapabilityProfile={
  devices:["PHONE","TABLET"],
  workCapabilities:["GITHUB_REVIEW","QA"]
};

test("Scout prioritizes profile-matched searches with topics surfaced by recent results",()=>{
  const plan=buildScoutPlan(profile,[
    {repository:"owner/app",number:9,htmlUrl:"https://github.com/owner/app/issues/9",title:"Need QA testing on mobile app",body:"Several testers found reproducible failures."}
  ]);

  assert.ok(plan.paidQueries.findIndex(query=>/testing/.test(query)) < plan.paidQueries.findIndex(query=>/code review/.test(query)));
  assert.ok(plan.paidQueries.every(query=>query.includes("is:issue is:open")));
});

test("Scout keeps pain-point searches separate from paid-opportunity searches",()=>{
  const plan=buildScoutPlan(profile,[]);

  assert.ok(plan.problemQueries.length>0);
  assert.ok(plan.problemQueries.every(query=>!plan.paidQueries.includes(query)));
});

test("Scout labels unpaid problem signals as hypotheses and excludes explicit paid offers",()=>{
  const hypotheses=deriveUnverifiedHypotheses([
    {repository:"owner/app",number:1,title:"Manual workflow wastes hours",htmlUrl:"https://github.com/owner/app/issues/1",body:"The repetitive process is slow and error-prone."},
    {repository:"owner/app",number:2,title:"$100 bounty for manual workflow fix",htmlUrl:"https://github.com/owner/app/issues/2",body:"Payment after merge."},
    {repository:"owner/app",number:3,title:"Add a dark theme",htmlUrl:"https://github.com/owner/app/issues/3",body:"Nice to have."}
  ]);

  assert.equal(hypotheses.length,1);
  assert.equal(hypotheses[0]?.status,"UNVERIFIED_HYPOTHESIS");
  assert.equal(hypotheses[0]?.url,"https://github.com/owner/app/issues/1");
  assert.equal("rewardType" in hypotheses[0]!,false);
});

test("Scout deduplicates the same problem signal found by multiple searches",()=>{
  const repeated={repository:"owner/app",number:4,title:"Repetitive manual workflow",htmlUrl:"https://github.com/owner/app/issues/4",body:"This tedious task causes errors."};
  assert.equal(deriveUnverifiedHypotheses([repeated,repeated]).length,1);
});
