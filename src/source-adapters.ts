import { resolveAuthoritativeText } from "./verification-resolver.js";
import type { RawOpportunity } from "./collector.js";

export interface SourceAdapter<T> {
  readonly id: string;
  ingest(input: T, observedAt: string): RawOpportunity[];
}

export interface GitHubIssueRecord {
  repository: string;
  number: number;
  title: string;
  htmlUrl: string;
  state: "open" | "closed";
  locked?: boolean;
  labels?: string[];
  assignees?: string[];
  body?: string;
  comments?: number;
}

const MONEY_PATTERNS = [
  /(?:\$|USD\s*)(\d+(?:\.\d{1,2})?)/i,
  /(\d+(?:\.\d{1,2})?)\s*USD\b/i
];

function cashAmount(text: string): number | undefined {
  for (const pattern of MONEY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return undefined;
}

function bountySignal(issue: GitHubIssueRecord): boolean {
  const labels = (issue.labels ?? []).join(" ").toLowerCase();
  const text = (issue.title + " " + (issue.body ?? "")).toLowerCase();
  return /bounty|reward|paid/.test(labels) || /\bbounty\b|\breward\b|\bpaid\b/.test(text);
}

export const githubIssueAdapter: SourceAdapter<GitHubIssueRecord[]> = {
  id: "github-issues",
  ingest(issues, observedAt) {
    return issues.filter(bountySignal).map(issue => {
      const amount = cashAmount(issue.title + "\n" + (issue.body ?? ""));
      const raw:RawOpportunity = {
        sourceId: "github:" + issue.repository,
        externalId: String(issue.number),
        title: issue.title,
        url: issue.htmlUrl,
        sourceKind: "authoritative" as const,
        category: "bounty" as const,
        rewardType: amount === undefined ? "unknown" as const : "cash" as const,
        requiresUpfrontSpend: "UNKNOWN" as const,
        openStatus: issue.state === "open" && !issue.locked ? "OPEN" as const : "CLOSED" as const,
        participationMode: "ASSISTED" as const,
        eligible: "UNKNOWN" as const,
        deviceCompatible: "UNKNOWN" as const,
        paymentVerifiable: "UNKNOWN" as const,
        competitionCount: (issue.assignees?.length ?? 0) + (issue.comments ?? 0),
        probabilityDependent: true,
        observedAt,
        ...(amount === undefined ? {} : { advertisedRewardUsd: amount })
      };
      return resolveAuthoritativeText(raw,issue.title+"\n"+(issue.body ?? ""),issue.htmlUrl).resolved;
    });
  }
};
