import { digest } from "./revenue-ledger.js";

export type EvidenceSourceClass="SEARCH"|"AGGREGATOR"|"COMMUNITY"|"FIRST_PARTY"|"OFFICIAL_REPOSITORY"|"OFFICIAL_MARKETPLACE";
export type EvidenceVerificationStatus="UNVERIFIED"|"VERIFIED"|"CONTRADICTED"|"STALE";

export interface EvidenceObservationInput {
  canonicalSource:string;
  discoverySource?:string;
  sourceClass:EvidenceSourceClass;
  authoritative:boolean;
  observedAt:string;
  claim:string;
  contentDigest:string;
  supersedes?:string;
  contradictionOf?:string;
}

export interface EvidenceObservation extends EvidenceObservationInput {
  evidenceId:string;
  verificationStatus:EvidenceVerificationStatus;
}

export function observeEvidence(input:EvidenceObservationInput):EvidenceObservation {
  if(!input.canonicalSource.trim() || !input.claim.trim() || !input.contentDigest.trim() || !input.observedAt.trim()) {
    throw new Error("INVALID_EVIDENCE");
  }
  const evidenceId=digest({
    canonicalSource:input.canonicalSource,
    claim:input.claim,
    contentDigest:input.contentDigest
  });
  return {
    ...input,
    evidenceId,
    verificationStatus:input.authoritative?"VERIFIED":"UNVERIFIED"
  };
}

export function chooseCurrentEvidence(observations:readonly EvidenceObservation[]):EvidenceObservation|undefined {
  return [...observations]
    .filter(item=>item.verificationStatus!=="CONTRADICTED")
    .sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt) || a.evidenceId.localeCompare(b.evidenceId))[0];
}

export function evidenceFreshness(observation:EvidenceObservation,asOf:string,maxAgeMs:number):"CURRENT"|"STALE" {
  if(!Number.isFinite(maxAgeMs) || maxAgeMs<0) throw new Error("INVALID_FRESHNESS_POLICY");
  const observed=Date.parse(observation.observedAt);
  const current=Date.parse(asOf);
  if(!Number.isFinite(observed) || !Number.isFinite(current) || current<observed) throw new Error("INVALID_FRESHNESS_TIME");
  return current-observed>maxAgeMs?"STALE":"CURRENT";
}
