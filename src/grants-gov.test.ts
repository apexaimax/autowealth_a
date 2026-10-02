import test from "node:test";
import assert from "node:assert/strict";
import { fetchGrantsGovOpportunities } from "./grants-gov.js";

test("keeps only open eligible opportunities and preserves official provenance", async () => {
  const calls:string[]=[];
  const fetcher=async (input:string|URL|Request,init?:RequestInit) => {
    const url=String(input);calls.push(url);
    const body=JSON.parse(String(init?.body??"{}"));
    if(url.endsWith("/search2")){
      return new Response(JSON.stringify({errorcode:0,data:{oppHits:[
        {id:"361238",number:"26-503",title:"AI and Cybersecurity Innovation",agencyCode:"NSF",agencyName:"National Science Foundation",openDate:"02/04/2026",closeDate:"04/05/2027",oppStatus:"posted",docType:"synopsis",alnist:["47.076"]},
        {id:"closed-1",number:"OLD-1",title:"Expired AI grant",agencyCode:"TEST",agencyName:"Test Agency",openDate:"01/01/2026",closeDate:"09/01/2026",oppStatus:"posted",docType:"synopsis",alnist:[]}
      ]}}),{status:200});
    }
    if(url.endsWith("/fetchOpportunity") && body.opportunityId==="361238"){
      return new Response(JSON.stringify({errorcode:0,data:{id:361238,opportunityNumber:"26-503",opportunityTitle:"AI and Cybersecurity Innovation",synopsis:{applicantTypes:[{id:"22",description:"For profit organizations other than small businesses"},{id:"23",description:"Small businesses"},{id:"99",description:"Unrestricted"}]}}}),{status:200});
    }
    throw new Error("unexpected request");
  };

  const result=await fetchGrantsGovOpportunities(["artificial intelligence"],"2026-10-01T12:00:00.000Z",["22","23","99"],fetcher as typeof fetch);

  assert.equal(calls.length,2);
  assert.equal(result.failures.length,0);
  assert.equal(result.signals.length,1);
  assert.equal(result.signals[0]?.sourceId,"grants-gov");
  assert.equal(result.signals[0]?.recordId,"361238");
  assert.equal(result.signals[0]?.recordType,"federal-grant-opportunity");
  assert.equal(result.signals[0]?.officialUrl,"https://www.grants.gov/search-results-detail/361238");
  assert.equal(result.signals[0]?.organizationName,"National Science Foundation");
  assert.equal(result.signals[0]?.facts.opportunityNumber,"26-503");
  assert.equal(result.signals[0]?.facts.closeDate,"2027-04-05");
});

test("fails closed for malformed search responses instead of emitting leads", async () => {
  const fetcher=async () => new Response(JSON.stringify({unexpected:true}),{status:200});
  const result=await fetchGrantsGovOpportunities(["cybersecurity"],"2026-10-01T12:00:00.000Z",["23"],fetcher as typeof fetch);
  assert.equal(result.signals.length,0);
  assert.equal(result.failures.length,1);
});

test("does not emit an opportunity when eligibility details cannot be verified", async () => {
  const fetcher=async (input:string|URL|Request) => {
    if(String(input).endsWith("/search2")) return new Response(JSON.stringify({errorcode:0,data:{oppHits:[{id:"1",number:"X",title:"AI",agencyCode:"A",agencyName:"Agency",openDate:"09/01/2026",closeDate:"12/01/2026",oppStatus:"posted",docType:"synopsis",alnist:[]}]}}),{status:200});
    return new Response(JSON.stringify({errorcode:0,data:{id:1,synopsis:{applicantTypes:[]}}}),{status:200});
  };
  const result=await fetchGrantsGovOpportunities(["AI"],"2026-10-01T12:00:00.000Z",["23"],fetcher as typeof fetch);
  assert.equal(result.signals.length,0);
  assert.equal(result.failures.length,1);
});
