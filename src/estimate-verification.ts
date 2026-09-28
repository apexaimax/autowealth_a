import type { RankingInput } from "./opportunity-ranking.js";
import type { EvaluatedCandidate } from "./orchestrator.js";

export type EstimateField =
  | "expectedNetUsd" | "manualHours" | "automationLeverage"
  | "expectedDaysToPayment" | "competitionCount" | "uncertainty";

export type EstimateSourceKind = "AUTHORITATIVE" | "MEASURED" | "USER_PROVIDED" | "HISTORICAL";

export interface EstimateFact {
  field: EstimateField;
  value: number;
  sourceKind: EstimateSourceKind;
  reference: string;
  observedAt: string;
}

export interface EstimateResult {
  status: "READY" | "MISSING_FACTS" | "INVALID_FACTS";
  candidateId: string;
  missing: EstimateField[];
  invalid: EstimateField[];
  input?: RankingInput;
}

const fields:EstimateField[]=[
  "expectedNetUsd","manualHours","automationLeverage",
  "expectedDaysToPayment","competitionCount","uncertainty"
];

function valid(field:EstimateField,value:number):boolean {
  if(!Number.isFinite(value) || value < 0) return false;
  if(field==="automationLeverage" || field==="uncertainty") return value <= 1;
  return true;
}

export function buildRankingEstimate(candidate:EvaluatedCandidate,facts:EstimateFact[]):EstimateResult {
  if(candidate.decision.decision!=="PASS_TO_ECONOMICS"){
    return {status:"INVALID_FACTS",candidateId:candidate.candidate.id,missing:[],invalid:fields};
  }

  const accepted=new Map<EstimateField,EstimateFact>();
  const invalid:EstimateField[]=[];
  for(const fact of facts){
    if(!fact.reference.trim() || !fact.observedAt.trim() || !valid(fact.field,fact.value)){
      if(!invalid.includes(fact.field)) invalid.push(fact.field);
      continue;
    }
    accepted.set(fact.field,fact);
  }

  const missing=fields.filter(field=>!accepted.has(field));
  if(invalid.length) return {status:"INVALID_FACTS",candidateId:candidate.candidate.id,missing,invalid};
  if(missing.length) return {status:"MISSING_FACTS",candidateId:candidate.candidate.id,missing,invalid:[]};

  const value=(field:EstimateField)=>accepted.get(field)!.value;
  return {
    status:"READY",candidateId:candidate.candidate.id,missing:[],invalid:[],
    input:{
      candidateId:candidate.candidate.id,
      expectedNetUsd:value("expectedNetUsd"),
      manualHours:value("manualHours"),
      automationLeverage:value("automationLeverage"),
      expectedDaysToPayment:value("expectedDaysToPayment"),
      competitionCount:value("competitionCount"),
      uncertainty:value("uncertainty")
    }
  };
}
