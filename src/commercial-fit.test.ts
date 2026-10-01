import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCommercialFit } from "./commercial-fit.js";
import type { CapabilityEvidence } from "./capability-evidence.js";
import { createCommercialCandidate } from "./commercial-candidate.js";

const candidate=createCommercialCandidate({
  organizationId:"org:acme",organization:"Acme",projectId:"proofrail",capabilityId:"narrow-write",
  problemIdentity:"ai-change-approval",verifiedWorkflow:"AI changes require approval",
  problemEvidenceIds:["e1"],capabilityEvidenceId:"cap1",valueHypothesis:"reduce unsafe changes",
  commercialModel:"PAID_EVALUATION",expectedImplementationBurden:"LOW",
  recurringRevenuePotential:"UNKNOWN",licensingPotential:"POSSIBLE"
});

function capability(level:CapabilityEvidence["evidenceLevel"]="LIVE_VERIFIED"):CapabilityEvidence {
 return {projectId:"proofrail",capabilityId:"narrow-write",description:"restricted branch write",
  evidenceLevel:level,evidenceReferences:["receipt:1"],demonstratedScope:["branch-scoped write"],
  limitations:["no protected branch merge"],signals:["approval"],commercialApplications:["controlled AI changes"]};
}

test("keyword overlap alone cannot qualify a strong commercial fit",()=>{
  const r=evaluateCommercialFit({candidate,capability:capability(),externalProblemEvidence:"KEYWORD_ONLY",commercialModelPlausible:true,authoritativeContradiction:false});
  assert.notEqual(r.status,"QUALIFIED");
});

test("unverified capability fails closed",()=>{
  const r=evaluateCommercialFit({candidate,capability:capability("UNVERIFIED"),externalProblemEvidence:"AUTHORITATIVE",commercialModelPlausible:true,authoritativeContradiction:false});
  assert.equal(r.status,"REJECTED");
  assert.ok(r.reasons.includes("CAPABILITY_NOT_SUPPORTED"));
});

test("authoritative contradiction rejects the thesis",()=>{
  const r=evaluateCommercialFit({candidate,capability:capability(),externalProblemEvidence:"AUTHORITATIVE",commercialModelPlausible:true,authoritativeContradiction:true});
  assert.equal(r.status,"REJECTED");
  assert.ok(r.reasons.includes("AUTHORITATIVE_CONTRADICTION"));
});

test("supported capability plus authoritative problem and plausible model can qualify without invented revenue",()=>{
  const r=evaluateCommercialFit({candidate,capability:capability(),externalProblemEvidence:"AUTHORITATIVE",commercialModelPlausible:true,authoritativeContradiction:false});
  assert.equal(r.status,"QUALIFIED");
  assert.equal(r.expectedRevenueUsd,undefined);
});
