import test from "node:test";
import assert from "node:assert/strict";
import { qualifyPublicRecordForCustomer } from "./customer-public-records.js";
import type { CustomerLeadProfile } from "./customer-leads.js";
import type { PublicRecordSignal } from "./public-records.js";

const extensionProfile:CustomerLeadProfile={id:"extension-consultant",name:"Extension Consultant",offer:"Browser extension workflow automation",targetIndustries:["healthcare","software"],targetRoles:["operations"],targetRegions:["us"],problemTerms:["manual workflow","browser extension"],solutionTerms:["automation","chrome"],exclusions:["internship"]};
const roofingProfile:CustomerLeadProfile={id:"roofer",name:"Roofer",offer:"Commercial roofing",targetIndustries:["construction"],targetRoles:["facilities"],targetRegions:["new jersey"],problemTerms:["roof"],solutionTerms:["roofing"],exclusions:[]};

const record:PublicRecordSignal={sourceId:"grants-gov",recordId:"361238",recordType:"federal-grant-opportunity",officialUrl:"https://www.grants.gov/search-results-detail/361238",organizationName:"Health Software Agency",jurisdiction:"United States",retrievedAt:"2026-10-02T00:00:00Z",facts:{title:"Healthcare browser extension automation",matchedKeyword:"browser automation software",opportunityNumber:"26-503"}};

test("matches a public record to the relevant customer but never promotes research evidence to qualified buyer intent",()=>{
 const lead=qualifyPublicRecordForCustomer(extensionProfile,record);
 assert.equal(lead.customerProfileId,"extension-consultant");
 assert.equal(lead.decision,"RESEARCH_SEED");
 assert.equal(lead.evidenceKind,"RESEARCH");
 assert.ok(lead.fitReasons.length>0);
 assert.ok(lead.unknowns.includes("BUYER_INTENT"));
 assert.ok(lead.unknowns.includes("CONTACTABILITY"));
});

test("rejects the same public record for an unrelated customer profile",()=>{
 const lead=qualifyPublicRecordForCustomer(roofingProfile,record);
 assert.equal(lead.customerProfileId,"roofer");
 assert.equal(lead.decision,"REJECT");
});

test("keeps customer-specific keys isolated for the same public record",()=>{
 const a=qualifyPublicRecordForCustomer(extensionProfile,record);
 const b=qualifyPublicRecordForCustomer({...extensionProfile,id:"extension-consultant-2"},record);
 assert.notEqual(a.key,b.key);
});
