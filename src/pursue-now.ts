import { verifyIssueViability, type AuthoritativeIssueState, type ViabilityReason } from "./issue-viability.js";
import type { Opportunity } from "./domain.js";

export type PursueNowReason =
  | ViabilityReason
  | "HIGH_COMPETITION"
  | "CAPABILITY_UNVERIFIED"
  | "CAPABILITY_MISMATCH"
  | "TOOLS_OR_COST_UNKNOWN"
  | "TOOLS_OR_COST_BLOCKED"
  | "PAYMENT_PATH_UNVERIFIED"
  | "EFFORT_UNVERIFIED"
  | "INVALID_ECONOMICS";

export interface PursueNowInput {
  candidateId: string;
  issue: AuthoritativeIssueState;
  capability: "VERIFIED" | "UNKNOWN" | "MISMATCH";
  requiredTools: "AVAILABLE_FREE" | "UNKNOWN" | "BLOCKED_OR_PAID";
  paymentPath: "VERIFIED" | "UNKNOWN";
  effort: { status: "VERIFIED"; manualHours: number } | { status: "UNKNOWN" };
  economics: { expectedNetUsd: number; expectedDaysToPayment: number };
  competitionCount: number;
  automationLeverage: number;
}

export interface PursueNowDecision {
  decision: "PURSUE_NOW" | "NEEDS_VERIFICATION" | "DO_NOT_PURSUE";
  reasons: PursueNowReason[];
}

export function evaluatePursueNow(input: PursueNowInput): PursueNowDecision {
  const shell: Opportunity = {
    id: input.candidateId,
    title: input.candidateId,
    source: "pursue-now",
    expectedRevenueUsd: input.economics.expectedNetUsd,
    maxCostUsd: 0,
    executable: true,
    evidence: [],
  };
  const viability = verifyIssueViability(shell, input.issue);
  if (!viability.viable) return { decision: "DO_NOT_PURSUE", reasons: viability.reasons };

  const reasons: PursueNowReason[] = [];
  if (input.capability === "MISMATCH") reasons.push("CAPABILITY_MISMATCH");
  else if (input.capability !== "VERIFIED") reasons.push("CAPABILITY_UNVERIFIED");

  if (input.requiredTools === "BLOCKED_OR_PAID") reasons.push("TOOLS_OR_COST_BLOCKED");
  else if (input.requiredTools !== "AVAILABLE_FREE") reasons.push("TOOLS_OR_COST_UNKNOWN");

  if (input.paymentPath !== "VERIFIED") reasons.push("PAYMENT_PATH_UNVERIFIED");
  if (input.effort.status !== "VERIFIED") reasons.push("EFFORT_UNVERIFIED");

  if (!Number.isFinite(input.economics.expectedNetUsd) || input.economics.expectedNetUsd <= 0 ||
      !Number.isFinite(input.economics.expectedDaysToPayment) || input.economics.expectedDaysToPayment < 0 ||
      !Number.isFinite(input.competitionCount) || input.competitionCount < 0 ||
      !Number.isFinite(input.automationLeverage) || input.automationLeverage < 0 || input.automationLeverage > 1 ||
      (input.effort.status === "VERIFIED" && (!Number.isFinite(input.effort.manualHours) || input.effort.manualHours <= 0))) {
    reasons.push("INVALID_ECONOMICS");
  }

  if (input.competitionCount >= 10) reasons.push("HIGH_COMPETITION");

  if (reasons.includes("CAPABILITY_MISMATCH") || reasons.includes("TOOLS_OR_COST_BLOCKED") || reasons.includes("INVALID_ECONOMICS")) {
    return { decision: "DO_NOT_PURSUE", reasons };
  }
  if (reasons.length > 0) return { decision: "NEEDS_VERIFICATION", reasons };
  return { decision: "PURSUE_NOW", reasons: [] };
}
