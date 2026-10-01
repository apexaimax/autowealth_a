import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryCasEventStore, type DurableEventStore } from "./commercial-persistence.js";
import { createCommercialEvent } from "./commercial-events.js";

function event(key:string){
 return createCommercialEvent({kind:"CANDIDATE_QUALIFIED",subjectId:key,logicalKey:key,payload:{},occurredAt:"2026-10-01T00:00:00Z"});
}

test("compare-and-swap rejects stale competing writer",async()=>{
 const store:DurableEventStore=new InMemoryCasEventStore();
 const a=await store.read();
 const b=await store.read();
 const first=await store.commit(a.version,[event("a")]);
 assert.equal(first.status,"COMMITTED");
 const stale=await store.commit(b.version,[event("b")]);
 assert.equal(stale.status,"STALE");
 const current=await store.read();
 assert.deepEqual(current.events.map(e=>e.subjectId),["a"]);
});

test("retrying same logical event does not duplicate it",async()=>{
 const store=new InMemoryCasEventStore();
 let view=await store.read();
 const e=event("same");
 await store.commit(view.version,[e]);
 view=await store.read();
 const retry=await store.commit(view.version,[e]);
 assert.equal(retry.status,"COMMITTED");
 const current=await store.read();
 assert.equal(current.events.length,1);
});
