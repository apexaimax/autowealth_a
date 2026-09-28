import type { PublicJsonSource } from "./public-feed.js";
export type SourceStatus="ACTIVE"|"CANDIDATE"|"DISABLED";
export interface RegisteredSource extends PublicJsonSource {status:SourceStatus;verificationReference?:string;}
export function activeSources(sources:RegisteredSource[]):RegisteredSource[]{return sources.filter(s=>s.status==="ACTIVE"&&s.authoritative&&Boolean(s.verificationReference));}
export const publicSourceRegistry:RegisteredSource[]=[];
