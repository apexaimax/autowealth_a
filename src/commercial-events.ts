import { digest } from "./revenue-ledger.js";

export type CommercialEventKind =
  | "CANDIDATE_QUALIFIED" | "PROPOSAL_PREPARED" | "PROPOSAL_APPROVED"
  | "OUTREACH_SENT" | "RESPONSE_RECORDED" | "PAYMENT_CLAIMED"
  | "EXTERNAL_OUTCOME_UNKNOWN" | "HISTORICAL_OUTREACH_IMPORTED";

export interface CommercialEventInput {
  kind:CommercialEventKind;
  subjectId:string;
  logicalKey:string;
  payload:Record<string,unknown>;
  occurredAt:string;
}

export interface CommercialEvent extends CommercialEventInput { id:string; }

export function validateCommercialEvent(event:CommercialEvent):void {
  const expected=digest({kind:event.kind,subjectId:event.subjectId,logicalKey:event.logicalKey,payload:event.payload});
  if(expected!==event.id) throw new Error("CORRUPT_EVENT_DIGEST");
}

export function createCommercialEvent(input:CommercialEventInput):CommercialEvent {
  if(!input.subjectId.trim() || !input.logicalKey.trim() || !input.occurredAt.trim()) throw new Error("INVALID_COMMERCIAL_EVENT");
  const id=digest({kind:input.kind,subjectId:input.subjectId,logicalKey:input.logicalKey,payload:input.payload});
  return {...input,payload:{...input.payload},id};
}

function payloadString(event:CommercialEvent,key:string):string {
  const value=event.payload[key];
  return typeof value==="string"?value:"";
}

function hasExact(events:readonly CommercialEvent[],kind:CommercialEventKind,subjectId:string,proposalDigest:string):boolean {
  return events.some(existing=>
    existing.kind===kind &&
    existing.subjectId===subjectId &&
    payloadString(existing,"proposalDigest")===proposalDigest
  );
}

export function appendCommercialEvent(events:readonly CommercialEvent[],event:CommercialEvent):CommercialEvent[] {
  validateCommercialEvent(event);
  if(events.some(existing=>existing.id===event.id)) return [...events];

  if(event.kind==="PROPOSAL_APPROVED"){
    const proposalDigest=payloadString(event,"proposalDigest");
    if(!proposalDigest || !hasExact(events,"PROPOSAL_PREPARED",event.subjectId,proposalDigest)){
      throw new Error("APPROVAL_REQUIRES_PREPARED_PROPOSAL");
    }
  }

  if(event.kind==="OUTREACH_SENT"){
    const proposalDigest=payloadString(event,"proposalDigest");
    const externalReference=payloadString(event,"externalReference");
    if(!proposalDigest || !externalReference || !hasExact(events,"PROPOSAL_APPROVED",event.subjectId,proposalDigest)){
      throw new Error("OUTREACH_REQUIRES_EXACT_APPROVAL");
    }
  }

  return [...events,event];
}
