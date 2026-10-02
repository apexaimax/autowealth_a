import { readFile,writeFile } from "node:fs/promises";
import { emptyInbox,inboxKey,mergeInbox,type InboxObservation,type OpportunityInbox } from "./opportunity-inbox.js";
import { publicRecordEvidence,type PublicRecordSignal } from "./public-records.js";

interface DiscoveryJson { observedAt:string; readyForEconomics?:any[]; needsVerification?:any[]; rejected?:any[]; verifiedReadyForEconomics?:any[]; verifiedNeedsVerification?:any[]; verifiedRejected?:any[]; commercialResearchSeeds?:any[]; creationCandidates?:any[]; publicRecordSignals?:PublicRecordSignal[]; }

function candidateObservation(row:any,decision:InboxObservation["decision"],observedAt:string):InboxObservation|undefined {
 const raw=row?.raw; const candidate=row?.candidate;
 if(!raw?.url || !raw?.title || !candidate?.id) return undefined;
 return {key:candidate.id,title:raw.title,url:raw.url,source:raw.sourceId??"github",lane:raw.category??"posted",decision,verificationNeeds:row?.decision?.verificationNeeds??[],observedAt};
}
function observations(input:DiscoveryJson):InboxObservation[]{
 const out:InboxObservation[]=[];
 for(const [rows,decision] of [[input.verifiedReadyForEconomics??input.readyForEconomics??[],"PASS_TO_ECONOMICS"],[input.verifiedNeedsVerification??input.needsVerification??[],"NEEDS_VERIFICATION"],[input.verifiedRejected??input.rejected??[],"REJECT"]] as const){
  for(const row of rows){const mapped=candidateObservation(row,decision,input.observedAt);if(mapped)out.push(mapped);}
 }
 for(const seed of input.commercialResearchSeeds??[]){
  const url=seed.discoveryUrls?.[0]; if(!url)continue;
  const title=`${seed.matchedAssetName??seed.matchedAssetId}: commercial research seed`;
  out.push({key:inboxKey("commercial-seed",url,title),title,url,source:"commercial-seed",lane:"commercial_research",decision:"RESEARCH_SEED",verificationNeeds:seed.requiredVerification??[],observedAt:input.observedAt});
 }
 for(const rec of input.creationCandidates??[]){
  const url=rec.sourceUrls?.[0]; if(!url)continue;
  const title=`${rec.action}: ${rec.matchedAssetName??rec.key}`;
  out.push({key:inboxKey("demand",url,title),title,url,source:"demand",lane:rec.lane??"demand",decision:"RESEARCH_SEED",verificationNeeds:rec.verificationNeeds??[],observedAt:input.observedAt});
 }
 for(const signal of input.publicRecordSignals??[]){
  const evidence=publicRecordEvidence(signal,"official public record may indicate funded activity; buyer intent is not established");
  const recipient=signal.organizationName??signal.subjectName??"unknown recipient";
  const title=`PUBLIC_RECORD: ${signal.recordType}: ${recipient}: ${signal.recordId}`;
  out.push({
    key:inboxKey(`public-record:${signal.sourceId}`,evidence.officialUrl,title),
    title,
    url:evidence.officialUrl,
    source:`public-record:${signal.sourceId}`,
    lane:"PUBLIC_RECORD",
    decision:"RESEARCH_SEED",
    verificationNeeds:["BUYER_INTENT","CURRENT_NEED","CONTACTABILITY"],
    observedAt:input.observedAt
  });
 }
 return [...new Map(out.map(x=>[x.key,x])).values()];
}
async function main(){
 const [discoveryPath,inboxPath="opportunity-inbox.json"]=process.argv.slice(2);
 if(!discoveryPath) throw new Error("usage: opportunity-inbox-cli <discovery.json> [inbox.json]");
 const input=JSON.parse(await readFile(discoveryPath,"utf8")) as DiscoveryJson;
 let current:OpportunityInbox;
 try{current=JSON.parse(await readFile(inboxPath,"utf8")) as OpportunityInbox;}catch{current=emptyInbox(input.observedAt);}
 const merged=mergeInbox(current,observations(input),input.observedAt);
 await writeFile(inboxPath,JSON.stringify(merged,null,2)+"\n","utf8");
 process.stdout.write(JSON.stringify({entries:merged.entries.length,updatedAt:merged.updatedAt})+"\n");
}
main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
