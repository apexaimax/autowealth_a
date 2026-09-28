export type EvidenceKind = "escrow" | "contract" | "posted_bounty" | "buyer_request" | "market_demand";
export interface Evidence { id:string; kind:EvidenceKind; source:string; observedAt:string; amountUsd?:number; expiresAt?:string; verification?:{status:"UNVERIFIED"|"VERIFIED"; reference:string}; }
export interface Opportunity { id:string; title:string; source:string; expectedRevenueUsd:number; maxCostUsd:number; executable:boolean; evidence:Evidence[]; }
export interface GatePolicy { minimumNetUsd:number; minimumMarginRatio:number; requireFundedEvidence:boolean; }
export type GateReason = "NO_PAYMENT_EVIDENCE"|"PAYMENT_EVIDENCE_UNVERIFIED"|"NOT_EXECUTABLE"|"INVALID_FINANCIALS"|"NET_BELOW_MINIMUM"|"MARGIN_BELOW_MINIMUM";
export interface GateDecision { decision:"ALLOW"|"DENY"; opportunityId:string; expectedNetUsd:number; expectedMarginRatio:number; reasons:GateReason[]; }
export interface PaymentOutcome { opportunityId:string; status:"UNPAID"|"PAID"|"DISPUTED"; grossRevenueUsd:number; actualCostUsd:number; paymentReference?:string; paymentVerified?:boolean; }
export interface RealizedPnL { opportunityId:string; grossRevenueUsd:number; actualCostUsd:number; netProfitUsd:number; verifiedPaid:boolean; }
