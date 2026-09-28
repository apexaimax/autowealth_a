import type { GateDecision, GatePolicy, Opportunity, PaymentOutcome, RealizedPnL } from "./domain.js";
const FUNDED_KINDS = new Set(["escrow","contract","posted_bounty","buyer_request"]);
export function evaluateOpportunity(opportunity:Opportunity, policy:GatePolicy):GateDecision {
 const reasons:GateDecision["reasons"]=[];
 const valid=Number.isFinite(opportunity.expectedRevenueUsd)&&Number.isFinite(opportunity.maxCostUsd)&&opportunity.expectedRevenueUsd>=0&&opportunity.maxCostUsd>=0;
 if(!valid) reasons.push("INVALID_FINANCIALS");
 if(!opportunity.executable) reasons.push("NOT_EXECUTABLE");
 const paymentEvidence=opportunity.evidence.filter(e=>FUNDED_KINDS.has(e.kind)&&Boolean(e.source));
 if(policy.requireFundedEvidence&&paymentEvidence.length===0) reasons.push("NO_PAYMENT_EVIDENCE");
 if(policy.requireFundedEvidence&&paymentEvidence.length>0&&!paymentEvidence.some(e=>e.verification?.status==="VERIFIED"&&Boolean(e.verification.reference))) reasons.push("PAYMENT_EVIDENCE_UNVERIFIED");
 const net=valid?opportunity.expectedRevenueUsd-opportunity.maxCostUsd:Number.NEGATIVE_INFINITY;
 const margin=valid&&opportunity.expectedRevenueUsd>0?net/opportunity.expectedRevenueUsd:0;
 if(valid&&net<policy.minimumNetUsd) reasons.push("NET_BELOW_MINIMUM");
 if(valid&&margin<policy.minimumMarginRatio) reasons.push("MARGIN_BELOW_MINIMUM");
 return {decision:reasons.length===0?"ALLOW":"DENY",opportunityId:opportunity.id,expectedNetUsd:net,expectedMarginRatio:margin,reasons};
}
export function realizePnL(outcome:PaymentOutcome):RealizedPnL {
 const paid=outcome.status==="PAID"&&outcome.paymentVerified===true&&outcome.grossRevenueUsd>0&&Boolean(outcome.paymentReference);
 const gross=paid?outcome.grossRevenueUsd:0;
 return {opportunityId:outcome.opportunityId,grossRevenueUsd:gross,actualCostUsd:outcome.actualCostUsd,netProfitUsd:gross-outcome.actualCostUsd,verifiedPaid:paid};
}
