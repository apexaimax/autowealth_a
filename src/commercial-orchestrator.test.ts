import test from "node:test";
import assert from "node:assert/strict";
import { prepareCommercialPackage } from "./commercial-orchestrator.js";
import { createCommercialCandidate, withVerifiedContact } from "./commercial-candidate.js";
import type { CapabilityEvidence } from "./capability-evidence.js";

const capability:CapabilityEvidence={
 projectId:"proofrail",capabilityId:"narrow-write",description:"restricted branch write",
 evidenceLevel:"LIVE_VERIFIED",evidenceReferences:["receipt:1"],demonstratedScope:["branch-scoped write"],
 limitations:["no protected branch merge"],signals:["approval"],commercialApplications:["controlled AI changes"]
};
function candidate(){
 return createCommercialCandidate({
  organizationId:"org:acme",organization:"Acme",projectId:"proofrail",capabilityId:"narrow-write",
  problemIdentity:"approval",verifiedWorkflow:"AI changes require approval",problemEvidenceIds:["e1"],
  capabilityEvidenceId:"cap1",valueHypothesis:"reduce change risk",commercialModel:"PAID_EVALUATION",
  expectedImplementationBurden:"LOW",recurringRevenuePotential:"UNKNOWN",licensingPotential:"POSSIBLE"
 });
}

test("qualified candidate with verified contact can prepare exact proposal without sending",()=>{
 const c=withVerifiedContact(candidate(),{route:"email:buyer@example.test",type:"EMAIL",intendedRole:"engineering",evidenceId:"contact:1",publiclyVerified:true});
 const result=prepareCommercialPackage({
  candidate:c,capability,externalProblemEvidence:"AUTHORITATIVE",commercialModelPlausible:true,authoritativeContradiction:false,
  proposal:{recipient:"buyer@example.test",contactRoute:"email:buyer@example.test",subject:"Paid evaluation",body:"Exact proposal",links:["https://example.test/evidence"],attachments:[]}
 });
 assert.equal(result.fit.status,"QUALIFIED");
 assert.ok(result.proposal);
 assert.equal(result.proposal?.subject,"Paid evaluation");
 assert.equal("send" in result,false);
});

test("missing verified contact blocks proposal preparation",()=>{
 const result=prepareCommercialPackage({
  candidate:candidate(),capability,externalProblemEvidence:"AUTHORITATIVE",commercialModelPlausible:true,authoritativeContradiction:false,
  proposal:{recipient:"buyer@example.test",contactRoute:"email:buyer@example.test",subject:"Paid evaluation",body:"Exact proposal",links:[],attachments:[]}
 });
 assert.equal(result.proposal,undefined);
 assert.ok(result.proposalBlockers.includes("MISSING_VERIFIED_CONTACT"));
});

test("rejected commercial fit never produces a proposal",()=>{
 const c=withVerifiedContact(candidate(),{route:"email:buyer@example.test",type:"EMAIL",intendedRole:"engineering",evidenceId:"contact:1",publiclyVerified:true});
 const result=prepareCommercialPackage({
  candidate:c,capability,externalProblemEvidence:"AUTHORITATIVE",commercialModelPlausible:true,authoritativeContradiction:true,
  proposal:{recipient:"buyer@example.test",contactRoute:"email:buyer@example.test",subject:"Paid evaluation",body:"Exact proposal",links:[],attachments:[]}
 });
 assert.equal(result.fit.status,"REJECTED");
 assert.equal(result.proposal,undefined);
});
