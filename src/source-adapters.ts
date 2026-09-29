import { extractExplicitRequirements } from "./requirement-extractor.js";
import { resolveProfileFit, type UserCapabilityProfile } from "./profile-fit.js";
import { resolveAuthoritativeText } from "./verification-resolver.js";
import type { RawOpportunity } from "./collector.js";

export interface SourceAdapter<T> {
  readonly id: string;
  ingest(input: T, observedAt: string, profile?: UserCapabilityProfile): RawOpportunity[];
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
  /(?:\$|USD\s*)(\d[\d,]*(?:\.\d{1,2})?)/i,
  /(\d[\d,]*(?:\.\d{1,2})?)\s*USD\b/i
];

function cashAmount(text: string): number | undefined {
  for (const pattern of MONEY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const n = Number(match[1]?.replaceAll(",", ""));
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return undefined;
}

function bountySignal(issue: GitHubIssueRecord): boolean {
  const labels = (issue.labels ?? []).join(" ");
  if (/\bbounty\b|\breward\b|\bpaid\b/i.test(labels)) return true;
  if (/\bbounty\b|\breward\b|\bpaid\b/i.test(issue.title)) return true;
  const body = issue.body ?? "";
  return /\b(?:bounty|reward|payment|paid)\b[^$\n]{0,80}\$\s*\d[\d,]*/i.test(body);
}

export const githubIssueAdapter: SourceAdapter<GitHubIssueRecord[]> = {
  id: "github-issues",
  ingest(issues, observedAt, profile) {
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
      const text=issue.title+"\n"+(issue.body ?? "");
      const verified=resolveAuthoritativeText(raw,text,issue.htmlUrl).resolved;
      if(!profile) return verified;
      const extracted=extractExplicitRequirements(text,issue.htmlUrl);
      return resolveProfileFit(verified,profile,extracted.requirements).resolved;
    });
  }
};
