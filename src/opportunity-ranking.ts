export interface RankingInput {
  candidateId: string;
  expectedNetUsd: number;
  manualHours: number;
  automationLeverage: number;
  expectedDaysToPayment: number;
  competitionCount: number;
  uncertainty: number;
}

export interface RankedOpportunity extends RankingInput {
  score: number;
  netPerManualHour: number;
}

function finiteNonNegative(value:number):boolean {
  return Number.isFinite(value) && value >= 0;
}

function bounded01(value:number):boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export function rankOpportunity(input:RankingInput):RankedOpportunity {
  if (!finiteNonNegative(input.expectedNetUsd) || !finiteNonNegative(input.manualHours) ||
      !bounded01(input.automationLeverage) || !finiteNonNegative(input.expectedDaysToPayment) ||
      !finiteNonNegative(input.competitionCount) || !bounded01(input.uncertainty)) {
    throw new Error("Invalid ranking input");
  }

  const effectiveManualHours=Math.max(input.manualHours,0.25);
  const netPerManualHour=input.expectedNetUsd/effectiveManualHours;
  const speedFactor=1/(1+(input.expectedDaysToPayment/14));
  const competitionFactor=1/(1+(input.competitionCount/10));
  const certaintyFactor=1-input.uncertainty;
  const leverageFactor=0.5+(0.5*input.automationLeverage);
  const score=netPerManualHour*speedFactor*competitionFactor*certaintyFactor*leverageFactor;

  return {...input,score,netPerManualHour};
}

export function rankOpportunities(inputs:RankingInput[]):RankedOpportunity[] {
  return inputs.map(rankOpportunity).sort((a,b)=>b.score-a.score || b.expectedNetUsd-a.expectedNetUsd || a.candidateId.localeCompare(b.candidateId));
}
