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

export function createCommercialEvent(input:CommercialEventInput):CommercialEvent {
  if(!input.subjectId.trim() || !input.logicalKey.trim() || !input.occurredAt.trim()) throw new Error("INVALID_COMMERCIAL_EVENT");
  const id=digest({kind:input.kind,subjectId:input.subjectId,logicalKey:input.logicalKey,payload:input.payload});
  return {...input,payload:{...input.payload},id};
}

export function appendCommercialEvent(events:readonly CommercialEvent[],event:CommercialEvent):CommercialEvent[] {
  if(events.some(existing=>existing.id===event.id)) return [...events];
  return [...events,event];
}
