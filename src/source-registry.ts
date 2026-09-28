import type { PublicJsonSource } from "./public-feed.js";
export type SourceStatus="ACTIVE"|"CANDIDATE"|"DISABLED";
export interface RegisteredSource extends PublicJsonSource {status:SourceStatus;verificationReference?:string;}
export function activeSources(sources:RegisteredSource[]):RegisteredSource[]{return sources.filter(s=>s.status==="ACTIVE"&&s.authoritative&&Boolean(s.verificationReference));}
export const publicSourceRegistry:RegisteredSource[]=[
 {id:"topcoder-challenges",endpoint:"https://api.topcoder.com/v5/challenges/?status=Active&perPage=100&page=1",authoritative:true,category:"competition_prize",defaultRewardType:"cash",participationMode:"HUMAN_REQUIRED",status:"CANDIDATE",verificationReference:"https://github.com/topcoder-archive/challenge-api/issues/381"}
];
