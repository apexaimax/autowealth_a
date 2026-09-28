import type { DiscoveryCandidate, OpportunityCategory, ParticipationMode, RewardType } from "./discovery-policy.js";

export interface RawOpportunity {
  sourceId: string;
  externalId: string;
  title: string;
  url: string;
  sourceKind: "authoritative" | "aggregator" | "search" | "community";
  category: OpportunityCategory;
  rewardType?: RewardType;
  advertisedRewardUsd?: number;
  requiresUpfrontSpend?: boolean | "UNKNOWN";
  openStatus?: "OPEN" | "CLOSED" | "UNKNOWN";
  participationMode?: ParticipationMode;
  eligible?: boolean | "UNKNOWN";
  deviceCompatible?: boolean | "UNKNOWN";
  paymentVerifiable?: boolean | "UNKNOWN";
  competitionCount?: number;
  probabilityDependent?: boolean;
  observedAt: string;
}

export interface CollectedCandidate {
  raw: RawOpportunity;
  candidate: DiscoveryCandidate;
}

export function normalizeRawOpportunity(raw: RawOpportunity): CollectedCandidate {
  const authoritative = raw.sourceKind === "authoritative";
  const candidate: DiscoveryCandidate = {
    id: raw.sourceId + ":" + raw.externalId,
    category: raw.category,
    rewardType: raw.rewardType ?? "unknown",
    requiresUpfrontSpend: raw.requiresUpfrontSpend ?? "UNKNOWN",
    authorityStatus: authoritative ? "AUTHORITATIVE" : "UNVERIFIED",
    openStatus: raw.openStatus ?? "UNKNOWN",
    participationMode: raw.participationMode ?? "ASSISTED",
    eligible: raw.eligible ?? "UNKNOWN",
    deviceCompatible: raw.deviceCompatible ?? "UNKNOWN",
    paymentVerifiable: raw.paymentVerifiable ?? "UNKNOWN",
    probabilityDependent: raw.probabilityDependent ?? false,
    ...(raw.advertisedRewardUsd === undefined ? {} : { advertisedRewardUsd: raw.advertisedRewardUsd }),
    ...(authoritative ? { authoritativeReference: raw.url } : {}),
    ...(raw.competitionCount === undefined ? {} : { competitionCount: raw.competitionCount })
  };
  return { raw, candidate };
}

export function collectUnique(raw: RawOpportunity[]): CollectedCandidate[] {
  const seen = new Set<string>();
  const out: CollectedCandidate[] = [];
  for (const item of raw) {
    const key = item.sourceId + ":" + item.externalId;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalizeRawOpportunity(item));
  }
  return out;
}
