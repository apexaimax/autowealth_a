import test from "node:test";
import assert from "node:assert/strict";
import { resolveGitHubVerification } from "./github-verification.js";
import type { RawOpportunity } from "./collector.js";

const base:RawOpportunity={
 sourceId:"github:owner/repo",externalId:"7",title:"$200 bounty",url:"https://github.com/owner/repo/issues/7",
 sourceKind:"authoritative",category:"bounty",rewardType:"cash",advertisedRewardUsd:200,
 requiresUpfrontSpend:false,openStatus:"OPEN",participationMode:"ASSISTED",eligible:true,
 deviceCompatible:true,paymentVerifiable:true,probabilityDependent:true,observedAt:"2026-10-02T00:00:00Z"
};

const issue=(assignees:string[]=[])=>({
 html_url:base.url,number:7,title:base.title,state:"open" as const,locked:false,labels:[{name:"bounty"}],
 assignees:assignees.map(login=>({login})),body:"Free to participate. Payment released after acceptance.",
 comments:40,repository_url:"https://api.github.com/repos/owner/repo"
});

test("ordinary discussion comments are not counted as competition",()=>{
 const r=resolveGitHubVerification(base,issue(),[],undefined,0);
 assert.equal(r.raw.competitionCount,0);
});

test("open competing PRs are authoritative competition",()=>{
 const r=resolveGitHubVerification(base,issue(),[],undefined,3);
 assert.equal(r.raw.competitionCount,3);
});

test("assignment fails closed during second-stage verification",()=>{
 const r=resolveGitHubVerification(base,issue(["someone"]),[],undefined,0);
 assert.equal(r.viability.viable,false);
 assert.ok(r.viability.reasons.includes("ALREADY_ASSIGNED"));
});
