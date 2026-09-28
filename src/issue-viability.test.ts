import assert from "node:assert/strict";
import test from "node:test";
import { verifyIssueViability } from "./issue-viability.js";
import type { Opportunity } from "./domain.js";

const opportunity:Opportunity={id:"x",title:"candidate",source:"scanner",expectedRevenueUsd:100,maxCostUsd:0,executable:true,evidence:[]};

test("rejects stale bounty whose authoritative issue is closed",()=>{
 const r=verifyIssueViability(opportunity,{state:"closed",locked:false,assignees:[],openCompetingPullRequests:0,checkedAt:"2026-09-28T00:00:00Z"});
 assert.equal(r.viable,false); assert.ok(r.reasons.includes("ISSUE_CLOSED"));
});

test("rejects active competition before wasting work",()=>{
 const r=verifyIssueViability(opportunity,{state:"open",locked:false,assignees:[],openCompetingPullRequests:1,checkedAt:"2026-09-28T00:00:00Z"});
 assert.equal(r.viable,false); assert.ok(r.reasons.includes("COMPETING_PR_EXISTS"));
});
