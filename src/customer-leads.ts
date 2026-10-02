import { createHash } from "node:crypto";

export type LeadEvidenceKind="DECLARED_NEED"|"HIRING"|"REQUEST_FOR_HELP"|"PILOT"|"PROCUREMENT"|"RESEARCH"|"OTHER";
export type LeadDecision="QUALIFIED"|"NEEDS_VERIFICATION"|"RESEARCH_SEED"|"REJECT";

export interface CustomerLeadProfile {
  id:string;
  name:string;
  offer:string;
  targetIndustries:string[];
  targetRoles:string[];
  targetRegions:string[];
  problemTerms:string[];
  solutionTerms:string[];
  exclusions:string[];
}

export interface LeadSignal {
  source:string;
  url:string;
  title:string;
  body:string;
  observedAt:string;
  evidenceKind:LeadEvidenceKind;
  company?:string;
  person?:string;
  role?:string;
  industry?:string;
  region?:string;
}

export interface QualifiedLead {
  key:string;
  customerProfileId:string;
  title:string;
  url:string;
  source:string;
  company?:string;
  person?:string;
  observedAt:string;
  evidenceKind:LeadEvidenceKind;
  fitReasons:string[];
  intentReasons:string[];
  unknowns:string[];
  decision:LeadDecision;
}

const norm=(s:string)=>s.trim().toLowerCase();
const contains=(text:string,terms:readonly string[])=>terms.filter(term=>text.includes(norm(term)));
export function leadKey(profileId:string,source:string,url:string):string {
  let normalized=url.trim();try{const u=new URL(url);u.hash="";for(const k of [...u.searchParams.keys()])if(/^utm_/i.test(k))u.searchParams.delete(k);normalized=u.toString();}catch{}
  return createHash("sha256").update(JSON.stringify([profileId,source,normalized])).digest("hex");
}
export function qualifyLead(profile:CustomerLeadProfile,signal:LeadSignal):QualifiedLead {
  const text=norm([signal.title,signal.body,signal.company,signal.role,signal.industry,signal.region].filter(Boolean).join(" "));
  const exclusions=contains(text,profile.exclusions);
  const problemHits=contains(text,profile.problemTerms);
  const solutionHits=contains(text,profile.solutionTerms);
  const industryHits=contains(text,profile.targetIndustries);
  const roleHits=contains(text,profile.targetRoles);
  const regionHits=contains(text,profile.targetRegions);
  const fitReasons=[...industryHits.map(x=>`industry:${x}`),...roleHits.map(x=>`role:${x}`),...regionHits.map(x=>`region:${x}`),...solutionHits.map(x=>`solution:${x}`)];
  const intentReasons=[...problemHits.map(x=>`problem:${x}`),`signal:${signal.evidenceKind.toLowerCase()}`];
  const unknowns:string[]=[];
  if(!signal.company)unknowns.push("COMPANY_IDENTITY");
  if(!signal.person)unknowns.push("CONTACT_IDENTITY");
  if(!signal.role)unknowns.push("CONTACT_AUTHORITY");
  if(exclusions.length)return {key:leadKey(profile.id,signal.source,signal.url),customerProfileId:profile.id,title:signal.title,url:signal.url,source:signal.source,...(signal.company?{company:signal.company}:{}),...(signal.person?{person:signal.person}:{}),observedAt:signal.observedAt,evidenceKind:signal.evidenceKind,fitReasons,intentReasons,unknowns:[...unknowns,...exclusions.map(x=>`EXCLUDED:${x}`)],decision:"REJECT"};
  const strongIntent=["DECLARED_NEED","REQUEST_FOR_HELP","PILOT","PROCUREMENT"].includes(signal.evidenceKind)&&problemHits.length>0;
  const hasFit=fitReasons.length>0;
  const decision:LeadDecision=strongIntent&&hasFit?(unknowns.length?"NEEDS_VERIFICATION":"QUALIFIED"):(hasFit||problemHits.length?"RESEARCH_SEED":"REJECT");
  return {key:leadKey(profile.id,signal.source,signal.url),customerProfileId:profile.id,title:signal.title,url:signal.url,source:signal.source,...(signal.company?{company:signal.company}:{}),...(signal.person?{person:signal.person}:{}),observedAt:signal.observedAt,evidenceKind:signal.evidenceKind,fitReasons,intentReasons,unknowns,decision};
}
