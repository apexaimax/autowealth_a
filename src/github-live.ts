import { profileFromEnv } from "./profile-config.js";
import { githubIssueAdapter, type GitHubIssueRecord } from "./source-adapters.js";
import { orchestrateDiscovery, discoverySummary } from "./orchestrator.js";
import { analyzeDemand, DEFAULT_PROJECT_ASSETS, type DemandObservation } from "./demand-intelligence.js";

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

function mapDemandObservation(issue:SearchIssue,observedAt:string):DemandObservation {
  return {
    id:`github:${repoName(issue.repository_url)}:${issue.number}`,
    title:issue.title,
    body:issue.body ?? "",
    url:issue.html_url,
    observedAt,
    intent:"MARKET_PAIN"
  };
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
    'is:issue is:open "resume" "automation"'
  ];
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
  for(const query of demandQueries){
    try {
      const issues=await githubSearch(query,process.env.GITHUB_TOKEN);
      demandObservations.push(...issues.map(issue=>mapDemandObservation(issue,observedAt)));
    } catch(error) {
      demandFailures.push({query,error:error instanceof Error?error.message:String(error)});
    }
  }

  const uniqueDemand=[...new Map(demandObservations.map(item=>[item.id,item])).values()];
  const demandRecommendations=analyzeDemand(uniqueDemand,DEFAULT_PROJECT_ASSETS);
  const creationCandidates=demandRecommendations.filter(item=>item.lane!=="NEW_PRODUCT" || item.evidenceCount>=2);
  const batch=orchestrateDiscovery(streams);
  process.stdout.write(JSON.stringify({
    source:"github-public-issues",observedAt,profileEnabled:Boolean(profile),
    paidQueries,demandQueries,failures,demandFailures,
    summary:discoverySummary(batch),
    demandSummary:{
      totalObserved:demandObservations.length,
      uniqueObserved:uniqueDemand.length,
      recommendations:demandRecommendations.length,
      creationCandidates:creationCandidates.length
    },
    creationCandidates,
    readyForEconomics:batch.readyForEconomics,
    needsVerification:batch.needsVerification,
    rejected:batch.rejected
  },null,2)+"\n");
}

if(process.env.NODE_ENV!=="test"){
 main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
}
