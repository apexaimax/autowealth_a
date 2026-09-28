import test from "node:test";
import assert from "node:assert/strict";
import { RevenueLedger, type Approval } from "./revenue-ledger.js";

function fixture(){
  const ledger=new RevenueLedger();
  const tx=ledger.discover("opp-1",{source:"authoritative",amount:200});
  const approval:Approval={transactionId:tx.id,opportunityId:tx.opportunityId,evidenceDigest:tx.evidenceDigest,approvedAt:"2026-09-28T22:00:00Z",approver:"owner"};
  return {ledger,tx,approval};
}

test("proves opportunity through verified payment to realized P&L",()=>{
  const {ledger,tx,approval}=fixture();
  ledger.approve(tx.id,approval);
  const authorized=ledger.authorize(tx.id,approval);
  ledger.recordExecution(tx.id,authorized.authorizationId!,"execution:123");
  ledger.verifyPayment(tx.id,"payment:456",200);
  const settled=ledger.settle(tx.id,35);
  assert.equal(settled.state,"SETTLED");
  assert.equal(settled.netProfitUsd,165);
});

test("approval is bound to exact opportunity evidence",()=>{
  const {ledger,tx,approval}=fixture();
  assert.throws(()=>ledger.approve(tx.id,{...approval,evidenceDigest:"tampered"}),/APPROVAL_BINDING_MISMATCH/);
});

test("changed approval cannot authorize execution",()=>{
  const {ledger,tx,approval}=fixture();
  ledger.approve(tx.id,approval);
  assert.throws(()=>ledger.authorize(tx.id,{...approval,approver:"someone-else"}),/APPROVAL_BINDING_MISMATCH/);
});

test("invalid transitions fail closed",()=>{
  const {ledger,tx}=fixture();
  assert.throws(()=>ledger.verifyPayment(tx.id,"payment:1",100),/INVALID_TRANSITION/);
  assert.throws(()=>ledger.settle(tx.id,0),/INVALID_TRANSITION/);
});

test("unverified or invalid payment cannot produce P&L",()=>{
  const {ledger,tx,approval}=fixture();
  ledger.approve(tx.id,approval);
  const authorized=ledger.authorize(tx.id,approval);
  ledger.recordExecution(tx.id,authorized.authorizationId!,"execution:1");
  assert.throws(()=>ledger.verifyPayment(tx.id,"",-1),/INVALID_PAYMENT_PROOF/);
  assert.throws(()=>ledger.settle(tx.id,10),/INVALID_TRANSITION/);
});

test("authorization cannot be consumed twice through state replay",()=>{
  const {ledger,tx,approval}=fixture();
  ledger.approve(tx.id,approval);
  ledger.authorize(tx.id,approval);
  assert.throws(()=>ledger.authorize(tx.id,approval),/INVALID_TRANSITION/);
});

test("transaction identity is deterministic for identical evidence",()=>{
  const ledger=new RevenueLedger();
  const a=ledger.discover("opp-1",{b:2,a:1});
  const b=ledger.discover("opp-1",{a:1,b:2});
  assert.equal(a.id,b.id);
});
