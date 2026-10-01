import type { CommercialEvent } from "./commercial-events.js";

export interface CommercialFunnel {
  qualifiedCandidates:number;
  proposalsPrepared:number;
  proposalsApproved:number;
  externallySent:number;
  humanResponses:number;
  qualifiedResponses:number;
  demosOrEvaluations:number;
  pilots:number;
  licensesOrContracts:number;
  verifiedPayments:number;
  realizedNetPnlUsd:number;
}

function count(events:readonly CommercialEvent[],kind:CommercialEvent["kind"]):number {
  return events.filter(event=>event.kind===kind).length;
}

export function projectCommercialFunnel(events:readonly CommercialEvent[]):CommercialFunnel {
  const responseEvents=events.filter(event=>event.kind==="RESPONSE_RECORDED");
  const responseKinds=responseEvents.map(event=>String(event.payload.kind??""));
  return {
    qualifiedCandidates:count(events,"CANDIDATE_QUALIFIED"),
    proposalsPrepared:count(events,"PROPOSAL_PREPARED"),
    proposalsApproved:count(events,"PROPOSAL_APPROVED"),
    externallySent:count(events,"OUTREACH_SENT"),
    humanResponses:responseKinds.filter(kind=>!["","NO_RESPONSE","AUTOMATED_RESPONSE"].includes(kind)).length,
    qualifiedResponses:responseKinds.filter(kind=>["DEMO_REQUEST","COMMERCIAL_INTEREST","PAID_EVALUATION_DISCUSSION","PILOT_DISCUSSION","LICENSING_DISCUSSION","CONTRACT_DISCUSSION"].includes(kind)).length,
    demosOrEvaluations:responseKinds.filter(kind=>["DEMO_REQUEST","PAID_EVALUATION_DISCUSSION"].includes(kind)).length,
    pilots:responseKinds.filter(kind=>kind==="PILOT_DISCUSSION").length,
    licensesOrContracts:responseKinds.filter(kind=>["LICENSING_DISCUSSION","CONTRACT_DISCUSSION"].includes(kind)).length,
    verifiedPayments:0,
    realizedNetPnlUsd:0
  };
}
