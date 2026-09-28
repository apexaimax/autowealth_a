import { profileFromEnv } from "./profile-config.js";
import { githubIssueAdapter, type GitHubIssueRecord } from "./source-adapters.js";
import { orchestrateDiscovery, discoverySummary } from "./orchestrator.js";

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
  const queries=[
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
  const observedAt=new Date().toISOString();
  const profile=profileFromEnv(process.env);
  const streams=[];
  const failures:{query:string;error:string}[]=[];
  for(const query of queries){
    try {
      const issues=await githubSearch(query,process.env.GITHUB_TOKEN);
      streams.push(githubIssueAdapter.ingest(issues.map(mapSearchIssue),observedAt,profile));
    } catch(error) {
      failures.push({query,error:error instanceof Error?error.message:String(error)});
    }
  }
  const batch=orchestrateDiscovery(streams);
  process.stdout.write(JSON.stringify({
    source:"github-public-issues",observedAt,profileEnabled:Boolean(profile),queries,failures,summary:discoverySummary(batch),
    readyForEconomics:batch.readyForEconomics,
    needsVerification:batch.needsVerification,
    rejected:batch.rejected
  },null,2)+"\n");
}

if(process.env.NODE_ENV!=="test"){
 main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
}
