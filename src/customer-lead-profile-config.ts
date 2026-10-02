import type { CustomerLeadProfile } from "./customer-leads.js";

function csv(value:string|undefined):string[]{return (value??"").split(",").map(x=>x.trim()).filter(Boolean);}

export function customerLeadProfileFromEnv(env:NodeJS.ProcessEnv):CustomerLeadProfile|undefined {
  const id=env.REVENUE_CUSTOMER_ID?.trim();
  const name=env.REVENUE_CUSTOMER_NAME?.trim();
  const offer=env.REVENUE_CUSTOMER_OFFER?.trim();
  if(!id&&!name&&!offer) return undefined;
  if(!id||!name||!offer) throw new Error("REVENUE_CUSTOMER_ID, REVENUE_CUSTOMER_NAME, and REVENUE_CUSTOMER_OFFER are required together");
  return {
    id,name,offer,
    targetIndustries:csv(env.REVENUE_CUSTOMER_INDUSTRIES),
    targetRoles:csv(env.REVENUE_CUSTOMER_ROLES),
    targetRegions:csv(env.REVENUE_CUSTOMER_REGIONS),
    problemTerms:csv(env.REVENUE_CUSTOMER_PROBLEMS),
    solutionTerms:csv(env.REVENUE_CUSTOMER_SOLUTIONS),
    exclusions:csv(env.REVENUE_CUSTOMER_EXCLUSIONS)
  };
}
