import type { RawOpportunity } from "./collector.js";

export type DeviceCapability = "PHONE" | "TABLET" | "DESKTOP" | "CHROME_EXTENSION" | "LOCAL_DEV" | "MICROPHONE";
export type WorkCapability = "GITHUB_REVIEW" | "CODE_ANALYSIS" | "DOCUMENTATION" | "QA" | "AI_ASSISTED_RESEARCH";

export interface UserCapabilityProfile {
  devices: DeviceCapability[];
  workCapabilities: WorkCapability[];
  countries?: string[];
}

export interface OpportunityRequirements {
  requiredDevices?: DeviceCapability[];
  requiredWorkCapabilities?: WorkCapability[];
  allowedCountries?: string[];
}

export interface ProfileFitResolution {
  resolved: RawOpportunity;
  eligibilityBasis?: string;
  deviceBasis?: string;
}

function normalized(values:string[]|undefined){return (values??[]).map(x=>x.trim().toUpperCase()).filter(Boolean);}

export function resolveProfileFit(raw:RawOpportunity,profile:UserCapabilityProfile,requirements:OpportunityRequirements):ProfileFitResolution {
  const resolved:RawOpportunity={...raw};
  let eligibilityBasis:string|undefined;
  let deviceBasis:string|undefined;

  if(raw.eligible==="UNKNOWN" && requirements.allowedCountries?.length){
    const userCountries=normalized(profile.countries);
    if(userCountries.length){
      const allowed=normalized(requirements.allowedCountries);
      resolved.eligible=allowed.some(country=>userCountries.includes(country));
      eligibilityBasis=resolved.eligible
        ? "profile country matches an explicitly allowed country"
        : "profile country does not match any explicitly allowed country";
    }
  }

  if(raw.deviceCompatible==="UNKNOWN" && requirements.requiredDevices?.length){
    const hasAll=requirements.requiredDevices.every(device=>profile.devices.includes(device));
    resolved.deviceCompatible=hasAll;
    deviceBasis=hasAll
      ? "profile contains every explicitly required device capability"
      : "profile is missing at least one explicitly required device capability";
  }

  if(resolved.eligible!=="UNKNOWN" && resolved.deviceCompatible==="UNKNOWN" && requirements.requiredWorkCapabilities?.length){
    const hasAll=requirements.requiredWorkCapabilities.every(cap=>profile.workCapabilities.includes(cap));
    if(!hasAll){
      resolved.eligible=false;
      eligibilityBasis="profile is missing at least one explicitly required work capability";
    }
  }

  return {
    resolved,
    ...(eligibilityBasis?{eligibilityBasis}:{}),
    ...(deviceBasis?{deviceBasis}:{})
  };
}
