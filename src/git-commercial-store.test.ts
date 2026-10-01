import test from "node:test";
import assert from "node:assert/strict";
import { GitCommercialEventStore, type GitStateTransport } from "./git-commercial-store.js";
import { createCommercialEvent } from "./commercial-events.js";

class FakeTransport implements GitStateTransport {
  version="v1";
  events:any[]=[];
  async read(){return {version:this.version,events:[...this.events]};}
  async commit(expectedVersion:string,events:any[]){
    if(expectedVersion!==this.version) return {status:"STALE" as const,version:this.version};
    for(const e of events) if(!this.events.some(x=>x.id===e.id)) this.events.push(e);
    this.version="v"+(Number(this.version.slice(1))+1);
    return {status:"COMMITTED" as const,version:this.version};
  }
}
function event(key:string){return createCommercialEvent({kind:"CANDIDATE_QUALIFIED",subjectId:key,logicalKey:key,payload:{},occurredAt:"2026-10-01T00:00:00Z"});}

test("git store survives reconstruction when transport state persists",async()=>{
 const transport=new FakeTransport();
 const first=new GitCommercialEventStore(transport);
 const view=await first.read();
 await first.commit(view.version,[event("a")]);
 const second=new GitCommercialEventStore(transport);
 const reconstructed=await second.read();
 assert.deepEqual(reconstructed.events.map(e=>e.subjectId),["a"]);
});

test("git store exposes stale writer conflict without last-writer-wins",async()=>{
 const transport=new FakeTransport();
 const a=new GitCommercialEventStore(transport);
 const b=new GitCommercialEventStore(transport);
 const av=await a.read();
 const bv=await b.read();
 assert.equal((await a.commit(av.version,[event("a")])).status,"COMMITTED");
 assert.equal((await b.commit(bv.version,[event("b")])).status,"STALE");
 assert.deepEqual((await a.read()).events.map(e=>e.subjectId),["a"]);
});
