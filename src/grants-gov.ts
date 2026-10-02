import type { PublicRecordSignal } from "./public-records.js";

const SEARCH_URL="https://api.grants.gov/v1/api/search2";
const DETAIL_URL="https://api.grants.gov/v1/api/fetchOpportunity";

interface SearchHit {
  id:string|number;number?:string;title?:string;agencyCode?:string;agencyName?:string;
  openDate?:string;closeDate?:string;oppStatus?:string;docType?:string;alnist?:string[];
}
interface SearchPayload { errorcode?:number; data?:{oppHits?:SearchHit[]}; }
interface DetailPayload { errorcode?:number; data?:{synopsis?:{applicantTypes?:Array<{id?:string;description?:string}>}}; }

function isoDate(value:string|undefined):string|null {
  if(!value?.trim()) return null;
  const match=value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!match) return null;
  return `${match[3]}-${match[1]}-${match[2]}`;
}
function isStillOpen(hit:SearchHit,nowIso:string):boolean {
  if(hit.oppStatus!=="posted"&&hit.oppStatus!=="forecasted") return false;
  const close=isoDate(hit.closeDate);
  return !close || close>=nowIso.slice(0,10);
}
function validSearch(payload:SearchPayload):payload is {errorcode:number;data:{oppHits:SearchHit[]}} {
  return payload?.errorcode===0 && Array.isArray(payload.data?.oppHits);
}
function validApplicantTypes(payload:DetailPayload):Array<{id?:string;description?:string}>|null {
  const types=payload?.data?.synopsis?.applicantTypes;
  return payload?.errorcode===0 && Array.isArray(types) && types.length>0 ? types : null;
}

export async function fetchGrantsGovOpportunities(
  keywords:readonly string[],
  retrievedAt:string,
  eligibleApplicantTypes:readonly string[],
  fetcher:typeof fetch=fetch
):Promise<{signals:PublicRecordSignal[];failures:Array<{keyword:string;error:string}>}> {
  const signals:PublicRecordSignal[]=[];
  const failures:Array<{keyword:string;error:string}>=[];
  const seen=new Set<string>();
  const allowed=new Set(eligibleApplicantTypes.map(String));

  for(const keyword of [...new Set(keywords.map(x=>x.trim()).filter(Boolean))].slice(0,8)){
    try {
      const response=await fetcher(SEARCH_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({rows:25,keyword,eligibilities:"",agencies:"",oppStatuses:"forecasted|posted",aln:"",fundingCategories:""})});
      if(!response.ok) throw new Error(`search HTTP ${response.status}`);
      const payload=await response.json() as SearchPayload;
      if(!validSearch(payload)) throw new Error("malformed search response");

      for(const hit of payload.data.oppHits){
        const id=String(hit.id??"").trim();
        if(!id||seen.has(id)||!isStillOpen(hit,retrievedAt)) continue;
        const detailResponse=await fetcher(DETAIL_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({opportunityId:id})});
        if(!detailResponse.ok){failures.push({keyword,error:`detail ${id} HTTP ${detailResponse.status}`});continue;}
        const detail=await detailResponse.json() as DetailPayload;
        const applicantTypes=validApplicantTypes(detail);
        if(!applicantTypes){failures.push({keyword,error:`detail ${id} eligibility unavailable`});continue;}
        const applicantIds=applicantTypes.flatMap(x=>x.id?[String(x.id)]:[]);
        if(!applicantIds.some(id=>allowed.has(id))) continue;

        const closeDate=isoDate(hit.closeDate);
        const openDate=isoDate(hit.openDate);
        seen.add(id);
        signals.push({
          sourceId:"grants-gov",
          recordId:id,
          recordType:"federal-grant-opportunity",
          officialUrl:`https://www.grants.gov/search-results-detail/${encodeURIComponent(id)}`,
          organizationName:hit.agencyName||hit.agencyCode||undefined,
          jurisdiction:"United States",
          eventDate:openDate??undefined,
          retrievedAt,
          facts:{
            matchedKeyword:keyword,
            opportunityNumber:hit.number??"",
            title:hit.title??"",
            status:hit.oppStatus??"",
            openDate,
            closeDate,
            agencyCode:hit.agencyCode??"",
            documentType:hit.docType??"",
            eligibilityIds:applicantIds.join(","),
            aln:(hit.alnist??[]).join(",")
          }
        });
      }
    } catch(error) {
      failures.push({keyword,error:error instanceof Error?error.message:String(error)});
    }
  }
  return {signals,failures};
}
