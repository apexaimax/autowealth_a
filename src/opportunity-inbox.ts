import { createHash } from "node:crypto";

export type InboxDecision="PASS_TO_ECONOMICS"|"NEEDS_VERIFICATION"|"REJECT"|"RESEARCH_SEED";

export interface InboxObservation {
  key:string;
  title:string;
  url:string;
  source:string;
  lane:string;
  decision:InboxDecision;
  verificationNeeds:string[];
  observedAt:string;
}

export interface InboxEntry extends InboxObservation {
  firstSeenAt:string;
  lastSeenAt:string;
  observationCount:number;
  previousDecisions:InboxDecision[];
}

export interface OpportunityInbox {
  schema:"revenue-opportunity-inbox-v1";
  updatedAt:string;
  entries:InboxEntry[];
}

export function emptyInbox(updatedAt:string):OpportunityInbox {
  return {schema:"revenue-opportunity-inbox-v1",updatedAt,entries:[]};
}

function normalizedUrl(url:string):string {
  try{
    const u=new URL(url);
    u.hash="";
    for(const key of [...u.searchParams.keys()]) if(/^utm_/i.test(key)) u.searchParams.delete(key);
    return u.toString();
  }catch{return url.trim();}
}

export function inboxKey(source:string,url:string,title:string):string {
  return createHash("sha256").update(JSON.stringify([source,normalizedUrl(url),title.trim().toLowerCase()])).digest("hex");
}

export function mergeInbox(current:OpportunityInbox,observations:readonly InboxObservation[],updatedAt:string):OpportunityInbox {
  const byKey=new Map(current.entries.map(entry=>[entry.key,{...entry,verificationNeeds:[...entry.verificationNeeds],previousDecisions:[...entry.previousDecisions]}]));
  for(const observation of observations){
    const existing=byKey.get(observation.key);
    if(!existing){
      byKey.set(observation.key,{...observation,firstSeenAt:observation.observedAt,lastSeenAt:observation.observedAt,observationCount:1,previousDecisions:[]});
      continue;
    }
    const previousDecisions=[...existing.previousDecisions];
    if(existing.decision!==observation.decision && !previousDecisions.includes(existing.decision)) previousDecisions.push(existing.decision);
    byKey.set(observation.key,{
      ...existing,...observation,
      firstSeenAt:existing.firstSeenAt,
      lastSeenAt:observation.observedAt,
      observationCount:existing.observationCount+1,
      previousDecisions
    });
  }
  return {schema:"revenue-opportunity-inbox-v1",updatedAt,entries:[...byKey.values()].sort((a,b)=>b.lastSeenAt.localeCompare(a.lastSeenAt)||a.key.localeCompare(b.key))};
}
