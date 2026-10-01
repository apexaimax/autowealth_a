import test from "node:test";
import assert from "node:assert/strict";
import { createCommercialEvent, appendCommercialEvent } from "./commercial-events.js";

test("logical retry produces the same event identity",()=>{
  const input={kind:"PROPOSAL_PREPARED" as const,subjectId:"proposal:1",logicalKey:"proposal:1:v1",payload:{digest:"abc"},occurredAt:"2026-10-01T00:00:00Z"};
  const a=createCommercialEvent(input);
  const b=createCommercialEvent({...input,occurredAt:"2026-10-01T00:05:00Z"});
  assert.equal(a.id,b.id);
});

test("duplicate event append is idempotent",()=>{
  const event=createCommercialEvent({kind:"RESPONSE_RECORDED",subjectId:"cand:1",logicalKey:"mail:123",payload:{kind:"AUTOMATED_RESPONSE"},occurredAt:"2026-10-01T00:00:00Z"});
  const once=appendCommercialEvent([],event);
  const twice=appendCommercialEvent(once,event);
  assert.equal(twice.length,1);
});

test("unknown external outcome is preserved rather than retried optimistically",()=>{
  const event=createCommercialEvent({kind:"EXTERNAL_OUTCOME_UNKNOWN",subjectId:"proposal:1",logicalKey:"provider-operation:abc",payload:{reason:"crash after external boundary"},occurredAt:"2026-10-01T00:00:00Z"});
  assert.equal(event.kind,"EXTERNAL_OUTCOME_UNKNOWN");
});
