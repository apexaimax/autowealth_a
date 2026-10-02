import test from "node:test";
import assert from "node:assert/strict";
import { fetchGrantsGovOpportunities } from "./grants-gov.js";

test("keeps only open eligible opportunities and preserves official provenance", async () => {
  const calls: Array<{url:string;body:any}> = [];
  const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({url:String(input),body:JSON.parse(String(init?.body ?? "{}"))});
    return new Response(JSON.stringify({
      data: {
        oppHits: [
          {
            id:"361238",
            number:"26-503",
            title:"AI and Cybersecurity Innovation",
            agency:"NSF",
            openDate:"02/04/2026",
            closeDate:"04/05/2027",
            oppStatus:"posted",
            applicantTypes:["22","23","99"]
          },
          {
            id:"closed-1",
            number:"OLD-1",
            title:"Expired AI grant",
            agency:"TEST",
            openDate:"01/01/2026",
            closeDate:"09/01/2026",
            oppStatus:"posted",
            applicantTypes:["23"]
          }
        ]
      }
    }),{status:200,headers:{"content-type":"application/json"}});
  };

  const result=await fetchGrantsGovOpportunities(
    ["artificial intelligence"],
    "2026-10-01T12:00:00.000Z",
    ["22","23","99"],
    fetcher as typeof fetch
  );

  assert.equal(calls.length,1);
  assert.equal(result.failures.length,0);
  assert.equal(result.signals.length,1);
  assert.equal(result.signals[0]?.sourceId,"grants-gov");
  assert.equal(result.signals[0]?.recordId,"361238");
  assert.equal(result.signals[0]?.recordType,"federal-grant-opportunity");
  assert.equal(result.signals[0]?.officialUrl,"https://www.grants.gov/search-results-detail/361238");
  assert.equal(result.signals[0]?.facts.opportunityNumber,"26-503");
  assert.equal(result.signals[0]?.facts.closeDate,"2027-04-05");
});

test("fails closed for malformed responses instead of emitting leads", async () => {
  const fetcher=async () => new Response(JSON.stringify({unexpected:true}),{status:200});
  const result=await fetchGrantsGovOpportunities(
    ["cybersecurity"],
    "2026-10-01T12:00:00.000Z",
    ["23"],
    fetcher as typeof fetch
  );
  assert.equal(result.signals.length,0);
  assert.equal(result.failures.length,1);
});
