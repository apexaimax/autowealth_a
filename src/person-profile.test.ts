import test from "node:test";
import assert from "node:assert/strict";
import { buildPersonIntake, buildSearchPlan, profileResultKey, type PersonProfileDraft } from "./person-profile.js";

const poolDraft:PersonProfileDraft={
  id:"test",
  displayName:"Test",
  homeRegion:"Central New Jersey",
  transport:["DRIVES"],
  devices:["PHONE","DESKTOP"],
  certifications:["Certified Pool Technician"],
  workGoals:[{id:"pool-winter",kind:"LOCAL_WORK",title:"Pool closing and winterization work",terms:["pool closing","winterization","pool service technician"]}],
  learningGoals:[{id:"day-trading",topic:"day trading",level:"BEGINNER",mode:"LEARN_ONLY"}]
};

test("profiles stay isolated by profile id",()=>{
  assert.notEqual(profileResultKey("tony","lead-1"),profileResultKey("test","lead-1"));
});

test("pool technician intake asks domain-specific qualification questions",()=>{
  const questions=buildPersonIntake(poolDraft);
  const ids=new Set(questions.map(q=>q.id));
  for(const id of ["work.pool.open-close-years","work.pool.chemistry","work.pool.equipment","work.pool.brands","work.pool.weekends","work.pool.lifting","work.travel.radius","work.pay.minimum"]){
    assert.ok(ids.has(id),id);
  }
});

test("day trading learning goal asks account, experience, risk and paper-trading questions",()=>{
  const questions=buildPersonIntake(poolDraft);
  const ids=new Set(questions.map(q=>q.id));
  for(const id of ["learn.trading.experience","learn.trading.account-type","learn.trading.broker","learn.trading.paper-first","learn.trading.risk-capital"]){
    assert.ok(ids.has(id),id);
  }
});

test("search plan keeps local work and learning lanes separate",()=>{
  const plan=buildSearchPlan(poolDraft);
  assert.ok(plan.some(x=>x.lane==="LOCAL_WORK" && /pool closing/i.test(x.query)));
  assert.ok(plan.some(x=>x.lane==="LOCAL_WORK" && /winterization/i.test(x.query)));
  assert.ok(plan.some(x=>x.lane==="LEARNING" && /day trading/i.test(x.query)));
  assert.ok(plan.every(x=>x.profileId==="test"));
});
