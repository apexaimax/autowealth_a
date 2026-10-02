export interface PublicRecordSource {
  id:string;
  name:string;
  authority:string;
  jurisdiction:string;
  recordTypes:string[];
  officialUrl:string;
}
export interface PublicRecordSignal {
  sourceId:string;
  recordId:string;
  recordType:string;
  officialUrl:string;
  subjectName?:string;
  organizationName?:string;
  jurisdiction:string;
  eventDate?:string;
  retrievedAt:string;
  facts:Record<string,string|number|boolean|null>;
}
export interface PublicRecordLeadEvidence {
  sourceId:string;recordId:string;officialUrl:string;recordType:string;retrievedAt:string;
  reason:string;buyerIntent:"UNKNOWN";contactability:"UNKNOWN";
}
export function publicRecordEvidence(signal:PublicRecordSignal,reason:string):PublicRecordLeadEvidence {
  if(!signal.sourceId||!signal.recordId||!signal.officialUrl||!signal.recordType||!signal.retrievedAt) throw new Error("PUBLIC_RECORD_PROVENANCE_REQUIRED");
  const u=new URL(signal.officialUrl);if(u.protocol!=="https:"&&u.protocol!=="http:")throw new Error("PUBLIC_RECORD_URL_INVALID");
  return {sourceId:signal.sourceId,recordId:signal.recordId,officialUrl:signal.officialUrl,recordType:signal.recordType,retrievedAt:signal.retrievedAt,reason,buyerIntent:"UNKNOWN",contactability:"UNKNOWN"};
}
