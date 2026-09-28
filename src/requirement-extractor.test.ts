import test from "node:test";
import assert from "node:assert/strict";
import { extractExplicitRequirements } from "./requirement-extractor.js";

const ref="https://example.test/task";

test("extracts explicit requirements",()=>{
 const r=extractExplicitRequirements("US applicants only. Desktop required. QA experience required.",ref);
 assert.deepEqual(r.requirements.allowedCountries,["US"]);
 assert.deepEqual(r.requirements.requiredDevices,["DESKTOP"]);
 assert.deepEqual(r.requirements.requiredWorkCapabilities,["QA"]);
 assert.equal(r.evidence.length,3);
});

test("descriptive mentions are not requirements",()=>{
 const r=extractExplicitRequirements("We build browser tools. Testing is helpful.",ref);
 assert.deepEqual(r.requirements,{});
 assert.equal(r.evidence.length,0);
});

test("extracts explicit local environment requirement",()=>{
 const r=extractExplicitRequirements("Local development required.",ref);
 assert.deepEqual(r.requirements.requiredDevices,["LOCAL_DEV"]);
});
