import type { Opportunity } from "./domain.js";

export interface AuthoritativeIssueState {
  state: "open" | "closed";
  locked: boolean;
  assignees: string[];
  openCompetingPullRequests: number;
  checkedAt: string;
}

export type ViabilityReason =
  | "ISSUE_CLOSED"
  | "ISSUE_LOCKED"
  | "ALREADY_ASSIGNED"
  | "COMPETING_PR_EXISTS";

export interface ViabilityDecision {
  viable: boolean;
  reasons: ViabilityReason[];
}

export function verifyIssueViability(
  _opportunity: Opportunity,
  state: AuthoritativeIssueState,
): ViabilityDecision {
  const reasons: ViabilityReason[] = [];
  if (state.state !== "open") reasons.push("ISSUE_CLOSED");
  if (state.locked) reasons.push("ISSUE_LOCKED");
  if (state.assignees.length > 0) reasons.push("ALREADY_ASSIGNED");
  if (state.openCompetingPullRequests > 0) reasons.push("COMPETING_PR_EXISTS");
  return { viable: reasons.length === 0, reasons };
}
