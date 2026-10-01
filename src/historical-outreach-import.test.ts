import test from "node:test";
import assert from "node:assert/strict";
import { importHistoricalOutreach } from "./historical-outreach-import.js";

test("duplicate historical import is idempotent and provenance labelled",()=>{
 const record={sourceSystem:"gmail",sourceRecordId:"msg-1",projectId:"proofrail",direction:"OUTBOUND" as const,occurredAt:"2026-09-29T00:00:00Z",responseKind:"NO_RESPONSE" as const};
 const events=importHistoricalOutreach([record,record]);
 assert.equal(events.length,1);
 assert.equal(events[0]?.kind,"HISTORICAL_OUTREACH_IMPORTED");
 assert.equal(events[0]?.payload.provenance,"HISTORICAL_EXTERNAL");
});

test("historical response classes remain distinct",()=>{
 const events=importHistoricalOutreach([
  {sourceSystem:"gmail",sourceRecordId:"msg-2",projectId:"version-vault",direction:"INBOUND",occurredAt:"2026-10-01T00:00:00Z",responseKind:"AUTOMATED_RESPONSE"},
  {sourceSystem:"gmail",sourceRecordId:"msg-3",projectId:"fieldbridge-studio",direction:"INBOUND",occurredAt:"2026-10-01T00:00:01Z",responseKind:"SUPPORT_CHANNEL_REJECTION"}
 ]);
 assert.equal(events[0]?.payload.responseKind,"AUTOMATED_RESPONSE");
 assert.equal(events[1]?.payload.responseKind,"SUPPORT_CHANNEL_REJECTION");
});
