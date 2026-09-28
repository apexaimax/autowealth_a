import assert from "node:assert/strict"; import test from "node:test"; import {bootstrapSources,sourceEligible} from "./source-policy.js";
test("$0 bootstrap rejects sources requiring stake or deposit",()=>{const s=bootstrapSources.find(x=>x.id==="agentpay")!;assert.equal(sourceEligible(s,{realizedAvailableUsd:0}),false);});
test("$0 bootstrap permits zero-upfront source",()=>{const s=bootstrapSources.find(x=>x.id==="basedagents")!;assert.equal(sourceEligible(s,{realizedAvailableUsd:0}),true);});
