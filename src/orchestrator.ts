import { collectUnique, type CollectedCandidate, type RawOpportunity } from "./collector.js";
import { classifyCandidate, type DiscoveryDecision } from "./discovery-policy.js";
import { rankOpportunities, type RankingInput, type RankedOpportunity } from "./opportunity-ranking.js";

export interface EvaluatedCandidate extends CollectedCandidate {
  decision: DiscoveryDecision;
}

export interface DiscoveryBatch {
  totalObserved: number;
  uniqueCandidates: number;
  readyForEconomics: EvaluatedCandidate[];
  needsVerification: EvaluatedCandidate[];
  rejected: EvaluatedCandidate[];
}

export interface RankedDiscoveryCandidate {
  candidate: EvaluatedCandidate;
  ranking: RankedOpportunity;
}

export interface RankingBatch {
  ranked: RankedDiscoveryCandidate[];
  missingEstimates: EvaluatedCandidate[];
}

export function orchestrateDiscovery(streams: RawOpportunity[][]): DiscoveryBatch {
  const flattened = streams.flat();
  const unique = collectUnique(flattened);
  const evaluated: EvaluatedCandidate[] = unique.map(item => ({
    ...item,
    decision: classifyCandidate(item.candidate)
  }));
  return {
    totalObserved: flattened.length,
    uniqueCandidates: unique.length,
    readyForEconomics: evaluated.filter(x => x.decision.decision === "PASS_TO_ECONOMICS"),
    needsVerification: evaluated.filter(x => x.decision.decision === "NEEDS_VERIFICATION"),
    rejected: evaluated.filter(x => x.decision.decision === "REJECT")
  };
}

export function rankDiscoveryBatch(batch:DiscoveryBatch, estimates:ReadonlyMap<string,Omit<RankingInput,"candidateId">>):RankingBatch {
  const inputs:RankingInput[]=[];
  const byId=new Map(batch.readyForEconomics.map(item=>[item.candidate.id,item]));
  const missingEstimates:EvaluatedCandidate[]=[];

  for(const item of batch.readyForEconomics){
    const estimate=estimates.get(item.candidate.id);
    if(!estimate){
      missingEstimates.push(item);
      continue;
    }
    inputs.push({candidateId:item.candidate.id,...estimate});
  }

  const ranked=rankOpportunities(inputs).map(ranking=>({
    candidate:byId.get(ranking.candidateId)!,
    ranking
  }));
  return {ranked,missingEstimates};
}

export function discoverySummary(batch: DiscoveryBatch) {
  return {
    totalObserved: batch.totalObserved,
    uniqueCandidates: batch.uniqueCandidates,
    readyForEconomics: batch.readyForEconomics.length,
    needsVerification: batch.needsVerification.length,
    rejected: batch.rejected.length
  };
}
