import type { RawOpportunity } from "./collector.js";
import type { OpportunityCategory, ParticipationMode, RewardType } from "./discovery-policy.js";

export interface StructuredListing {
  provider: string;
  id: string;
  title: string;
  url: string;
  authoritative: boolean;
  category: OpportunityCategory;
  rewardType: RewardType;
  rewardUsd?: number;
  open?: boolean;
  requiresUpfrontSpend?: boolean | "UNKNOWN";
  participationMode?: ParticipationMode;
  eligible?: boolean | "UNKNOWN";
  deviceCompatible?: boolean | "UNKNOWN";
  paymentVerifiable?: boolean | "UNKNOWN";
  probabilityDependent?: boolean;
}

export function ingestStructuredListings(rows: StructuredListing[], observedAt: string): RawOpportunity[] {
  return rows.map(row => ({
    sourceId: row.provider,
    externalId: row.id,
    title: row.title,
    url: row.url,
    sourceKind: row.authoritative ? "authoritative" : "aggregator",
    category: row.category,
    rewardType: row.rewardType,
    requiresUpfrontSpend: row.requiresUpfrontSpend ?? "UNKNOWN",
    openStatus: row.open === undefined ? "UNKNOWN" : row.open ? "OPEN" : "CLOSED",
    participationMode: row.participationMode ?? "HUMAN_REQUIRED",
    eligible: row.eligible ?? "UNKNOWN",
    deviceCompatible: row.deviceCompatible ?? "UNKNOWN",
    paymentVerifiable: row.paymentVerifiable ?? "UNKNOWN",
    probabilityDependent: row.probabilityDependent ?? false,
    observedAt,
    ...(row.rewardUsd === undefined ? {} : { advertisedRewardUsd: row.rewardUsd })
  }));
}
