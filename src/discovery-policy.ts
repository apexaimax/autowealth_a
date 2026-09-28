export type OpportunityCategory =
  | "bounty" | "freelance_contract" | "direct_service" | "qa_testing"
  | "ai_evaluation" | "research_study" | "data_contribution"
  | "transcription_translation" | "bug_bounty" | "competition_prize"
  | "grant_award" | "procurement" | "digital_product" | "affiliate_referral";

export type RewardType = "cash" | "cash_equivalent" | "gift_card" | "platform_credit" | "token" | "unknown";
export type AuthorityStatus = "UNVERIFIED" | "AUTHORITATIVE";
export type ParticipationMode = "AUTOMATABLE" | "ASSISTED" | "HUMAN_REQUIRED";

export interface DiscoveryCandidate {
  id: string;
  category: OpportunityCategory;
  rewardType: RewardType;
  advertisedRewardUsd?: number;
  requiresUpfrontSpend: boolean | "UNKNOWN";
  authorityStatus: AuthorityStatus;
  authoritativeReference?: string;
  openStatus: "OPEN" | "CLOSED" | "UNKNOWN";
  participationMode: ParticipationMode;
  eligible: boolean | "UNKNOWN";
  deviceCompatible: boolean | "UNKNOWN";
  paymentVerifiable: boolean | "UNKNOWN";
  competitionCount?: number;
  probabilityDependent: boolean;
}

export type DiscoveryRejectReason =
  | "NON_CASH_REWARD" | "UPFRONT_SPEND_REQUIRED" | "NOT_AUTHORITATIVE"
  | "NOT_OPEN" | "INELIGIBLE" | "DEVICE_INCOMPATIBLE" | "PAYMENT_NOT_VERIFIABLE";

export type VerificationNeed =
  | "UPFRONT_SPEND" | "OPEN_STATUS" | "ELIGIBILITY" | "DEVICE_COMPATIBILITY" | "PAYMENT_VERIFIABILITY";

export interface DiscoveryDecision {
  candidateId: string;
  decision: "PASS_TO_ECONOMICS" | "REJECT" | "NEEDS_VERIFICATION";
  reasons: DiscoveryRejectReason[];
  verificationNeeds: VerificationNeed[];
  speculative: boolean;
  humanRequired: boolean;
}

export function classifyCandidate(c: DiscoveryCandidate): DiscoveryDecision {
  const reasons: DiscoveryRejectReason[] = [];
  if (c.rewardType !== "cash" && c.rewardType !== "cash_equivalent") reasons.push("NON_CASH_REWARD");
  if (c.requiresUpfrontSpend === true) reasons.push("UPFRONT_SPEND_REQUIRED");
  if (c.authorityStatus !== "AUTHORITATIVE" || !c.authoritativeReference) reasons.push("NOT_AUTHORITATIVE");
  if (c.openStatus === "CLOSED") reasons.push("NOT_OPEN");
  if (c.eligible === false) reasons.push("INELIGIBLE");
  if (c.deviceCompatible === false) reasons.push("DEVICE_INCOMPATIBLE");
  if (c.paymentVerifiable === false) reasons.push("PAYMENT_NOT_VERIFIABLE");

  if (reasons.length) return {candidateId:c.id, decision:"REJECT", reasons, verificationNeeds:[], speculative:c.probabilityDependent, humanRequired:c.participationMode==="HUMAN_REQUIRED"};

  const verificationNeeds:VerificationNeed[]=[];
  if(c.requiresUpfrontSpend === "UNKNOWN") verificationNeeds.push("UPFRONT_SPEND");
  if(c.openStatus === "UNKNOWN") verificationNeeds.push("OPEN_STATUS");
  if(c.eligible === "UNKNOWN") verificationNeeds.push("ELIGIBILITY");
  if(c.deviceCompatible === "UNKNOWN") verificationNeeds.push("DEVICE_COMPATIBILITY");
  if(c.paymentVerifiable === "UNKNOWN") verificationNeeds.push("PAYMENT_VERIFIABILITY");

  return {
    candidateId:c.id,
    decision:verificationNeeds.length ? "NEEDS_VERIFICATION" : "PASS_TO_ECONOMICS",
    reasons:[],
    verificationNeeds,
    speculative:c.probabilityDependent,
    humanRequired:c.participationMode==="HUMAN_REQUIRED"
  };
}
