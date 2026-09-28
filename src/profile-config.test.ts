import test from "node:test";
import assert from "node:assert/strict";
import { profileFromEnv } from "./profile-config.js";

test("empty environment leaves profile disabled",()=>{
 assert.equal(profileFromEnv({}),undefined);
});

test("runtime profile parses generic capability flags",()=>{
 const p=profileFromEnv({
  REVENUE_PROFILE_DEVICES:"PHONE,TABLET",
  REVENUE_PROFILE_WORK:"QA,GITHUB_REVIEW",
  REVENUE_PROFILE_COUNTRIES:"US"
 });
 assert.deepEqual(p,{devices:["PHONE","TABLET"],workCapabilities:["QA","GITHUB_REVIEW"],countries:["US"]});
});

test("unknown capability fails closed",()=>{
 assert.throws(()=>profileFromEnv({REVENUE_PROFILE_DEVICES:"MAGIC_DEVICE"}),/Invalid device capability/);
});
