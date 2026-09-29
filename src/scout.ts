import type { UserCapabilityProfile, WorkCapability } from "./profile-fit.js";

export interface ScoutObservation {
  repository:string;
  number:number;
  title:string;
  htmlUrl:string;
  body?:string;
  labels?:string[];
}

export interface ScoutPlan {
  paidQueries:string[];
  problemQueries:string[];
}

export interface UnverifiedHypothesis {
  id:string;
  title:string;
  url:string;
  problemSignal:string;
  status:"UNVERIFIED_HYPOTHESIS";
}

const CAPABILITY_SEARCHES:Record<WorkCapability,{terms:RegExp;queries:string[]}>={
  GITHUB_REVIEW:{terms:/\b(review|pull request|merge)\b/i,queries:['is:issue is:open "paid" "$" "code review"']},
  CODE_ANALYSIS:{terms:/\b(bug|security|audit|analysis|code)\b/i,queries:['is:issue is:open "bounty" "$" "bug"','is:issue is:open "paid" "$" "audit"']},
  DOCUMENTATION:{terms:/\b(documentation|docs|guide|readme)\b/i,queries:['is:issue is:open "paid" "$" "documentation"']},
  QA:{terms:/\b(test|testing|qa|quality|reproducible)\b/i,queries:['is:issue is:open "paid" "$" "testing"','is:issue is:open "reward" "$" "QA"']},
  AI_ASSISTED_RESEARCH:{terms:/\b(ai|model|evaluation|research|data)\b/i,queries:['is:issue is:open "reward" "$" "AI evaluation"']}
};

const BASE_PAID_QUERIES=[
  'is:issue is:open bounty "$"',
  'is:issue is:open label:bounty',
  'is:issue is:open "reward" "$"'
];

const PROBLEM_QUERIES=[
  'is:issue is:open "manual workflow"',
  'is:issue is:open "repetitive task"',
  'is:issue is:open "time-consuming" workflow'
];

function capabilityOrder(profile:UserCapabilityProfile|undefined,observations:ScoutObservation[]):WorkCapability[]{
  const configured=profile?.workCapabilities.length?profile.workCapabilities:Object.keys(CAPABILITY_SEARCHES) as WorkCapability[];
  const corpus=observations.map(x=>`${x.title} ${x.body??""} ${(x.labels??[]).join(" ")}`).join("\n");
  return [...configured].sort((a,b)=>{
    const aHits=corpus.match(new RegExp(CAPABILITY_SEARCHES[a].terms.source,"gi"))?.length??0;
    const bHits=corpus.match(new RegExp(CAPABILITY_SEARCHES[b].terms.source,"gi"))?.length??0;
    return bHits-aHits || configured.indexOf(a)-configured.indexOf(b);
  });
}

export function buildScoutPlan(
  profile?:UserCapabilityProfile,
  recentObservations:ScoutObservation[]=[],
  maxPaidQueries=9
):ScoutPlan {
  if(!Number.isInteger(maxPaidQueries)||maxPaidQueries<1) throw new Error("Invalid Scout query limit");
  const paidQueries=[...BASE_PAID_QUERIES];
  for(const capability of capabilityOrder(profile,recentObservations)){
    paidQueries.push(...CAPABILITY_SEARCHES[capability].queries);
  }
  const uniquePaidQueries=[...new Set(paidQueries)].slice(0,maxPaidQueries);
  return {paidQueries:uniquePaidQueries,problemQueries:[...PROBLEM_QUERIES]};
}

const PAID_SIGNAL=/\b(?:paid|payment|bounty|reward|cash prize|funded|stipend|compensation)\b|\$\s*\d/i;
const PROBLEM_SIGNAL=/\b(?:manual|repetitive|time-consuming|tedious|error-prone|painful|workflow|bottleneck)\b/i;

export function deriveUnverifiedHypotheses(observations:ScoutObservation[]):UnverifiedHypothesis[]{
  const hypotheses:UnverifiedHypothesis[]=[];
  const seen=new Set<string>();
  for(const observation of observations){
    const text=`${observation.title}\n${observation.body??""}`;
    const signal=text.match(PROBLEM_SIGNAL)?.[0];
    if(!signal||PAID_SIGNAL.test(text)) continue;
    const id=`github:${observation.repository}#${observation.number}`;
    if(seen.has(id)) continue;
    seen.add(id);
    hypotheses.push({
      id,
      title:observation.title,
      url:observation.htmlUrl,
      problemSignal:signal.toLowerCase(),
      status:"UNVERIFIED_HYPOTHESIS"
    });
  }
  return hypotheses;
}
