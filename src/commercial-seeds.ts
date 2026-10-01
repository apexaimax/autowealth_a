import type { DemandRecommendation } from "./demand-intelligence.js";

export type CommercialResearchVerificationNeed =
  | "AUTHORITATIVE_WORKFLOW" | "CAPABILITY_EVIDENCE" | "BUYER_INTENT"
  | "PAYMENT_PATH" | "VERIFIED_CONTACT";

export interface CommercialResearchSeed {
  key:string;
  organizationHint?:string;
  repositoryHint?:string;
  matchedAssetId:string;
  matchedAssetName?:string;
  matchedKeywords:string[];
  discoveryUrls:string[];
  authoritativeCommercialEvidence:false;
  requiredVerification:CommercialResearchVerificationNeed[];
}

function githubRepo(url:string):{organizationHint:string;repositoryHint:string}|undefined {
  const match=url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:issues|pull)\/\d+/i);
  if(!match) return undefined;
  return {organizationHint:match[1]!,repositoryHint:match[1]+"/"+match[2]!};
}

export function buildCommercialResearchSeeds(recommendations:readonly DemandRecommendation[]):CommercialResearchSeed[] {
  return recommendations.flatMap(recommendation=>{
    if(!recommendation.matchedAssetId || recommendation.action==="CREATE_NEW") return [];
    const repoHint=recommendation.sourceUrls.map(githubRepo).find(Boolean);
    const seed:CommercialResearchSeed={
      key:"commercial-seed:"+recommendation.key,
      matchedAssetId:recommendation.matchedAssetId,
      matchedKeywords:[...recommendation.matchedKeywords],
      discoveryUrls:[...recommendation.sourceUrls],
      authoritativeCommercialEvidence:false,
      requiredVerification:["AUTHORITATIVE_WORKFLOW","CAPABILITY_EVIDENCE","BUYER_INTENT","PAYMENT_PATH","VERIFIED_CONTACT"]
    };
    if(recommendation.matchedAssetName) seed.matchedAssetName=recommendation.matchedAssetName;
    if(repoHint){
      seed.organizationHint=repoHint.organizationHint;
      seed.repositoryHint=repoHint.repositoryHint;
    }
    return [seed];
  });
}
