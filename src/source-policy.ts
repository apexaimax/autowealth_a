export interface OpportunitySource { id:string; name:string; url:string; requiresUpfrontCapital:boolean; paymentModel:"escrow"|"postpay"|"unknown"; feeRatio:number; }
export interface CapitalState { realizedAvailableUsd:number; }
export function sourceEligible(source:OpportunitySource, capital:CapitalState):boolean {
 if (capital.realizedAvailableUsd <= 0 && source.requiresUpfrontCapital) return false;
 return source.feeRatio >= 0 && source.feeRatio <= 1;
}
export const bootstrapSources:OpportunitySource[]=[
 {id:"basedagents",name:"BasedAgents",url:"https://basedagents.ai",requiresUpfrontCapital:false,paymentModel:"escrow",feeRatio:0},
 {id:"agentpay",name:"AgentPay",url:"https://github.com/ndsgbm-web/agentpay",requiresUpfrontCapital:true,paymentModel:"escrow",feeRatio:0}
];
