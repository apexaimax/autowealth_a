import test from "node:test";
import assert from "node:assert/strict";
import { createCommercialCandidate, withBuyerIntentEvidence, withPaymentPathEvidence, withVerifiedContact } from "./commercial-candidate.js";

const base=createCommercialCandidate({
  organizationId:"org:acme",organization:"Acme",projectId:"proofrail",capabilityId:"narrow-write",
  problemIdentity:"approval",verifiedWorkflow:"AI changes require approval",problemEvidenceIds:["e1"],
  capabilityEvidenceId:"cap1",valueHypothesis:"reduce change risk",commercialModel:"PAID_EVALUATION",
  expectedImplementationBurden:"LOW",recurringRevenuePotential:"UNKNOWN",licensingPotential:"POSSIBLE"
});

test("buyer intent stays UNKNOWN for non-authoritative evidence",()=>{
 const updated=withBuyerIntentEvidence(base,{evidenceId:"search:1",status:"EXPLICIT",authoritative:false});
 assert.equal(updated.buyerIntent.status,"UNKNOWN");
});

test("authoritative explicit buyer evidence upgrades intent",()=>{
 const updated=withBuyerIntentEvidence(base,{evidenceId:"buyer:1",status:"EXPLICIT",authoritative:true});
 assert.equal(updated.buyerIntent.status,"EXPLICIT");
 assert.deepEqual(updated.buyerIntent.evidenceIds,["buyer:1"]);
});

test("payment path only upgrades from authoritative evidence",()=>{
 assert.equal(withPaymentPathEvidence(base,{evidenceId:"guess",status:"VERIFIED",authoritative:false}).paymentPath.status,"UNKNOWN");
 assert.equal(withPaymentPathEvidence(base,{evidenceId:"official",status:"VERIFIED",authoritative:true}).paymentPath.status,"VERIFIED");
});

test("contact route remains missing unless publicly verified",()=>{
 assert.equal(withVerifiedContact(base,{route:"email:x@example.test",type:"EMAIL",intendedRole:"engineering",evidenceId:"e",publiclyVerified:false}).contact,undefined);
 const updated=withVerifiedContact(base,{route:"email:x@example.test",type:"EMAIL",intendedRole:"engineering",evidenceId:"e",publiclyVerified:true});
 assert.equal(updated.contact?.route,"email:x@example.test");
});
