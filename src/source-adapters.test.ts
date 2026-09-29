import test from "node:test";
import assert from "node:assert/strict";
import { githubIssueAdapter } from "./source-adapters.js";
import { classifyCandidate } from "./discovery-policy.js";
import { normalizeRawOpportunity } from "./collector.js";

test("GitHub adapter extracts explicit USD bounty but leaves unknown facts unknown",()=>{
  const [raw] = githubIssueAdapter.ingest([{
    repository:"owner/repo",number:7,title:"$50 bounty: fix parser",
    htmlUrl:"https://github.com/owner/repo/issues/7",state:"open",
    labels:["bounty"],assignees:[],comments:2,body:"Reward: $50 after accepted fix."
  }],"2026-09-28T00:00:00Z");
  assert.ok(raw);
  assert.equal(raw.advertisedRewardUsd,50);
  assert.equal(raw.rewardType,"cash");
  assert.equal(raw.paymentVerifiable,"UNKNOWN");
  const decision=classifyCandidate(normalizeRawOpportunity(raw).candidate);
  assert.equal(decision.decision,"NEEDS_VERIFICATION");
});

test("closed authoritative issue is not treated as actionable",()=>{
  const [raw] = githubIssueAdapter.ingest([{
    repository:"owner/repo",number:8,title:"$25 bounty",
    htmlUrl:"https://github.com/owner/repo/issues/8",state:"closed",labels:["bounty"]
  }],"2026-09-28T00:00:00Z");
  assert.ok(raw);
  const decision=classifyCandidate(normalizeRawOpportunity(raw).candidate);
  assert.equal(decision.decision,"REJECT");
  assert.ok(decision.reasons.includes("NOT_OPEN"));
});

test("ordinary issues are ignored",()=>{
  const rows=githubIssueAdapter.ingest([{
    repository:"owner/repo",number:9,title:"Fix typo",
    htmlUrl:"https://github.com/owner/repo/issues/9",state:"open",labels:["docs"]
  }],"2026-09-28T00:00:00Z");
  assert.equal(rows.length,0);
});

test("body-only generic paid/reward language without an explicit cash offer is ignored",()=>{
  const rows=githubIssueAdapter.ingest([{
    repository:"owner/repo",number:11,title:"Revenue research mission",
    htmlUrl:"https://github.com/owner/repo/issues/11",state:"open",labels:[],
    body:"Find paid work and rewards. Tiny painful workflows may be worth $50-$500."
  }],"2026-09-28T00:00:00Z");
  assert.equal(rows.length,0);
});

test("comma-formatted dollar amounts are parsed completely",()=>{
  const [raw]=githubIssueAdapter.ingest([{
    repository:"owner/repo",number:12,title:"Bounty: $145,000 compliance challenge",
    htmlUrl:"https://github.com/owner/repo/issues/12",state:"open",labels:["bounty"]
  }],"2026-09-28T00:00:00Z");
  assert.ok(raw);
  assert.equal(raw.advertisedRewardUsd,145000);
});

test("body-only explicit payment offer can still be discovered",()=>{
  const [raw]=githubIssueAdapter.ingest([{
    repository:"owner/repo",number:13,title:"Fix parser edge case",
    htmlUrl:"https://github.com/owner/repo/issues/13",state:"open",labels:[],
    body:"Payment: $80 after the accepted pull request."
  }],"2026-09-28T00:00:00Z");
  assert.ok(raw);
  assert.equal(raw.advertisedRewardUsd,80);
});

test("GitHub adapter applies explicit requirements when a profile is supplied",()=>{
 const [raw]=githubIssueAdapter.ingest([{
  repository:"owner/repo",number:10,title:"$75 paid QA task",
  htmlUrl:"https://github.com/owner/repo/issues/10",state:"open",
  labels:["bounty"],body:"US applicants only. Desktop required. QA experience required. Free to participate. Payment released after acceptance."
 }],"2026-09-28T00:00:00Z",{
  devices:["PHONE","TABLET"],workCapabilities:["QA"],countries:["US"]
 });
 assert.ok(raw);
 assert.equal(raw.eligible,true);
 assert.equal(raw.deviceCompatible,false);
 assert.equal(raw.requiresUpfrontSpend,false);
 assert.equal(raw.paymentVerifiable,true);
});
