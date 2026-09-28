import type { DeviceCapability, UserCapabilityProfile, WorkCapability } from "./profile-fit.js";

const DEVICES:DeviceCapability[]=["PHONE","TABLET","DESKTOP","CHROME_EXTENSION","LOCAL_DEV","MICROPHONE"];
const WORK:WorkCapability[]=["GITHUB_REVIEW","CODE_ANALYSIS","DOCUMENTATION","QA","AI_ASSISTED_RESEARCH"];

function list(value:string|undefined):string[]{return (value??"").split(",").map(x=>x.trim().toUpperCase()).filter(Boolean);}
function allowed<T extends string>(values:string[],valid:readonly T[],name:string):T[]{
 const bad=values.filter(x=>!valid.includes(x as T));
 if(bad.length) throw new Error("Invalid "+name+": "+bad.join(","));
 return values as T[];
}

export function profileFromEnv(env:NodeJS.ProcessEnv):UserCapabilityProfile|undefined {
 const devices=list(env.REVENUE_PROFILE_DEVICES);
 const work=list(env.REVENUE_PROFILE_WORK);
 const countries=list(env.REVENUE_PROFILE_COUNTRIES);
 if(!devices.length && !work.length && !countries.length) return undefined;
 return {
  devices:allowed(devices,DEVICES,"device capability"),
  workCapabilities:allowed(work,WORK,"work capability"),
  ...(countries.length?{countries}:{})
 };
}
