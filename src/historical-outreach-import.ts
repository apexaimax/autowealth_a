import { createCommercialEvent, appendCommercialEvent, type CommercialEvent } from "./commercial-events.js";
import type { CommercialResponseKind } from "./commercial-response.js";

export interface HistoricalOutreachRecord {
  sourceSystem:string;
  sourceRecordId:string;
  projectId:string;
  direction:"OUTBOUND"|"INBOUND";
  occurredAt:string;
  responseKind:CommercialResponseKind;
  candidateId?:string;
}

export function importHistoricalOutreach(records:readonly HistoricalOutreachRecord[]):CommercialEvent[] {
  let events:CommercialEvent[]=[];
  for(const record of records){
    if(!record.sourceSystem.trim() || !record.sourceRecordId.trim() || !record.projectId.trim() || !record.occurredAt.trim()) throw new Error("INVALID_HISTORICAL_OUTREACH");
    const event=createCommercialEvent({
      kind:"HISTORICAL_OUTREACH_IMPORTED",
      subjectId:record.candidateId??("project:"+record.projectId),
      logicalKey:record.sourceSystem+":"+record.sourceRecordId,
      payload:{
        provenance:"HISTORICAL_EXTERNAL",
        sourceSystem:record.sourceSystem,
        sourceRecordId:record.sourceRecordId,
        projectId:record.projectId,
        direction:record.direction,
        responseKind:record.responseKind
      },
      occurredAt:record.occurredAt
    });
    events=appendCommercialEvent(events,event);
  }
  return events;
}
