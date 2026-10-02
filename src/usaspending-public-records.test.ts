import test from "node:test";
import assert from "node:assert/strict";
import { fetchUsaSpendingContractAwards } from "./usaspending-public-records.js";

test("USAspending adapter preserves official provenance and dedupes awards",async()=>{
  const calls:any[]=[];
  const fetcher=async(_url:any,init:any)=>{
    calls.push(JSON.parse(init.body));
    return new Response(JSON.stringify({results:[
      {"Award ID":"ABC123","Recipient Name":"Example Corp","Description":"AI workflow support","Award Amount":50000,"Awarding Agency":"Example Agency","Base Obligation Date":"2026-09-30","Last Modified Date":"2026-10-01"},
      {"Award ID":"ABC123","Recipient Name":"Example Corp","Description":"AI workflow support","Award Amount":50000}
    ]}),{status:200,headers:{"content-type":"application/json"}});
  };
  const out=await fetchUsaSpendingContractAwards(["AI workflow"],"2026-09-01","2026-10-01","2026-10-01T12:00:00Z",fetcher as typeof fetch);
  assert.equal(out.failures.length,0);
  assert.equal(out.signals.length,1);
  assert.equal(out.signals[0]?.recordId,"ABC123");
  assert.equal(out.signals[0]?.sourceId,"usaspending-federal-awards");
  assert.equal(out.signals[0]?.facts.matchedKeyword,"AI workflow");
  assert.deepEqual(calls[0].filters.award_type_codes,["A","B","C","D"]);
});

test("USAspending adapter fails per keyword without discarding other results",async()=>{
  let n=0;
  const fetcher=async()=>{
    n++;
    if(n===1)return new Response("bad",{status:500,statusText:"Server Error"});
    return new Response(JSON.stringify({results:[{"Award ID":"OK1"}]}),{status:200});
  };
  const out=await fetchUsaSpendingContractAwards(["bad","good"],"2026-09-01","2026-10-01","2026-10-01T12:00:00Z",fetcher as typeof fetch);
  assert.equal(out.failures.length,1);
  assert.equal(out.signals.length,1);
});
