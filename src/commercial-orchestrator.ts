import type { CapabilityEvidence } from "./capability-evidence.js";
import type { CommercialCandidate } from "./commercial-candidate.js";
import { evaluateCommercialFit, type ExternalProblemEvidenceStrength, type CommercialFitDecision } from "./commercial-fit.js";
import { createProposal, type CommercialProposal } from "./commercial-proposal.js";

export type ProposalBlocker =
  | "FIT_NOT_QUALIFIED"
  | "MISSING_VERIFIED_CONTACT"
  | "MISSING_PROPOSAL_CONTENT"
  | "CONTACT_ROUTE_MISMATCH";

export interface ProposalDraft {
  recipient:string;
  contactRoute:string;
  subject:string;
  body:string;
  links:string[];
  attachments:string[];
}

export interface PrepareCommercialPackageInput {
  candidate:CommercialCandidate;
  capability:CapabilityEvidence;
  externalProblemEvidence:ExternalProblemEvidenceStrength;
  commercialModelPlausible:boolean;
  authoritativeContradiction:boolean;
  proposal?:ProposalDraft;
}

export interface CommercialPackage {
  candidate:CommercialCandidate;
  fit:CommercialFitDecision;
  proposal?:CommercialProposal;
  proposalBlockers:ProposalBlocker[];
}

export function prepareCommercialPackage(input:PrepareCommercialPackageInput):CommercialPackage {
  const fit=evaluateCommercialFit({
    candidate:input.candidate,
    capability:input.capability,
    externalProblemEvidence:input.externalProblemEvidence,
    commercialModelPlausible:input.commercialModelPlausible,
    authoritativeContradiction:input.authoritativeContradiction
  });
  const blockers:ProposalBlocker[]=[];
  if(fit.status!=="QUALIFIED") blockers.push("FIT_NOT_QUALIFIED");
  if(!input.candidate.contact) blockers.push("MISSING_VERIFIED_CONTACT");
  if(!input.proposal) blockers.push("MISSING_PROPOSAL_CONTENT");
  if(input.candidate.contact && input.proposal && input.candidate.contact.route!==input.proposal.contactRoute){
    blockers.push("CONTACT_ROUTE_MISMATCH");
  }

  if(blockers.length || !input.proposal){
    return {candidate:input.candidate,fit,proposalBlockers:blockers};
  }

  const refs=[...new Set([input.candidate.capabilityEvidenceId,...input.capability.evidenceReferences])];
  const proposal=createProposal({
    candidateId:input.candidate.id,
    recipient:input.proposal.recipient,
    contactRoute:input.proposal.contactRoute,
    subject:input.proposal.subject,
    body:input.proposal.body,
    links:[...input.proposal.links],
    attachments:[...input.proposal.attachments],
    capabilityEvidenceReferences:refs
  });
  return {candidate:input.candidate,fit,proposal,proposalBlockers:[]};
}
