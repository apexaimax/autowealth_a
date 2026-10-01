import test from "node:test";
import assert from "node:assert/strict";
import { createCommercialEvent } from "./commercial-events.js";
import { projectCommercialFunnel } from "./commercial-projection.js";

test("funnel reports only stages that actually occurred",()=>{
 const events=[
  createCommercialEvent({kind:"CANDIDATE_QUALIFIED",subjectId:"c1",logicalKey:"c1",payload:{},occurredAt:"2026-10-01T00:00:00Z"}),
  createCommercialEvent({kind:"PROPOSAL_PREPARED",subjectId:"p1",logicalKey:"p1",payload:{candidateId:"c1"},occurredAt:"2026-10-01T00:01:00Z"}),
  createCommercialEvent({kind:"PROPOSAL_APPROVED",subjectId:"p1",logicalKey:"p1:approval",payload:{candidateId:"c1"},occurredAt:"2026-10-01T00:02:00Z"})
 ];
 const funnel=projectCommercialFunnel(events);
 assert.equal(funnel.qualifiedCandidates,1);
 assert.equal(funnel.proposalsPrepared,1);
 assert.equal(funnel.proposalsApproved,1);
 assert.equal(funnel.externallySent,0);
 assert.equal(funnel.verifiedPayments,0);
 assert.equal(funnel.realizedNetPnlUsd,0);
});
