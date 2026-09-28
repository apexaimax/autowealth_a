import type { RawOpportunity } from "./collector.js";

export interface VerificationEvidence {
  field: "requiresUpfrontSpend" | "paymentVerifiable";
  value: boolean;
  reference: string;
  observedAt: string;
  basis: string;
}

export interface VerificationResolution {
  resolved: RawOpportunity;
  evidence: VerificationEvidence[];
}

const UPFRONT_REQUIRED=[
  /\b(?:entry|registration|application|submission|claim|platform) fee\b/i,
  /\b(?:deposit|stake|bond|collateral)\b/i,
  /\bpay\b.{0,30}\b(?:to enter|to apply|to claim|before starting)\b/i
];
const EXPLICIT_NO_UPFRONT=[
  /\bno (?:entry|registration|application|submission|platform) fee\b/i,
  /\bfree to (?:enter|apply|participate|submit|claim)\b/i,
  /\bno (?:deposit|stake|bond|collateral) required\b/i
];
const VERIFIABLE_PAYMENT=[
  /\bescrow(?:ed)?\b/i,
  /\bpayment (?:is |will be )?(?:released|paid|sent)\b/i,
  /\bpaid (?:on|upon|after) (?:acceptance|approval|completion|merge)\b/i,
  /\bbounty (?:is )?(?:funded|escrowed)\b/i
];

function any(patterns:RegExp[],text:string){return patterns.some(p=>p.test(text));}

export function resolveAuthoritativeText(raw:RawOpportunity,text:string,reference=raw.url):VerificationResolution {
  if(raw.sourceKind!=="authoritative") return {resolved:raw,evidence:[]};
  const evidence:VerificationEvidence[]=[];
  let requiresUpfrontSpend=raw.requiresUpfrontSpend;
  let paymentVerifiable=raw.paymentVerifiable;

  if(requiresUpfrontSpend==="UNKNOWN"){
    if(any(UPFRONT_REQUIRED,text)){
      requiresUpfrontSpend=true;
      evidence.push({field:"requiresUpfrontSpend",value:true,reference,observedAt:raw.observedAt,basis:"authoritative text states a fee, deposit, stake, bond, collateral, or pre-start payment"});
    } else if(any(EXPLICIT_NO_UPFRONT,text)){
      requiresUpfrontSpend=false;
      evidence.push({field:"requiresUpfrontSpend",value:false,reference,observedAt:raw.observedAt,basis:"authoritative text explicitly states no upfront charge"});
    }
  }

  if(paymentVerifiable==="UNKNOWN" && any(VERIFIABLE_PAYMENT,text)){
    paymentVerifiable=true;
    evidence.push({field:"paymentVerifiable",value:true,reference,observedAt:raw.observedAt,basis:"authoritative text describes escrow/funding or a concrete payment trigger"});
  }

  return {resolved:{...raw,requiresUpfrontSpend,paymentVerifiable},evidence};
}
