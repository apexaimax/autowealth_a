import type { PublicRecordSignal } from "./public-records.js";

interface UsaSpendingRow {
  "Award ID"?:string;
  "Recipient Name"?:string;
  "Description"?:string;
  "Award Amount"?:number;
  "Awarding Agency"?:string;
  "Base Obligation Date"?:string;
  "Last Modified Date"?:string;
}
interface UsaSpendingResponse { results?:UsaSpendingRow[]; }

export interface UsaSpendingFetchResult {
  signals:PublicRecordSignal[];
  failures:{keyword:string;error:string}[];
}

const ENDPOINT="https://api.usaspending.gov/api/v2/search/spending_by_award/";

export async function fetchUsaSpendingContractAwards(
  keywords:readonly string[],
  startDate:string,
  endDate:string,
  retrievedAt:string,
  fetcher:typeof fetch=fetch
):Promise<UsaSpendingFetchResult>{
  const signals:PublicRecordSignal[]=[];
  const failures:{keyword:string;error:string}[]=[];
  for(const rawKeyword of [...new Set(keywords.map(x=>x.trim()).filter(Boolean))].slice(0,8)){
    try{
      const response=await fetcher(ENDPOINT,{
        method:"POST",
        headers:{"content-type":"application/json","user-agent":"revenue-automaton"},
        body:JSON.stringify({
          filters:{
            keywords:[rawKeyword],
            award_type_codes:["A","B","C","D"],
            time_period:[{start_date:startDate,end_date:endDate}]
          },
          fields:["Award ID","Recipient Name","Description","Award Amount","Awarding Agency","Base Obligation Date","Last Modified Date"],
          limit:25,
          page:1,
          sort:"Last Modified Date",
          order:"desc",
          spending_level:"awards"
        })
      });
      if(!response.ok)throw new Error(`USAspending search failed: ${response.status} ${response.statusText}`);
      const json=await response.json() as UsaSpendingResponse;
      for(const row of json.results??[]){
        const awardId=row["Award ID"]?.trim();
        if(!awardId)continue;
        signals.push({
          sourceId:"usaspending-federal-awards",
          recordId:awardId,
          recordType:"federal-contract-award",
          officialUrl:ENDPOINT,
          ...(row["Recipient Name"]?{organizationName:row["Recipient Name"]}:{}),
          jurisdiction:"United States",
          ...(row["Base Obligation Date"]?{eventDate:row["Base Obligation Date"]}:{}),
          retrievedAt,
          facts:{
            matchedKeyword:rawKeyword,
            description:row["Description"]??null,
            awardAmount:row["Award Amount"]??null,
            awardingAgency:row["Awarding Agency"]??null,
            lastModifiedDate:row["Last Modified Date"]??null
          }
        });
      }
    }catch(error){
      failures.push({keyword:rawKeyword,error:error instanceof Error?error.message:String(error)});
    }
  }
  const deduped=[...new Map(signals.map(s=>[`${s.sourceId}:${s.recordId}`,s])).values()];
  return {signals:deduped,failures};
}
