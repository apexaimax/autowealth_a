export type CapabilityEvidenceLevel =
  | "LIVE_VERIFIED" | "DETERMINISTICALLY_TESTED" | "USER_REAL_WORLD_VERIFIED"
  | "PARTIAL" | "UNVERIFIED" | "HYPOTHESIS";

export interface CapabilityEvidence {
  projectId:string;
  capabilityId:string;
  description:string;
  evidenceLevel:CapabilityEvidenceLevel;
  evidenceReferences:string[];
  demonstratedScope:string[];
  limitations:string[];
  signals:string[];
  commercialApplications:string[];
}

export function createCapability(input:CapabilityEvidence):CapabilityEvidence {
  if(!input.projectId.trim() || !input.capabilityId.trim() || !input.description.trim()) throw new Error("INVALID_CAPABILITY");
  return {
    ...input,
    evidenceReferences:[...input.evidenceReferences],
    demonstratedScope:[...input.demonstratedScope],
    limitations:[...input.limitations],
    signals:[...input.signals],
    commercialApplications:[...input.commercialApplications]
  };
}

function normalized(value:string):string { return value.trim().toLowerCase(); }

export function capabilityClaimAllowed(capability:CapabilityEvidence, claim:string):boolean {
  const target=normalized(claim);
  if(!target) return false;
  return capability.demonstratedScope.some(scope=>normalized(scope)===target);
}
