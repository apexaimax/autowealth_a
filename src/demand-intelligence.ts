export type DemandLane = "EXISTING_PRODUCT" | "NEW_PRODUCT" | "SERVICE" | "REMOTE_WORK";
export type DemandAction = "USE_EXISTING" | "ADAPT_EXISTING" | "CREATE_NEW" | "OFFER_SERVICE" | "PURSUE_REMOTE_WORK";
export type AssetStatus = "VERIFIED" | "PARTIAL" | "UNVERIFIED";
export type DemandIntent = "MARKET_PAIN" | "SERVICE_REQUEST" | "REMOTE_WORK";

export interface ProjectAsset {
  id: string;
  name: string;
  status: AssetStatus;
  keywords: string[];
}

export interface DemandObservation {
  id: string;
  title: string;
  body?: string;
  url: string;
  observedAt: string;
  intent: DemandIntent;
}

export type DemandVerificationNeed =
  | "RECURRENCE"
  | "BUYER_INTENT"
  | "PAYMENT_PATH"
  | "COMPETITION"
  | "ASSET_READINESS";

export interface DemandRecommendation {
  key: string;
  lane: DemandLane;
  action: DemandAction;
  evidenceCount: number;
  sourceUrls: string[];
  matchedAssetId?: string;
  matchedAssetName?: string;
  matchedAssetStatus?: AssetStatus;
  matchedKeywords: string[];
  verificationNeeds: DemandVerificationNeed[];
  speculative: true;
}

const GENERIC_WORDS = new Set([
  "about","after","again","against","also","and","are","because","been","before","being","build","can","could","does","for","from","have","into","issue","looking","need","needs","open","our","please","request","that","the","their","them","then","there","these","they","this","tool","using","want","with","workflow","would","your"
]);

function textOf(observation: DemandObservation): string {
  return `${observation.title}\n${observation.body ?? ""}`.toLowerCase();
}

function demandSignal(text: string): boolean {
  return /\b(?:manual|tedious|repetitive|time[- ]consuming|painful|frustrat\w*|wish|need|needs|looking for|request(?:ing)?|automate|automation|workflow|problem|difficult|slow)\b/i.test(text);
}

function keywordMatches(text: string, asset: ProjectAsset): string[] {
  return asset.keywords
    .map(keyword => keyword.trim().toLowerCase())
    .filter(Boolean)
    .filter(keyword => text.includes(keyword));
}

function matchScore(matches: string[]): number {
  return matches.reduce((score, keyword) => score + (keyword.includes(" ") ? 2 : 1), 0);
}

function signature(text: string): string {
  const tokens = text.match(/[a-z0-9][a-z0-9-]{2,}/g) ?? [];
  const useful = [...new Set(tokens.filter(token => !GENERIC_WORDS.has(token)))].sort();
  return useful.slice(0, 4).join("-") || "unclassified";
}

interface ClassifiedObservation {
  observation: DemandObservation;
  key: string;
  lane: DemandLane;
  action: DemandAction;
  matchedAsset?: ProjectAsset;
  matchedKeywords: string[];
}

function classify(observation: DemandObservation, assets: readonly ProjectAsset[]): ClassifiedObservation | undefined {
  const text = textOf(observation);
  if (!demandSignal(text)) return undefined;

  if (observation.intent === "REMOTE_WORK") {
    return { observation, key: `remote:${signature(text)}`, lane: "REMOTE_WORK", action: "PURSUE_REMOTE_WORK", matchedKeywords: [] };
  }

  const matches = assets
    .map(asset => ({ asset, keywords: keywordMatches(text, asset) }))
    .map(row => ({ ...row, score: matchScore(row.keywords) }))
    .filter(row => row.score >= 2)
    .sort((a, b) => b.score - a.score || a.asset.id.localeCompare(b.asset.id));
  const best = matches[0];

  if (observation.intent === "SERVICE_REQUEST") {
    return {
      observation,
      key: best ? `service:${best.asset.id}` : `service:${signature(text)}`,
      lane: "SERVICE",
      action: "OFFER_SERVICE",
      ...(best ? { matchedAsset: best.asset, matchedKeywords: best.keywords } : { matchedKeywords: [] })
    };
  }

  if (best) {
    const useExisting = best.asset.status === "VERIFIED" && best.score >= 4;
    return {
      observation,
      key: `asset:${best.asset.id}`,
      lane: "EXISTING_PRODUCT",
      action: useExisting ? "USE_EXISTING" : "ADAPT_EXISTING",
      matchedAsset: best.asset,
      matchedKeywords: best.keywords
    };
  }

  return {
    observation,
    key: `new:${signature(text)}`,
    lane: "NEW_PRODUCT",
    action: "CREATE_NEW",
    matchedKeywords: []
  };
}

export function analyzeDemand(observations: readonly DemandObservation[], assets: readonly ProjectAsset[]): DemandRecommendation[] {
  const groups = new Map<string, ClassifiedObservation[]>();
  for (const observation of observations) {
    const classified = classify(observation, assets);
    if (!classified) continue;
    const current = groups.get(classified.key) ?? [];
    current.push(classified);
    groups.set(classified.key, current);
  }

  return [...groups.entries()].map(([key, rows]) => {
    const first = rows[0]!;
    const urls = [...new Set(rows.map(row => row.observation.url))];
    const keywords = [...new Set(rows.flatMap(row => row.matchedKeywords))].sort();
    const verificationNeeds: DemandVerificationNeed[] = ["BUYER_INTENT", "PAYMENT_PATH", "COMPETITION"];
    if (rows.length < 2) verificationNeeds.unshift("RECURRENCE");
    if (first.matchedAsset && first.matchedAsset.status !== "VERIFIED") verificationNeeds.push("ASSET_READINESS");
    return {
      key,
      lane: first.lane,
      action: first.action,
      evidenceCount: rows.length,
      sourceUrls: urls,
      ...(first.matchedAsset ? {
        matchedAssetId: first.matchedAsset.id,
        matchedAssetName: first.matchedAsset.name,
        matchedAssetStatus: first.matchedAsset.status
      } : {}),
      matchedKeywords: keywords,
      verificationNeeds,
      speculative: true as const
    };
  }).sort((a, b) => b.evidenceCount - a.evidenceCount || a.key.localeCompare(b.key));
}

export const DEFAULT_PROJECT_ASSETS: readonly ProjectAsset[] = [
  {
    id: "version-vault",
    name: "VersionVault",
    status: "VERIFIED",
    keywords: ["zip", "zip64", "archive", "compare versions", "release comparison", "crc", "release verification"]
  },
  {
    id: "proofrail",
    name: "ProofRail",
    status: "PARTIAL",
    keywords: ["ai agent", "approval", "authorization", "audit trail", "replay", "tamper-evident", "github actions"]
  },
  {
    id: "fieldbridge-studio",
    name: "FieldBridge Studio",
    status: "PARTIAL",
    keywords: ["form mapping", "field mapping", "browser extension", "form fill", "local-first", "stale dom"]
  },
  {
    id: "chartpaste-md",
    name: "ChartPaste MD",
    status: "PARTIAL",
    keywords: ["ehr", "clinical documentation", "clinical form", "clipboard", "browser extension", "healthcare workflow"]
  },
  {
    id: "resumaster",
    name: "ResuMaster",
    status: "UNVERIFIED",
    keywords: ["resume", "cover letter", "job description", "interview preparation", "career"]
  }
];
