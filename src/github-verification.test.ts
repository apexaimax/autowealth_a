import test from "node:test";
import assert from "node:assert/strict";
import { parseGitHubIssueUrl, resolveGitHubVerification } from "./github-verification.js";
import { normalizeRawOpportunity } from "./collector.js";
import { classifyCandidate } from "./discovery-policy.js";
import type { RawOpportunity } from "./collector.js";

const base:RawOpportunity={
  sourceId:"github:owner/repo",externalId:"7",title:"$1.5k bounty",
  url:"https://github.com/owner/repo/issues/7",sourceKind:"authoritative",
  category:"bounty",rewardType:"cash",advertisedRewardUsd:1500,
  requiresUpfrontSpend:"UNKNOWN",openStatus:"OPEN",participationMode:"ASSISTED",
  eligible:"UNKNOWN",deviceCompatible:"UNKNOWN",paymentVerifiable:"UNKNOWN",
  probabilityDependent:true,observedAt:"2026-10-01T00:00:00Z"
};

test("parses canonical GitHub issue URLs",()=>{
  assert.deepEqual(parseGitHubIssueUrl(base.url),{owner:"owner",repo:"repo",number:7});
  assert.equal(parseGitHubIssueUrl("https://example.com/job/7"),undefined);
});

test("maintainer evidence can resolve payment and no-upfront facts",()=>{
  const result=resolveGitHubVerification(base,{
    html_url:base.url,number:7,title:"$1.5k bounty",state:"open",locked:false,
    labels:[{name:"bounty"}],assignees:[],body:"Submit a pull request with the fix.",comments:1,
    repository_url:"https://api.github.com/repos/owner/repo"
  },[{
    body:"Free to participate. Payment will be released after acceptance. Comment here to claim the bounty.",
    html_url:base.url+"#issuecomment-1",author_association:"OWNER"
  }],{
    devices:["PHONE","TABLET"],workCapabilities:["GITHUB_REVIEW","CODE_ANALYSIS"],countries:["US"]
  });
  assert.equal(result.raw.requiresUpfrontSpend,false);
  assert.equal(result.raw.paymentVerifiable,true);
  assert.ok(result.claimInstructions.some(line=>/claim/i.test(line)));
});

test("untrusted comments cannot resolve payment facts",()=>{
  const result=resolveGitHubVerification(base,{
    html_url:base.url,number:7,title:"$1.5k bounty",state:"open",locked:false,
    labels:[{name:"bounty"}],assignees:[],body:"Paid bounty.",comments:1,
    repository_url:"https://api.github.com/repos/owner/repo"
  },[{
    body:"Payment will be released after acceptance. Free to participate.",
    html_url:base.url+"#issuecomment-2",author_association:"NONE"
  }]);
  assert.equal(result.raw.requiresUpfrontSpend,"UNKNOWN");
  assert.equal(result.raw.paymentVerifiable,"UNKNOWN");
});

test("closed issue is rejected after refresh",()=>{
  const result=resolveGitHubVerification(base,{
    html_url:base.url,number:7,title:"$1.5k bounty",state:"closed",locked:false,
    labels:[{name:"bounty"}],assignees:[],body:"Free to participate. Payment released after acceptance.",comments:0,
    repository_url:"https://api.github.com/repos/owner/repo"
  },[]);
  const collected=normalizeRawOpportunity(result.raw);
  const decision=classifyCandidate(collected.candidate);
  assert.equal(decision.decision,"REJECT");
  assert.ok(decision.reasons.includes("NOT_OPEN"));
});

test("absence of restrictions does not invent eligibility or device compatibility",()=>{
  const result=resolveGitHubVerification(base,{
    html_url:base.url,number:7,title:"$1.5k bounty",state:"open",locked:false,
    labels:[{name:"bounty"}],assignees:[],body:"Free to participate. Payment released after acceptance.",comments:0,
    repository_url:"https://api.github.com/repos/owner/repo"
  },[],{
    devices:["PHONE","TABLET"],workCapabilities:["GITHUB_REVIEW"],countries:["US"]
  });
  assert.equal(result.raw.eligible,"UNKNOWN");
  assert.equal(result.raw.deviceCompatible,"UNKNOWN");
});
