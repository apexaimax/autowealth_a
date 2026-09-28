import test from "node:test";
import assert from "node:assert/strict";
import { rankOpportunities, rankOpportunity } from "./opportunity-ranking.js";

test("high net with low manual labor outranks low-paid manual work",()=>{
 const ranked=rankOpportunities([
  {candidateId:"voice",expectedNetUsd:18,manualHours:0.83,automationLeverage:0,expectedDaysToPayment:14,competitionCount:0,uncertainty:0.1},
  {candidateId:"audit",expectedNetUsd:180,manualHours:1,automationLeverage:0.9,expectedDaysToPayment:7,competitionCount:8,uncertainty:0.2}
 ]);
 assert.equal(ranked[0]?.candidateId,"audit");
});

test("ranking penalizes slow payment, competition and uncertainty",()=>{
 const base={expectedNetUsd:100,manualHours:1,automationLeverage:0.8};
 const ranked=rankOpportunities([
  {candidateId:"clean",...base,expectedDaysToPayment:2,competitionCount:1,uncertainty:0.1},
  {candidateId:"friction",...base,expectedDaysToPayment:30,competitionCount:50,uncertainty:0.7}
 ]);
 assert.equal(ranked[0]?.candidateId,"clean");
});

test("ranking rejects invalid or unbounded estimates",()=>{
 assert.throws(()=>rankOpportunity({candidateId:"bad",expectedNetUsd:10,manualHours:-1,automationLeverage:2,expectedDaysToPayment:1,competitionCount:0,uncertainty:0}));
});

test("ranking is deterministic",()=>{
 const input=[
  {candidateId:"b",expectedNetUsd:50,manualHours:1,automationLeverage:0.5,expectedDaysToPayment:7,competitionCount:2,uncertainty:0.2},
  {candidateId:"a",expectedNetUsd:50,manualHours:1,automationLeverage:0.5,expectedDaysToPayment:7,competitionCount:2,uncertainty:0.2}
 ];
 assert.deepEqual(rankOpportunities(input).map(x=>x.candidateId),["a","b"]);
});
