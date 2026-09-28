import { collectUnique, type CollectedCandidate, type RawOpportunity } from "./collector.js";
import { classifyCandidate, type DiscoveryDecision } from "./discovery-policy.js";

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

export function discoverySummary(batch: DiscoveryBatch) {
  return {
    totalObserved: batch.totalObserved,
    uniqueCandidates: batch.uniqueCandidates,
    readyForEconomics: batch.readyForEconomics.length,
    needsVerification: batch.needsVerification.length,
    rejected: batch.rejected.length
  };
}
