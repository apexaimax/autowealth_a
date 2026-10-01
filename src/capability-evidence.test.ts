import test from "node:test";
import assert from "node:assert/strict";
import { createCapability, capabilityClaimAllowed, type CapabilityEvidence } from "./capability-evidence.js";

const evidence:CapabilityEvidence={
  projectId:"proofrail",capabilityId:"narrow-write",description:"Restricted approved branch-scoped write",
  evidenceLevel:"LIVE_VERIFIED",evidenceReferences:["receipt:1"],demonstratedScope:["branch-scoped write"],
  limitations:["no protected/default branch merge"],signals:["approval","authorization"],commercialApplications:["controlled AI change"]
};

test("capability evidence stays scoped to the capability",()=>{
  const cap=createCapability(evidence);
  assert.equal(cap.evidenceLevel,"LIVE_VERIFIED");
  assert.deepEqual(cap.limitations,["no protected/default branch merge"]);
});

test("unsupported claims fail closed even when project is mature",()=>{
  const cap=createCapability(evidence);
  assert.equal(capabilityClaimAllowed(cap,"protected/default branch merge"),false);
  assert.equal(capabilityClaimAllowed(cap,"branch-scoped write"),true);
});
