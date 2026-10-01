import type { CapabilityEvidence } from "./capability-evidence.js";
import type { CommercialCandidate } from "./commercial-candidate.js";

export type ExternalProblemEvidenceStrength="NONE"|"KEYWORD_ONLY"|"SECONDARY"|"AUTHORITATIVE";
export type CommercialFitReason =
  | "CAPABILITY_NOT_SUPPORTED" | "WEAK_EXTERNAL_PROBLEM_EVIDENCE"
  | "NO_PLAUSIBLE_COMMERCIAL_MODEL" | "AUTHORITATIVE_CONTRADICTION";

export interface CommercialFitInput {
  candidate:CommercialCandidate;
  capability:CapabilityEvidence;
  externalProblemEvidence:ExternalProblemEvidenceStrength;
  commercialModelPlausible:boolean;
  authoritativeContradiction:boolean;
}

export interface CommercialFitDecision {
  candidateId:string;
  status:"QUALIFIED"|"DOWNGRADED"|"REJECTED";
  reasons:CommercialFitReason[];
  expectedRevenueUsd?:number;
}

const SUPPORTED=new Set<CapabilityEvidence["evidenceLevel"]>([
  "LIVE_VERIFIED","DETERMINISTICALLY_TESTED","USER_REAL_WORLD_VERIFIED","PARTIAL"
]);

export function evaluateCommercialFit(input:CommercialFitInput):CommercialFitDecision {
  const reasons:CommercialFitReason[]=[];
  if(!SUPPORTED.has(input.capability.evidenceLevel)) reasons.push("CAPABILITY_NOT_SUPPORTED");
  if(input.authoritativeContradiction) reasons.push("AUTHORITATIVE_CONTRADICTION");
  if(!input.commercialModelPlausible) reasons.push("NO_PLAUSIBLE_COMMERCIAL_MODEL");
  if(input.externalProblemEvidence==="NONE" || input.externalProblemEvidence==="KEYWORD_ONLY") reasons.push("WEAK_EXTERNAL_PROBLEM_EVIDENCE");

  const hardReject=reasons.includes("CAPABILITY_NOT_SUPPORTED") ||
    reasons.includes("AUTHORITATIVE_CONTRADICTION") ||
    reasons.includes("NO_PLAUSIBLE_COMMERCIAL_MODEL");
  if(hardReject) return {candidateId:input.candidate.id,status:"REJECTED",reasons};
  if(reasons.length) return {candidateId:input.candidate.id,status:"DOWNGRADED",reasons};
  return {candidateId:input.candidate.id,status:"QUALIFIED",reasons:[]};
}
