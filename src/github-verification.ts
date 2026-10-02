import { classifyCandidate } from "./discovery-policy.js";
import { normalizeRawOpportunity, type RawOpportunity } from "./collector.js";
import { extractExplicitRequirements } from "./requirement-extractor.js";
import { resolveProfileFit, type UserCapabilityProfile } from "./profile-fit.js";
import { resolveAuthoritativeText, type VerificationEvidence } from "./verification-resolver.js";
import type { EvaluatedCandidate } from "./orchestrator.js";
import { verifyIssueViability, type ViabilityDecision } from "./issue-viability.js";

interface GitHubIssueApi {
  html_url:string;
  number:number;
  title:string;
  state:"open"|"closed";
  locked:boolean;
  labels:Array<{name?:string}|string>;
  assignees:Array<{login?:string}>;
  body:string|null;
  comments:number;
  repository_url:string;
  updated_at?:string;
}

interface GitHubCommentApi {
  body:string|null;
  html_url:string;
  author_association?:string;
}

export interface GitHubVerificationAttempt {
  candidateId:string;
  url:string;
  checkedAt:string;
  status:"RESOLVED"|"PARTIAL"|"REJECTED"|"ERROR";
  beforeNeeds:string[];
  afterNeeds:string[];
  evidence:VerificationEvidence[];
  claimInstructions:string[];
  evaluated?:EvaluatedCandidate;
  viability?:ViabilityDecision;
  error?:string;
}

const TRUSTED_ASSOCIATIONS=new Set(["OWNER","MEMBER","COLLABORATOR"]);

function repoName(repositoryUrl:string):string {
  const marker="/repos/";
  const i=repositoryUrl.indexOf(marker);
  return i >= 0 ? repositoryUrl.slice(i+marker.length) : repositoryUrl;
}

