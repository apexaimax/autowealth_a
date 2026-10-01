export type CommercialResponseKind =
  | "NO_RESPONSE" | "AUTOMATED_RESPONSE" | "WRONG_CONTACT" | "SUPPORT_CHANNEL_REJECTION"
  | "NOT_NOW" | "REJECTION" | "REFERRAL" | "TECHNICAL_QUESTION" | "DEMO_REQUEST"
  | "COMMERCIAL_INTEREST" | "PAID_EVALUATION_DISCUSSION" | "PILOT_DISCUSSION"
  | "LICENSING_DISCUSSION" | "CONTRACT_DISCUSSION" | "PAYMENT_RECEIVED";

export interface CommercialResponseInput { kind:CommercialResponseKind; evidenceReference:string; }
export interface CommercialResponseAssessment extends CommercialResponseInput {
  humanResponse:boolean;
  buyerIntentUpgrade:boolean;
  technicalEvaluation:boolean;
}

const HUMAN=new Set<CommercialResponseKind>([
  "WRONG_CONTACT","SUPPORT_CHANNEL_REJECTION","NOT_NOW","REJECTION","REFERRAL","TECHNICAL_QUESTION",
  "DEMO_REQUEST","COMMERCIAL_INTEREST","PAID_EVALUATION_DISCUSSION","PILOT_DISCUSSION",
  "LICENSING_DISCUSSION","CONTRACT_DISCUSSION","PAYMENT_RECEIVED"
]);
const INTENT=new Set<CommercialResponseKind>([
  "DEMO_REQUEST","COMMERCIAL_INTEREST","PAID_EVALUATION_DISCUSSION","PILOT_DISCUSSION",
  "LICENSING_DISCUSSION","CONTRACT_DISCUSSION"
]);
const TECHNICAL=new Set<CommercialResponseKind>(["TECHNICAL_QUESTION","DEMO_REQUEST","PAID_EVALUATION_DISCUSSION"]);

export function classifyCommercialResponse(input:CommercialResponseInput):CommercialResponseAssessment {
  if(!input.evidenceReference.trim()) throw new Error("MISSING_RESPONSE_EVIDENCE");
  return {
    ...input,
    humanResponse:HUMAN.has(input.kind),
    buyerIntentUpgrade:INTENT.has(input.kind),
    technicalEvaluation:TECHNICAL.has(input.kind)
  };
}

export function responseCreatesRealizedRevenue(_input:CommercialResponseInput):false {
  return false;
}
