import test from "node:test";
import assert from "node:assert/strict";
import { customerLeadProfileFromEnv } from "./customer-lead-profile-config.js";

test("loads a dedicated customer lead profile without mixing capability-profile fields",()=>{
 const p=customerLeadProfileFromEnv({REVENUE_CUSTOMER_ID:"acme",REVENUE_CUSTOMER_NAME:"Acme",REVENUE_CUSTOMER_OFFER:"workflow automation",REVENUE_CUSTOMER_INDUSTRIES:"healthcare,software",REVENUE_CUSTOMER_PROBLEMS:"manual workflow",REVENUE_CUSTOMER_SOLUTIONS:"automation"} as NodeJS.ProcessEnv);
 assert.equal(p?.id,"acme");assert.deepEqual(p?.targetIndustries,["healthcare","software"]);assert.deepEqual(p?.problemTerms,["manual workflow"]);
});
test("fails closed when only part of a customer profile is configured",()=>{
 assert.throws(()=>customerLeadProfileFromEnv({REVENUE_CUSTOMER_ID:"acme"} as NodeJS.ProcessEnv),/required together/);
});
