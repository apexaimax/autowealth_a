import test from "node:test";
import assert from "node:assert/strict";
import { appendCommercialEvent, createCommercialEvent } from "./commercial-events.js";

function prepared(digest:string){
 return createCommercialEvent({kind:"PROPOSAL_PREPARED",subjectId:"proposal:1",logicalKey:"prepared:"+digest,payload:{proposalDigest:digest,candidateId:"c1"},occurredAt:"2026-10-01T00:00:00Z"});
}
function approved(digest:string){
 return createCommercialEvent({kind:"PROPOSAL_APPROVED",subjectId:"proposal:1",logicalKey:"approved:"+digest,payload:{proposalDigest:digest,candidateId:"c1"},occurredAt:"2026-10-01T00:01:00Z"});
}
function sent(digest:string){
 return createCommercialEvent({kind:"OUTREACH_SENT",subjectId:"proposal:1",logicalKey:"sent:"+digest,payload:{proposalDigest:digest,externalReference:"human-recorded:1"},occurredAt:"2026-10-01T00:02:00Z"});
}

test("outreach record cannot occur without exact prior approval",()=>{
 assert.throws(()=>appendCommercialEvent([],sent("p1")),/OUTREACH_REQUIRES_EXACT_APPROVAL/);
});

test("approval requires the exact prepared proposal digest",()=>{
 const history=appendCommercialEvent([],prepared("p1"));
 assert.throws(()=>appendCommercialEvent(history,approved("p2")),/APPROVAL_REQUIRES_PREPARED_PROPOSAL/);
});

test("approval for proposal A cannot authorize outreach record for proposal B",()=>{
 let history=appendCommercialEvent([],prepared("p1"));
 history=appendCommercialEvent(history,approved("p1"));
 assert.throws(()=>appendCommercialEvent(history,sent("p2")),/OUTREACH_REQUIRES_EXACT_APPROVAL/);
});

test("human-recorded outreach after exact approval is accepted without adding a sender",()=>{
 let history=appendCommercialEvent([],prepared("p1"));
 history=appendCommercialEvent(history,approved("p1"));
 history=appendCommercialEvent(history,sent("p1"));
 assert.equal(history.at(-1)?.kind,"OUTREACH_SENT");
});