export function parseGitHubIssueUrl(url:string):{owner:string;repo:string;number:number}|undefined {
  const match=url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)(?:[/?#].*)?$/i);
  if(!match) return undefined;
  return {owner:match[1]!,repo:match[2]!,number:Number(match[3])};
}

function labelNames(labels:GitHubIssueApi["labels"]):string[] {
  return labels.flatMap(label=>typeof label==="string"?[label]:label.name?[label.name]:[]);
}

function claimInstructions(text:string):string[] {
  const lines=text
    .split(/\r?\n/)
    .map(line=>line.replace(/^\s*[-*#>]+\s*/,"").trim())
    .filter(Boolean)
    .filter(line=>/\b(?:claim|apply|submit|submission|pull request|\bPR\b|comment|how to participate|deliverable)\b/i.test(line))
    .map(line=>line.length>280?line.slice(0,277)+"...":line);
  return [...new Set(lines)].slice(0,6);
}

export function resolveGitHubVerification(
  raw:RawOpportunity,
  issue:GitHubIssueApi,
  trustedComments:GitHubCommentApi[],
  profile?:UserCapabilityProfile,
  openCompetingPullRequests=0
):{raw:RawOpportunity;evidence:VerificationEvidence[];claimInstructions:string[];viability:ViabilityDecision} {
  const checkedAt=new Date().toISOString();
  const refreshed:RawOpportunity={
    ...raw,
    title:issue.title,
    url:issue.html_url,
    sourceKind:"authoritative",
    openStatus:issue.state==="open" && !issue.locked ? "OPEN" : "CLOSED",
    competitionCount:openCompetingPullRequests,
    observedAt:checkedAt
  };

  const trustedText=trustedComments
    .filter(comment=>TRUSTED_ASSOCIATIONS.has((comment.author_association??"").toUpperCase()))
    .map(comment=>comment.body??"")
    .filter(Boolean);
  const combined=[issue.title,issue.body??"",...trustedText].join("\n");
  const verified=resolveAuthoritativeText(refreshed,combined,issue.html_url);
  let resolved=verified.resolved;

  if(profile){
    const extracted=extractExplicitRequirements(combined,issue.html_url);
    resolved=resolveProfileFit(resolved,profile,extracted.requirements).resolved;
  }

  const viability=verifyIssueViability({id:raw.externalId,title:issue.title,source:raw.url,expectedRevenueUsd:raw.advertisedRewardUsd??0,maxCostUsd:0,executable:true,evidence:[]},{state:issue.state,locked:issue.locked,assignees:issue.assignees.flatMap(a=>a.login?[a.login]:[]),openCompetingPullRequests,checkedAt});
  return {
    raw:resolved,
    evidence:verified.evidence,
    claimInstructions:claimInstructions(combined),
    viability
  };
}

async function githubJson<T>(url:string,token?:string):Promise<T> {
  const headers:Record<string,string>={
    "Accept":"application/vnd.github+json",
    "X-GitHub-Api-Version":"2022-11-28",
    "User-Agent":"revenue-automaton"
  };
  if(token) headers.Authorization="Bearer "+token;
  const response=await fetch(url,{headers});
  if(!response.ok) throw new Error("GitHub verification fetch failed: "+response.status+" "+response.statusText);
  return await response.json() as T;
}

export async function verifyGitHubCandidate(
  item:EvaluatedCandidate,
  profile?:UserCapabilityProfile,
  token?:string
):Promise<GitHubVerificationAttempt> {
  const checkedAt=new Date().toISOString();
  const parsed=parseGitHubIssueUrl(item.raw.url);
  if(!parsed){
    return {
      candidateId:item.candidate.id,url:item.raw.url,checkedAt,status:"ERROR",
      beforeNeeds:item.decision.verificationNeeds,afterNeeds:item.decision.verificationNeeds,
      evidence:[],claimInstructions:[],error:"unsupported authoritative URL"
    };
  }

  try{
    const issue=await githubJson<GitHubIssueApi>(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/issues/${parsed.number}`,token
    );
    const comments=issue.comments>0
      ? await githubJson<GitHubCommentApi[]>(
          `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/issues/${parsed.number}/comments?per_page=100`,token
        )
      : [];
    const prs=await githubJson<Array<{state:string}>>(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/pulls?state=open&per_page=100`,token);
    const competingPrs=prs.filter(pr=>pr.state==="open").length;
    const resolution=resolveGitHubVerification(item.raw,issue,comments,profile,competingPrs);
    const collected=normalizeRawOpportunity(resolution.raw);
    const evaluated:EvaluatedCandidate={...collected,decision:classifyCandidate(collected.candidate)};
    const status=!resolution.viability.viable
      ? "REJECTED"
      : evaluated.decision.decision==="PASS_TO_ECONOMICS"
      ? "RESOLVED"
      : evaluated.decision.decision==="REJECT"
        ? "REJECTED"
        : "PARTIAL";
    return {
      candidateId:item.candidate.id,url:item.raw.url,checkedAt,status,
      beforeNeeds:item.decision.verificationNeeds,
      afterNeeds:evaluated.decision.verificationNeeds,
      evidence:resolution.evidence,
      claimInstructions:resolution.claimInstructions,
      viability:resolution.viability,
      evaluated:resolution.viability.viable?evaluated:{...evaluated,decision:{...evaluated.decision,decision:"REJECT",verificationNeeds:[]}}
    };
  }catch(error){
    return {
      candidateId:item.candidate.id,url:item.raw.url,checkedAt,status:"ERROR",
      beforeNeeds:item.decision.verificationNeeds,afterNeeds:item.decision.verificationNeeds,
      evidence:[],claimInstructions:[],
      error:error instanceof Error?error.message:String(error)
    };
  }
}

export async function verifyGitHubCandidates(
  items:EvaluatedCandidate[],
  profile?:UserCapabilityProfile,
  token?:string
):Promise<GitHubVerificationAttempt[]> {
  const out:GitHubVerificationAttempt[]=[];
  for(const item of items) out.push(await verifyGitHubCandidate(item,profile,token));
  return out;
}
