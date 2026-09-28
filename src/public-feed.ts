import type { OpportunityCategory, ParticipationMode, RewardType } from "./discovery-policy.js";
import type { StructuredListing } from "./structured-listing-adapter.js";

export interface PublicJsonSource {
  id:string;
  endpoint:string;
  authoritative:boolean;
  category:OpportunityCategory;
  defaultRewardType:RewardType;
  participationMode:ParticipationMode;
}

export interface PublicJsonRecord {
  id:string|number;
  title:string;
  url:string;
  rewardUsd?:number;
  rewardType?:RewardType;
  open?:boolean;
  requiresUpfrontSpend?:boolean;
  eligible?:boolean|"UNKNOWN";
  deviceCompatible?:boolean|"UNKNOWN";
  paymentVerifiable?:boolean|"UNKNOWN";
  probabilityDependent?:boolean;
}

export function mapPublicJson(source:PublicJsonSource, rows:PublicJsonRecord[]):StructuredListing[]{
 return rows.map(row=>({
  provider:source.id,id:String(row.id),title:row.title,url:row.url,
  authoritative:source.authoritative,category:source.category,
  rewardType:row.rewardType??source.defaultRewardType,
  participationMode:source.participationMode,
  ...(row.rewardUsd===undefined?{}:{rewardUsd:row.rewardUsd}),
  ...(row.open===undefined?{}:{open:row.open}),
  ...(row.requiresUpfrontSpend===undefined?{}:{requiresUpfrontSpend:row.requiresUpfrontSpend}),
  ...(row.eligible===undefined?{}:{eligible:row.eligible}),
  ...(row.deviceCompatible===undefined?{}:{deviceCompatible:row.deviceCompatible}),
  ...(row.paymentVerifiable===undefined?{}:{paymentVerifiable:row.paymentVerifiable}),
  ...(row.probabilityDependent===undefined?{}:{probabilityDependent:row.probabilityDependent})
 }));
}

export async function fetchPublicJson(source:PublicJsonSource):Promise<PublicJsonRecord[]>{
 const response=await fetch(source.endpoint,{headers:{"Accept":"application/json","User-Agent":"revenue-automaton"}});
 if(!response.ok) throw new Error(source.id+" fetch failed: "+response.status);
 const body=await response.json() as unknown;
 if(!Array.isArray(body)) throw new Error(source.id+" endpoint did not return an array");
 return body as PublicJsonRecord[];
}
