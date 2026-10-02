import { qualifyLead,type CustomerLeadProfile,type QualifiedLead,type LeadSignal } from "./customer-leads.js";
import type { PublicRecordSignal } from "./public-records.js";

function factText(signal:PublicRecordSignal):string {
  return Object.values(signal.facts).filter(value=>value!==null).map(String).join(" ");
}

export function qualifyPublicRecordForCustomer(profile:CustomerLeadProfile,signal:PublicRecordSignal):QualifiedLead {
  const title=typeof signal.facts.title==="string" && signal.facts.title.trim()
    ? signal.facts.title
    : `${signal.recordType}: ${signal.organizationName??signal.subjectName??signal.recordId}`;
  const leadSignal:LeadSignal={
    source:`public-record:${signal.sourceId}`,
    url:signal.officialUrl,
    title,
    body:[factText(signal),signal.jurisdiction].filter(Boolean).join(" "),
    observedAt:signal.retrievedAt,
    evidenceKind:"RESEARCH",
    ...(signal.organizationName?{company:signal.organizationName}:{})
  };
  const lead=qualifyLead(profile,leadSignal);
  if(lead.decision==="RESEARCH_SEED"){
    lead.unknowns=[...new Set([...lead.unknowns,"BUYER_INTENT","CONTACTABILITY"])];
  }
  return lead;
}
