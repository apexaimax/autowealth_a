import assert from "node:assert/strict"; import test from "node:test"; import {evaluateOpportunity,realizePnL} from "./profitability-gate.js"; import type {GatePolicy,Opportunity} from "./domain.js";
const policy:GatePolicy={minimumNetUsd:1,minimumMarginRatio:.2,requireFundedEvidence:true};
const funded:Opportunity={id:"opp-1",title:"Funded research task",source:"market",expectedRevenueUsd:25,maxCostUsd:2,executable:true,evidence:[{id:"e-1",kind:"escrow",source:"verified-task",observedAt:"2026-09-28T00:00:00Z",amountUsd:25}]};
test("allows funded profitable executable work",()=>{const r=evaluateOpportunity(funded,policy);assert.equal(r.decision,"ALLOW");assert.equal(r.expectedNetUsd,23);});
test("denies demand without funded evidence",()=>{const r=evaluateOpportunity({...funded,evidence:[{id:"e-2",kind:"market_demand",source:"report",observedAt:"2026-09-28T00:00:00Z"}]},policy);assert.equal(r.decision,"DENY");assert.ok(r.reasons.includes("NO_PAYMENT_EVIDENCE"));});
test("denies unexecutable work",()=>{assert.equal(evaluateOpportunity({...funded,executable:false},policy).decision,"DENY");});
test("unpaid projection is not realized revenue",()=>{const p=realizePnL({opportunityId:"opp-1",status:"UNPAID",grossRevenueUsd:25,actualCostUsd:2});assert.equal(p.grossRevenueUsd,0);assert.equal(p.netProfitUsd,-2);});
test("verified payment realizes profit",()=>{const p=realizePnL({opportunityId:"opp-1",status:"PAID",grossRevenueUsd:25,actualCostUsd:2,paymentReference:"receipt-123"});assert.equal(p.verifiedPaid,true);assert.equal(p.netProfitUsd,23);});
