import test from "node:test";
import assert from "node:assert/strict";
import { createCommercialCandidate } from "./commercial-candidate.js";

function candidate(overrides:Record<string,unknown>={}){
  return createCommercialCandidate({
    organizationId:"org:acme",organization:"Acme",projectId:"proofrail",capabilityId:"narrow-write",
    problemIdentity:"ai-change-approval",verifiedWorkflow:"AI-assisted code changes require approval",
    problemEvidenceIds:["e1"],capabilityEvidenceId:"cap1",valueHypothesis:"reduce approval risk",
    commercialModel:"PAID_EVALUATION",expectedImplementationBurden:"LOW",
    recurringRevenuePotential:"UNKNOWN",licensingPotential:"POSSIBLE",
    ...overrides
  } as any);
}

test("Mode B candidate exists without a bounty or posted job",()=>{
  const c=candidate();
  assert.equal(c.organization,"Acme");
  assert.equal(c.buyerIntent.status,"UNKNOWN");
  assert.equal(c.paymentPath.status,"UNKNOWN");
  assert.equal(c.contact,undefined);
});

test("same commercial candidate discovered through different sources keeps one logical identity",()=>{
  const a=candidate({discoverySource:"search:a"});
  const b=candidate({discoverySource:"search:b"});
  assert.equal(a.id,b.id);
});

test("same organization for different capabilities remains distinct",()=>{
  const a=candidate({capabilityId:"narrow-write"});
  const b=candidate({capabilityId:"archive-compare",projectId:"version-vault"});
  assert.notEqual(a.id,b.id);
});
