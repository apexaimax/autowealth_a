export interface CommercialRankingInput {
  candidateId:string;
  capabilityFit:number;
  capabilityEvidence:number;
  problemEvidence:number;
  buyerIntent:number;
  spendEvidence:number;
  contactability:number;
  implementationBurden:number;
  validationSpeed:number;
  licensingPotential:number;
  recurringPotential:number;
  competitionPenalty:number;
  uncertainty:number;
  zeroCostCompatible:boolean;
  profileCompatible:boolean;
}

export interface RankedCommercialFit extends CommercialRankingInput { score:number; }

function bounded(value:number):boolean { return Number.isFinite(value)&&value>=0&&value<=1; }

export function rankCommercialFits(inputs:readonly CommercialRankingInput[]):RankedCommercialFit[] {
  const valid=inputs.filter(input=>{
    const numeric=[
      input.capabilityFit,input.capabilityEvidence,input.problemEvidence,input.buyerIntent,
      input.spendEvidence,input.contactability,input.implementationBurden,input.validationSpeed,
      input.licensingPotential,input.recurringPotential,input.competitionPenalty,input.uncertainty
    ];
    if(!numeric.every(bounded)) throw new Error("INVALID_COMMERCIAL_RANKING_INPUT");
    return input.zeroCostCompatible&&input.profileCompatible;
  });
  return valid.map(input=>{
    const positive=
      input.capabilityFit*2 +
      input.capabilityEvidence*2 +
      input.problemEvidence*2 +
      input.buyerIntent +
      input.spendEvidence +
      input.contactability +
      input.validationSpeed +
      input.licensingPotential +
      input.recurringPotential;
    const penalty=input.implementationBurden+input.competitionPenalty+input.uncertainty*2;
    return {...input,score:positive-penalty};
  }).sort((a,b)=>b.score-a.score || a.candidateId.localeCompare(b.candidateId));
}
