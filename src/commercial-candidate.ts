import { digest } from "./revenue-ledger.js";

export type BuyerIntentStatus="UNKNOWN"|"INFERRED"|"EXPLICIT";
export type PaymentPathStatus="UNKNOWN"|"INFERRED"|"VERIFIED";
export type CommercialModel="PAID_EVALUATION"|"PILOT"|"LICENSE"|"INTEGRATION"|"IMPLEMENTATION"|"PARTNERSHIP"|"ACQUISITION_DISCUSSION";
export type Potential="UNKNOWN"|"POSSIBLE"|"LIKELY";
export type ImplementationBurden="LOW"|"MEDIUM"|"HIGH";

export interface CommercialCandidateInput {
  organizationId:string;
  organization:string;
  projectId:string;
  capabilityId:string;
  problemIdentity:string;
  verifiedWorkflow:string;
  problemEvidenceIds:string[];
  capabilityEvidenceId:string;
  valueHypothesis:string;
  commercialModel:CommercialModel;
  expectedImplementationBurden:ImplementationBurden;
  recurringRevenuePotential:Potential;
  licensingPotential:Potential;
  discoverySource?:string;
}

export interface CommercialCandidate extends CommercialCandidateInput {
  id:string;
  buyerIntent:{status:BuyerIntentStatus;evidenceIds:string[]};
  paymentPath:{status:PaymentPathStatus;evidenceIds:string[]};
  contact?:{route:string;type:string;intendedRole:string;evidenceId:string};
  unknowns:string[];
  rejectionReasons:string[];
}

export interface BuyerIntentEvidence {
  evidenceId:string;
  status:Exclude<BuyerIntentStatus,"UNKNOWN">;
  authoritative:boolean;
}
export interface PaymentPathEvidence {
  evidenceId:string;
  status:Exclude<PaymentPathStatus,"UNKNOWN">;
  authoritative:boolean;
}
export interface VerifiedContactEvidence {
  route:string;
  type:string;
  intendedRole:string;
  evidenceId:string;
  publiclyVerified:boolean;
}

export function createCommercialCandidate(input:CommercialCandidateInput):CommercialCandidate {
  for(const value of [input.organizationId,input.organization,input.projectId,input.capabilityId,input.problemIdentity,input.verifiedWorkflow,input.capabilityEvidenceId,input.valueHypothesis]){
    if(!value.trim()) throw new Error("INVALID_COMMERCIAL_CANDIDATE");
  }
  const id=digest({
    organizationId:input.organizationId.trim().toLowerCase(),
    capabilityId:input.capabilityId.trim().toLowerCase(),
    problemIdentity:input.problemIdentity.trim().toLowerCase()
  });
  return {
    ...input,
    problemEvidenceIds:[...input.problemEvidenceIds],
    id,
    buyerIntent:{status:"UNKNOWN",evidenceIds:[]},
    paymentPath:{status:"UNKNOWN",evidenceIds:[]},
    unknowns:[],
    rejectionReasons:[]
  };
}

export function withBuyerIntentEvidence(candidate:CommercialCandidate,evidence:BuyerIntentEvidence):CommercialCandidate {
  if(!evidence.authoritative || !evidence.evidenceId.trim()) return {...candidate,buyerIntent:{...candidate.buyerIntent,evidenceIds:[...candidate.buyerIntent.evidenceIds]}};
  const order:BuyerIntentStatus[]=["UNKNOWN","INFERRED","EXPLICIT"];
  const status=order.indexOf(evidence.status)>order.indexOf(candidate.buyerIntent.status)?evidence.status:candidate.buyerIntent.status;
  return {...candidate,buyerIntent:{status,evidenceIds:[...new Set([...candidate.buyerIntent.evidenceIds,evidence.evidenceId])]}};
}

export function withPaymentPathEvidence(candidate:CommercialCandidate,evidence:PaymentPathEvidence):CommercialCandidate {
  if(!evidence.authoritative || !evidence.evidenceId.trim()) return {...candidate,paymentPath:{...candidate.paymentPath,evidenceIds:[...candidate.paymentPath.evidenceIds]}};
  const order:PaymentPathStatus[]=["UNKNOWN","INFERRED","VERIFIED"];
  const status=order.indexOf(evidence.status)>order.indexOf(candidate.paymentPath.status)?evidence.status:candidate.paymentPath.status;
  return {...candidate,paymentPath:{status,evidenceIds:[...new Set([...candidate.paymentPath.evidenceIds,evidence.evidenceId])]}};
}

export function withVerifiedContact(candidate:CommercialCandidate,evidence:VerifiedContactEvidence):CommercialCandidate {
  if(!evidence.publiclyVerified || !evidence.route.trim() || !evidence.evidenceId.trim()) return {...candidate};
  return {...candidate,contact:{route:evidence.route,type:evidence.type,intendedRole:evidence.intendedRole,evidenceId:evidence.evidenceId}};
}
