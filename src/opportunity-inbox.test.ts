import test from "node:test";
import assert from "node:assert/strict";
import { emptyInbox,inboxKey,mergeInbox } from "./opportunity-inbox.js";

test("deduplicates repeated observations and preserves decision history",()=>{
 const key=inboxKey("github","https://github.com/a/b/issues/1?utm_source=x","Paid review");
 const first={key,title:"Paid review",url:"https://github.com/a/b/issues/1",source:"github",lane:"posted",decision:"NEEDS_VERIFICATION" as const,verificationNeeds:["PAYMENT_VERIFIABILITY"],observedAt:"2026-10-01T01:00:00Z"};
 const second={...first,decision:"PASS_TO_ECONOMICS" as const,verificationNeeds:[],observedAt:"2026-10-01T02:00:00Z"};
 const merged=mergeInbox(mergeInbox(emptyInbox(first.observedAt),[first],first.observedAt),[second],second.observedAt);
 assert.equal(merged.entries.length,1);
 assert.equal(merged.entries[0]!.observationCount,2);
 assert.equal(merged.entries[0]!.firstSeenAt,first.observedAt);
 assert.equal(merged.entries[0]!.decision,"PASS_TO_ECONOMICS");
 assert.deepEqual(merged.entries[0]!.previousDecisions,["NEEDS_VERIFICATION"]);
});
