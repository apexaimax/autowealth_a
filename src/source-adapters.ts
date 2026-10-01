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
  /(?:\$|USD\s*)(\d[\d,]*(?:\.\d{1,2})?)\s*([kKmM])?/i,
  /(\d[\d,]*(?:\.\d{1,2})?)\s*([kKmM])?\s*USD\b/i
];

function cashAmount(text: string): number | undefined {
  for (const pattern of MONEY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const base = Number(match[1]?.replaceAll(",", ""));
      const suffix = match[2]?.toLowerCase();
      const multiplier = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1;
      const n = base * multiplier;
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return undefined;
}

const AGGREGATOR_REPO_PATTERNS=[
  /(?:^|[-_.])bountyscout(?:$|[-_.])/i,
  /(?:^|[-_.])bounty[-_.]?plaza(?:$|[-_.])/i,
  /(?:^|[-_.])bounty[-_.]?(?:radar|board|watch|feed|aggregator)(?:$|[-_.])/i
];
const AGGREGATOR_TEXT_PATTERNS=[
  /\b(?:opportunity|bounty) (?:queue|radar|watch|digest|feed|roundup|index)\b/i,
  /\b(?:aggregated|aggregator|curated) (?:bounties|opportunities|listings)\b/i,
  /\bmultiple (?:bounties|opportunities|listings)\b/i
];

export function isAggregatorIssue(issue:GitHubIssueRecord):boolean {
  const repo=issue.repository.split("/").at(-1)??issue.repository;
  if(AGGREGATOR_REPO_PATTERNS.some(pattern=>pattern.test(repo))) return true;
  const text=issue.title+"\n"+(issue.body??"");
  return AGGREGATOR_TEXT_PATTERNS.some(pattern=>pattern.test(text));
}

function paymentContextAmount(issue: GitHubIssueRecord): number | undefined {
  if (/\b(?:bounty|reward|payment|paid)\b/i.test(issue.title)) {
    const titleAmount = cashAmount(issue.title);
    if (titleAmount !== undefined) return titleAmount;
  }
  const body = issue.body ?? "";
  for (const sentence of body.split(/[.!?\n]+/)) {
    if (/\b(?:bounty|reward|payment|paid)\b/i.test(sentence)) {
      const amount = cashAmount(sentence);
      if (amount !== undefined) return amount;
    }
  }
  return undefined;
}

function bountySignal(issue: GitHubIssueRecord): boolean {
  const labels = (issue.labels ?? []).join(" ");
  if (/\bbounty\b|\breward\b|\bpaid\b/i.test(labels)) return true;
  if (/\bbounty\b|\breward\b|\bpaid\b/i.test(issue.title)) return true;
  const body = issue.body ?? "";
  return body
    .split(/[.!?\n]+/)
    .some(sentence =>
      /\b(?:bounty|reward|payment|paid)\b/i.test(sentence) &&
      /(?:\$\s*\d[\d,]*(?:\.\d{1,2})?\s*[kKmM]?|\b\d[\d,]*(?:\.\d{1,2})?\s*[kKmM]?\s*USD\b)/i.test(sentence)
    );
}

export const githubIssueAdapter: SourceAdapter<GitHubIssueRecord[]> = {
  id: "github-issues",
  ingest(issues, observedAt, profile) {
    return issues.filter(bountySignal).map(issue => {
      const amount = paymentContextAmount(issue);
      const raw:RawOpportunity = {
        sourceId: "github:" + issue.repository,
        externalId: String(issue.number),
        title: issue.title,
        url: issue.htmlUrl,
        sourceKind: isAggregatorIssue(issue) ? "aggregator" as const : "authoritative" as const,
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
