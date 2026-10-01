import test from "node:test";
import assert from "node:assert/strict";
import { observeEvidence, chooseCurrentEvidence } from "./commercial-evidence.js";

test("discovery source does not become authoritative evidence",()=>{
  const e=observeEvidence({canonicalSource:"https://search.example/result",sourceClass:"SEARCH",authoritative:false,observedAt:"2026-10-01T00:00:00Z",claim:"Company uses escrow workflow",contentDigest:"abc"});
  assert.equal(e.authoritative,false);
  assert.equal(e.verificationStatus,"UNVERIFIED");
});

test("new contradictory observation does not rewrite historical evidence",()=>{
  const older=observeEvidence({canonicalSource:"https://company.example/docs",sourceClass:"FIRST_PARTY",authoritative:true,observedAt:"2026-09-01T00:00:00Z",claim:"Manual upload required",contentDigest:"old"});
  const newer=observeEvidence({canonicalSource:"https://company.example/docs",sourceClass:"FIRST_PARTY",authoritative:true,observedAt:"2026-10-01T00:00:00Z",claim:"Automatic upload supported",contentDigest:"new",contradictionOf:older.evidenceId});
  const current=chooseCurrentEvidence([older,newer]);
  assert.equal(current?.evidenceId,newer.evidenceId);
  assert.notEqual(older.contentDigest,newer.contentDigest);
});
