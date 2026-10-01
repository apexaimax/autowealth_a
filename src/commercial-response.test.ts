import test from "node:test";
import assert from "node:assert/strict";
import { classifyCommercialResponse, responseCreatesRealizedRevenue } from "./commercial-response.js";

test("autoresponder is not human commercial interest",()=>{
  const r=classifyCommercialResponse({kind:"AUTOMATED_RESPONSE",evidenceReference:"mail:1"});
  assert.equal(r.humanResponse,false);
  assert.equal(r.buyerIntentUpgrade,false);
});

test("support rejection is not technical evaluation",()=>{
  const r=classifyCommercialResponse({kind:"SUPPORT_CHANNEL_REJECTION",evidenceReference:"mail:2"});
  assert.equal(r.technicalEvaluation,false);
});

test("demo and pilot discussion are not payment",()=>{
  assert.equal(responseCreatesRealizedRevenue({kind:"DEMO_REQUEST",evidenceReference:"mail:3"}),false);
  assert.equal(responseCreatesRealizedRevenue({kind:"PILOT_DISCUSSION",evidenceReference:"mail:4"}),false);
  assert.equal(responseCreatesRealizedRevenue({kind:"PAYMENT_RECEIVED",evidenceReference:"mail:5"}),false);
});
