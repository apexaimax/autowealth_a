import { profileFromEnv } from "./profile-config.js";
import { githubIssueAdapter, type GitHubIssueRecord } from "./source-adapters.js";
import { orchestrateDiscovery, discoverySummary } from "./orchestrator.js";
import { buildScoutPlan, deriveUnverifiedHypotheses, type ScoutObservation } from "./scout.js";
import { pathToFileURL } from "node:url";

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

export function isCliEntryPoint(moduleUrl:string,argvPath:string|undefined):boolean {
  return Boolean(argvPath && pathToFileURL(argvPath).href===moduleUrl);
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
  const observedAt=new Date().toISOString();
  const profile=profileFromEnv(process.env);
  const streams=[];
  const failures:{query:string;error:string}[]=[];
  const searched=new Set<string>();
  const paidQueries:string[]=[];
  const paidObservations:ScoutObservation[]=[];
  while(paidQueries.length<9){
    const query=buildScoutPlan(profile,paidObservations,9).paidQueries.find(candidate=>!searched.has(candidate));
    if(!query) break;
    searched.add(query);
    paidQueries.push(query);
    try {
      const issues=await githubSearch(query,process.env.GITHUB_TOKEN);
      paidObservations.push(...issues.map(issue=>({
        repository:repoName(issue.repository_url),number:issue.number,title:issue.title,
        htmlUrl:issue.html_url,body:issue.body??"",labels:issue.labels.flatMap(x=>x.name?[x.name]:[])
      })));
      streams.push(githubIssueAdapter.ingest(issues.map(mapSearchIssue),observedAt,profile));
    } catch(error) {
      failures.push({query,error:error instanceof Error?error.message:String(error)});
    }
  }
  const problemQueries=buildScoutPlan(profile,paidObservations).problemQueries;
  const problemObservations:ScoutObservation[]=[];
  for(const query of problemQueries){
    try {
      const issues=await githubSearch(query,process.env.GITHUB_TOKEN);
      problemObservations.push(...issues.map(issue=>({
        repository:repoName(issue.repository_url),number:issue.number,title:issue.title,
        htmlUrl:issue.html_url,body:issue.body??"",labels:issue.labels.flatMap(x=>x.name?[x.name]:[])
      })));
    } catch(error) {
      failures.push({query,error:error instanceof Error?error.message:String(error)});
    }
  }
  const batch=orchestrateDiscovery(streams);
  process.stdout.write(JSON.stringify({
    source:"github-public-issues",observedAt,profileEnabled:Boolean(profile),queries:paidQueries,problemQueries,failures,
    unverifiedHypotheses:deriveUnverifiedHypotheses(problemObservations),summary:discoverySummary(batch),
    readyForEconomics:batch.readyForEconomics,
    needsVerification:batch.needsVerification,
    rejected:batch.rejected
  },null,2)+"\n");
}

if(isCliEntryPoint(import.meta.url,process.argv[1])){
 main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
}
