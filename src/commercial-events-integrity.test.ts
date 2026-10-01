import test from "node:test";
import assert from "node:assert/strict";
import { appendCommercialEvent, createCommercialEvent } from "./commercial-events.js";

test("tampered event digest fails closed before append",()=>{
 const event=createCommercialEvent({kind:"CANDIDATE_QUALIFIED",subjectId:"c1",logicalKey:"c1",payload:{},occurredAt:"2026-10-01T00:00:00Z"});
 assert.throws(()=>appendCommercialEvent([], {...event,id:"tampered"}),/CORRUPT_EVENT_DIGEST/);
});
