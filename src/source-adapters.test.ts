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
