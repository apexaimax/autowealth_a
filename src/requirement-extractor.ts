import type { DeviceCapability, OpportunityRequirements, WorkCapability } from "./profile-fit.js";

export interface RequirementExtraction {
  requirements: OpportunityRequirements;
  evidence: Array<{kind:"country"|"device"|"work";value:string;reference:string}>;
}

const devicePatterns:Array<[DeviceCapability,RegExp]>=[
 ["DESKTOP",/\b(?:desktop|laptop|pc|mac|windows computer) required\b/i],
 ["CHROME_EXTENSION",/\b(?:chrome extension|browser extension) (?:experience )?(?:required|needed)\b/i],
 ["LOCAL_DEV",/\b(?:local development|local dev|run locally|local environment) (?:required|needed)\b/i],
 ["MICROPHONE",/\b(?:microphone|mic) (?:required|needed)\b/i],
 ["PHONE",/\b(?:smartphone|phone) (?:required|needed)\b/i],
 ["TABLET",/\btablet (?:required|needed)\b/i]
];

const workPatterns:Array<[WorkCapability,RegExp]>=[
 ["GITHUB_REVIEW",/\b(?:github|pull request|repository|repo) (?:review|audit) (?:required|needed)\b/i],
 ["CODE_ANALYSIS",/\b(?:code review|code audit|source code analysis) (?:required|needed)\b/i],
 ["DOCUMENTATION",/\b(?:technical documentation|documentation writing) (?:required|needed)\b/i],
 ["QA",/\b(?:qa|quality assurance|manual testing|software testing) (?:experience )?(?:required|needed)\b/i],
 ["AI_ASSISTED_RESEARCH",/\b(?:ai research|llm research|ai-assisted research) (?:required|needed)\b/i]
];

const countryPatterns:Array<[string,RegExp]>=[
 ["US",/\b(?:US|U\.S\.|United States)(?:[- ]only| residents? only| applicants? only|required)\b/i],
 ["CA",/\bCanada(?:[- ]only| residents? only| applicants? only|required)\b/i],
 ["GB",/\b(?:UK|U\.K\.|United Kingdom)(?:[- ]only| residents? only| applicants? only|required)\b/i]
];

export function extractExplicitRequirements(text:string,reference:string):RequirementExtraction {
 const requiredDevices:DeviceCapability[]=[];
 const requiredWorkCapabilities:WorkCapability[]=[];
 const allowedCountries:string[]=[];
 const evidence:RequirementExtraction["evidence"]=[];

 for(const [value,pattern] of devicePatterns) if(pattern.test(text)){requiredDevices.push(value);evidence.push({kind:"device",value,reference});}
 for(const [value,pattern] of workPatterns) if(pattern.test(text)){requiredWorkCapabilities.push(value);evidence.push({kind:"work",value,reference});}
 for(const [value,pattern] of countryPatterns) if(pattern.test(text)){allowedCountries.push(value);evidence.push({kind:"country",value,reference});}

 const requirements:OpportunityRequirements={};
 if(requiredDevices.length) requirements.requiredDevices=requiredDevices;
 if(requiredWorkCapabilities.length) requirements.requiredWorkCapabilities=requiredWorkCapabilities;
 if(allowedCountries.length) requirements.allowedCountries=allowedCountries;
 return {requirements,evidence};
}
