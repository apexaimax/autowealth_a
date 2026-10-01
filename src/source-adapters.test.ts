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


test("compact k and m suffix dollar amounts are expanded",()=>{
  const rows=githubIssueAdapter.ingest([
    {repository:"owner/repo",number:14,title:"Bounty: $1.5k parser fix",htmlUrl:"https://github.com/owner/repo/issues/14",state:"open",labels:["bounty"]},
    {repository:"owner/repo",number:15,title:"Reward: $2K migration",htmlUrl:"https://github.com/owner/repo/issues/15",state:"open",labels:["reward"]},
    {repository:"owner/repo",number:16,title:"Bounty: $1.25M challenge",htmlUrl:"https://github.com/owner/repo/issues/16",state:"open",labels:["bounty"]}
  ],"2026-10-01T00:00:00Z");
  assert.equal(rows[0]?.advertisedRewardUsd,1500);
  assert.equal(rows[1]?.advertisedRewardUsd,2000);
  assert.equal(rows[2]?.advertisedRewardUsd,1250000);
});


test("known bounty aggregator repository is not authoritative",()=>{
  const [raw]=githubIssueAdapter.ingest([{
    repository:"someone/BountyScout",number:81,title:"$750 opportunity queue",
    htmlUrl:"https://github.com/someone/BountyScout/issues/81",state:"open",
    labels:["bounty"],body:"Opportunity queue with multiple bounties from other projects."
  }],"2026-10-01T00:00:00Z");
  assert.ok(raw);
  assert.equal(raw.sourceKind,"aggregator");
  const decision=classifyCandidate(normalizeRawOpportunity(raw).candidate);
  assert.equal(decision.decision,"REJECT");
  assert.ok(decision.reasons.includes("NOT_AUTHORITATIVE"));
});

test("generic radar or roundup issue is not authoritative even outside known repo names",()=>{
  const [raw]=githubIssueAdapter.ingest([{
    repository:"owner/tools",number:82,title:"Bounty radar: $500 opportunities",
    htmlUrl:"https://github.com/owner/tools/issues/82",state:"open",
    labels:["bounty"],body:"Curated bounties and listings from across GitHub."
  }],"2026-10-01T00:00:00Z");
  assert.ok(raw);
  assert.equal(raw.sourceKind,"aggregator");
  const decision=classifyCandidate(normalizeRawOpportunity(raw).candidate);
  assert.ok(decision.reasons.includes("NOT_AUTHORITATIVE"));
});

test("single bounty hosted by its own project remains authoritative",()=>{
  const [raw]=githubIssueAdapter.ingest([{
    repository:"owner/product",number:83,title:"$150 bounty: implement parser",
    htmlUrl:"https://github.com/owner/product/issues/83",state:"open",
    labels:["bounty"],body:"Submit a pull request to this repository. Payment released after merge."
  }],"2026-10-01T00:00:00Z");
  assert.ok(raw);
  assert.equal(raw.sourceKind,"authoritative");
});
