import test from "node:test";
import assert from "node:assert/strict";
import { rankCommercialFits } from "./commercial-ranking.js";

test("commercial ranking uses evidence/fit without fabricating revenue",()=>{
 const ranked=rankCommercialFits([
  {candidateId:"weak",capabilityFit:0.6,capabilityEvidence:0.5,problemEvidence:0.5,buyerIntent:0,spendEvidence:0,contactability:0.5,implementationBurden:0.5,validationSpeed:0.5,licensingPotential:0.3,recurringPotential:0.3,competitionPenalty:0.5,uncertainty:0.8,zeroCostCompatible:true,profileCompatible:true},
  {candidateId:"strong",capabilityFit:0.9,capabilityEvidence:1,problemEvidence:1,buyerIntent:0.5,spendEvidence:0.5,contactability:1,implementationBurden:0.2,validationSpeed:0.9,licensingPotential:0.8,recurringPotential:0.8,competitionPenalty:0.2,uncertainty:0.2,zeroCostCompatible:true,profileCompatible:true}
 ]);
 assert.equal(ranked[0]?.candidateId,"strong");
 assert.equal("expectedRevenueUsd" in ranked[0]!,false);
});

test("incompatible or paid-upfront candidate is excluded",()=>{
 const ranked=rankCommercialFits([
  {candidateId:"paid",capabilityFit:1,capabilityEvidence:1,problemEvidence:1,buyerIntent:1,spendEvidence:1,contactability:1,implementationBurden:0,validationSpeed:1,licensingPotential:1,recurringPotential:1,competitionPenalty:0,uncertainty:0,zeroCostCompatible:false,profileCompatible:true},
  {candidateId:"device",capabilityFit:1,capabilityEvidence:1,problemEvidence:1,buyerIntent:1,spendEvidence:1,contactability:1,implementationBurden:0,validationSpeed:1,licensingPotential:1,recurringPotential:1,competitionPenalty:0,uncertainty:0,zeroCostCompatible:true,profileCompatible:false}
 ]);
 assert.equal(ranked.length,0);
});
