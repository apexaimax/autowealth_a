import { profileFromEnv } from "./profile-config.js";
import { githubIssueAdapter, type GitHubIssueRecord } from "./source-adapters.js";
import { orchestrateDiscovery, discoverySummary } from "./orchestrator.js";
import { analyzeDemand, DEFAULT_PROJECT_ASSETS, type DemandObservation } from "./demand-intelligence.js";
import { verifyGitHubCandidates } from "./github-verification.js";
import { buildCommercialResearchSeeds } from "./commercial-seeds.js";
import { isCommercialServiceSignal } from "./service-signal-quality.js";
import { fetchUsaSpendingContractAwards } from "./usaspending-public-records.js";

interface SearchIssue {
  html_url:string; number:number; title:string; state:"open"|"closed"; locked:boolean;
  labels:Array<{name?:string}>; assignees:Array<{login?:string}>; body:string|null; comments:number;
  repository_url:string;
}
interface SearchResponse { items:SearchIssue[]; }

function repoName(repositoryUrl:string):string {
  const marker="/repos/";
  const i=repositoryUrl.indexOf(marker);
  return i >= 0 ? repositoryUrl.slice(i+marker.length) : repositoryUrl;
}

export function mapSearchIssue(issue:SearchIssue):GitHubIssueRecord {
  return {
    repository:repoName(issue.repository_url),
    number:issue.number,title:issue.title,htmlUrl:issue.html_url,state:issue.state,
    locked:issue.locked,labels:issue.labels.flatMap(x=>x.name?[x.name]:[]),
    assignees:issue.assignees.flatMap(x=>x.login?[x.login]:[]),
    body:issue.body ?? "",comments:issue.comments
  };
}

export function mapDemandObservation(issue:SearchIssue,observedAt:string,intent:DemandObservation["intent"]="MARKET_PAIN"):DemandObservation {
  return {
    id:`github:${repoName(issue.repository_url)}:${issue.number}`,
    title:issue.title,
    body:issue.body ?? "",
    url:issue.html_url,
    observedAt,
    intent
  };
}

export function serviceIssuePassesQualityGate(issue:Pick<SearchIssue,"title"|"body">):boolean {
  return isCommercialServiceSignal(issue.title,issue.body??"");
}

export async function githubSearch(query:string, token?:string):Promise<SearchIssue[]> {
  const headers:Record<string,string>={
    "Accept":"application/vnd.github+json",
    "X-GitHub-Api-Version":"2022-11-28",
    "User-Agent":"revenue-automaton"
  };
  if(token) headers.Authorization="Bearer "+token;
  const url="https://api.github.com/search/issues?q="+encodeURIComponent(query)+"&sort=updated&order=desc&per_page=50";
  const response=await fetch(url,{headers});
  if(!response.ok) throw new Error("GitHub search failed: "+response.status+" "+response.statusText);
  return ((await response.json()) as SearchResponse).items;
}

function csvEnv(value:string|undefined,fallback:readonly string[]):string[]{
  const parsed=(value??"").split(",").map(x=>x.trim()).filter(Boolean);
  return parsed.length?parsed:[...fallback];
}
function dateOnly(date:Date):string{return date.toISOString().slice(0,10);}

