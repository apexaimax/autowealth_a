import { digest } from "./revenue-ledger.js";

export interface CommercialProposalInput {
  candidateId:string;
  recipient:string;
  contactRoute:string;
  subject:string;
  body:string;
  links:string[];
  attachments:string[];
  capabilityEvidenceReferences:string[];
}
export interface CommercialProposal extends CommercialProposalInput { digest:string; }

export interface CommercialApproval {
  proposalDigest:string;
  approver:string;
  approvedAt:string;
}

function boundPayload(p:CommercialProposalInput){
  return {
    candidateId:p.candidateId,
    recipient:p.recipient,
    contactRoute:p.contactRoute,
    subject:p.subject,
    body:p.body,
    links:[...p.links],
    attachments:[...p.attachments],
    capabilityEvidenceReferences:[...p.capabilityEvidenceReferences]
  };
}

export function proposalDigest(p:CommercialProposalInput):string {
  return digest(boundPayload(p));
}

export function createProposal(input:CommercialProposalInput):CommercialProposal {
  if(!input.candidateId.trim() || !input.recipient.trim() || !input.contactRoute.trim() || !input.subject.trim() || !input.body.trim()) {
    throw new Error("INVALID_PROPOSAL");
  }
  const payload=boundPayload(input);
  return {...payload,digest:proposalDigest(payload)};
}

export function approveProposal(proposal:CommercialProposal, approval:{approver:string;approvedAt:string}):CommercialApproval {
  if(!approval.approver.trim() || !approval.approvedAt.trim()) throw new Error("INVALID_APPROVAL");
  if(proposal.digest!==proposalDigest(proposal)) throw new Error("STALE_PROPOSAL_DIGEST");
  return {proposalDigest:proposal.digest,approver:approval.approver,approvedAt:approval.approvedAt};
}

export function approvalMatchesProposal(approval:CommercialApproval,proposal:CommercialProposalInput):boolean {
  return approval.proposalDigest===proposalDigest(proposal);
}