async function main(){
  const paidQueries=[
    'is:issue is:open bounty "$"',
    'is:issue is:open label:bounty',
    'is:issue is:open "reward" "$"',
    'is:issue is:open "paid" "$" "testing"',
    'is:issue is:open "paid" "$" "code review"',
    'is:issue is:open "paid" "$" "audit"',
    'is:issue is:open "paid" "$" "documentation"',
    'is:issue is:open "reward" "$" "QA"',
    'is:issue is:open "reward" "$" "AI evaluation"'
  ];
  const demandQueries=[
    'is:issue is:open "manual" "workflow" "automation"',
    'is:issue is:open "tedious" "automation"',
    'is:issue is:open "zip" "manual"',
    'is:issue is:open "release" "compare" "versions"',
    'is:issue is:open "ai agent" "approval"',
    'is:issue is:open "form" "mapping" "browser extension"',
    'is:issue is:open "EHR" "workflow"',
    'is:issue is:open "resume" "automation"',
    'is:issue is:open "license" "pilot" "integration"',
    'is:issue is:open "human approval" "agent" "audit"',
    'is:issue is:open "healthcare" "workflow" "integration"'
  ];
  const serviceQueries=[
    'is:issue is:open "looking for" "code review"',
    'is:issue is:open "looking for" "security audit"',
    'is:issue is:open "need help" "automation"',
    'is:issue is:open "paid" "technical audit"',
    'is:issue is:open "contract" "browser extension"'
  ];
  const remoteWorkQueries=[
    'is:issue is:open "remote" "code review" "contract"',
    'is:issue is:open "remote" "AI" "reviewer"',
    'is:issue is:open "remote" "QA" "contract"',
    'is:issue is:open "remote" "automation" "contract"'
  ];
  const externalResearchQueries=[
    'remote freelance code review AI-generated code contract',
    'paid technical audit AI agent workflow security freelance',
    'software bounty paid task code review QA documentation',
    'AI agent human approval audit trail authorization enterprise pilot',
    'healthcare EHR workflow automation integration pilot vendor',
    'browser extension form mapping workflow automation contract',
    'ZIP release verification archive comparison software teams',
    'AI software licensing pilot proof of concept developer tools'
  ];
  const publicRecordKeywords=csvEnv(process.env.REVENUE_PUBLIC_RECORD_KEYWORDS,[
    "artificial intelligence software",
    "cybersecurity software",
    "healthcare workflow software",
    "browser automation software"
  ]);
  const observedAt=new Date().toISOString();
  const profile=profileFromEnv(process.env);
  const streams=[];
  const failures:{query:string;error:string}[]=[];
  for(const query of paidQueries){
    try {
      const issues=await githubSearch(query,process.env.GITHUB_TOKEN);
      streams.push(githubIssueAdapter.ingest(issues.map(mapSearchIssue),observedAt,profile));
    } catch(error) {
      failures.push({query,error:error instanceof Error?error.message:String(error)});
    }
  }

  const demandObservations:DemandObservation[]=[];
  const demandFailures:{query:string;error:string}[]=[];
  let serviceFilteredByQuality=0;
  for(const query of demandQueries){
    try {
      const issues=await githubSearch(query,process.env.GITHUB_TOKEN);
      demandObservations.push(...issues.map(issue=>mapDemandObservation(issue,observedAt)));
    } catch(error) {
      demandFailures.push({query,error:error instanceof Error?error.message:String(error)});
    }
  }

  for(const [queries,intent] of [[serviceQueries,"SERVICE_REQUEST"],[remoteWorkQueries,"REMOTE_WORK"]] as const){
    for(const query of queries){
      try {
        let issues=await githubSearch(query,process.env.GITHUB_TOKEN);
        if(intent==="SERVICE_REQUEST"){
          const before=issues.length;
          issues=issues.filter(serviceIssuePassesQualityGate);
          serviceFilteredByQuality+=before-issues.length;
        }
        demandObservations.push(...issues.map(issue=>mapDemandObservation(issue,observedAt,intent)));
      } catch(error) {
        demandFailures.push({query,error:error instanceof Error?error.message:String(error)});
      }
    }
  }

  const end=new Date(observedAt);
  const start=new Date(end);
  start.setUTCDate(start.getUTCDate()-30);
  const publicRecords=await fetchUsaSpendingContractAwards(publicRecordKeywords,dateOnly(start),dateOnly(end),observedAt);

  const uniqueDemand=[...new Map(demandObservations.map(item=>[item.id,item])).values()];
  const demandRecommendations=analyzeDemand(uniqueDemand,DEFAULT_PROJECT_ASSETS);
  const creationCandidates=demandRecommendations.filter(item=>item.lane!=="NEW_PRODUCT" || item.evidenceCount>=2);
  const commercialResearchSeeds=buildCommercialResearchSeeds(demandRecommendations);
  const batch=orchestrateDiscovery(streams);
  const verificationAttempts=await verifyGitHubCandidates(batch.needsVerification,profile,process.env.GITHUB_TOKEN);
  const verified=verificationAttempts.flatMap(item=>item.evaluated?[item.evaluated]:[]);
  const verifiedReadyForEconomics=verified.filter(item=>item.decision.decision==="PASS_TO_ECONOMICS");
  const verifiedNeedsVerification=verified.filter(item=>item.decision.decision==="NEEDS_VERIFICATION");
  const verifiedRejected=verified.filter(item=>item.decision.decision==="REJECT");
  const verificationSummary={
    attempted:verificationAttempts.length,
    resolved:verificationAttempts.filter(item=>item.status==="RESOLVED").length,
    partial:verificationAttempts.filter(item=>item.status==="PARTIAL").length,
    rejected:verificationAttempts.filter(item=>item.status==="REJECTED").length,
    errors:verificationAttempts.filter(item=>item.status==="ERROR").length
  };
  process.stdout.write(JSON.stringify({
    source:"github-public-issues+usaspending-public-records",observedAt,profileEnabled:Boolean(profile),
    paidQueries,demandQueries,serviceQueries,remoteWorkQueries,externalResearchQueries,publicRecordKeywords,
    failures,demandFailures,publicRecordFailures:publicRecords.failures,
    summary:discoverySummary(batch),
    demandSummary:{
      totalObserved:demandObservations.length,
      uniqueObserved:uniqueDemand.length,
      recommendations:demandRecommendations.length,
      creationCandidates:creationCandidates.length,
      commercialResearchSeeds:commercialResearchSeeds.length,
      serviceFilteredByQuality
    },
    publicRecordSummary:{source:"USAspending",records:publicRecords.signals.length,failures:publicRecords.failures.length},
    publicRecordSignals:publicRecords.signals,
    commercialResearchSeeds,
    creationCandidates,
    readyForEconomics:batch.readyForEconomics,
    needsVerification:batch.needsVerification,
    rejected:batch.rejected,
    verificationSummary,
    verificationAttempts,
    verifiedReadyForEconomics,
    verifiedNeedsVerification,
    verifiedRejected
  },null,2)+"\n");
}

if(process.env.NODE_ENV!=="test"){
 main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
}
