import { createHash } from "node:crypto";

export type TransportCapability="DRIVES"|"PUBLIC_TRANSIT"|"RIDESHARE"|"BIKE"|"WALK";
export type PersonDevice="PHONE"|"TABLET"|"DESKTOP"|"LAPTOP";
export type WorkGoalKind="LOCAL_WORK"|"REMOTE_WORK"|"CONTRACT"|"SERVICE_LEAD";
export type LearningLevel="BEGINNER"|"INTERMEDIATE"|"ADVANCED";
export type LearningMode="LEARN_ONLY"|"PAPER_PRACTICE"|"REAL_MONEY_LATER";

export interface WorkGoal {
  id:string;
  kind:WorkGoalKind;
  title:string;
  terms:string[];
}

export interface LearningGoal {
  id:string;
  topic:string;
  level:LearningLevel;
  mode:LearningMode;
}

export interface PersonProfileDraft {
  id:string;
  displayName?:string;
  homeRegion?:string;
  transport?:TransportCapability[];
  devices?:PersonDevice[];
  certifications?:string[];
  skills?:string[];
  availability?:string[];
  workGoals?:WorkGoal[];
  learningGoals?:LearningGoal[];
  answers?:Record<string,string|number|boolean|string[]>;
}

export interface IntakeQuestion {
  id:string;
  section:"BASICS"|"WORK"|"POOL"|"TRAVEL"|"PAY"|"LEARNING"|"TRADING";
  prompt:string;
  why:string;
}

export interface PersonSearchPlanItem {
  profileId:string;
  lane:"LOCAL_WORK"|"REMOTE_WORK"|"CONTRACT"|"SERVICE_LEAD"|"LEARNING";
  query:string;
}

const hasPoolGoal=(p:PersonProfileDraft)=>p.workGoals?.some(g=>/pool|winteri[sz]|closing/i.test([g.title,...g.terms].join(" ")))??false;
const hasTradingGoal=(p:PersonProfileDraft)=>p.learningGoals?.some(g=>/day trad|intraday trad|stock trad/i.test(g.topic))??false;

const COMMON: readonly IntakeQuestion[]=[
  {id:"basics.location",section:"BASICS",prompt:"What town or ZIP should searches center on?",why:"Defines the real search radius instead of using a vague region."},
  {id:"work.goal-priority",section:"WORK",prompt:"Which matters most right now: full-time work, part-time work, seasonal work, contract jobs, or direct customers?",why:"Prevents unlike opportunity types from competing in one ranking."},
  {id:"work.availability",section:"WORK",prompt:"What days and hours are you actually available?",why:"Filters out unusable schedules."},
  {id:"work.start-date",section:"WORK",prompt:"How soon can you start?",why:"Seasonal work often has short hiring windows."},
  {id:"work.travel.radius",section:"TRAVEL",prompt:"How many miles or minutes are you willing to drive for work?",why:"Turns 'Central Jersey' into a usable geographic constraint."},
  {id:"work.pay.minimum",section:"PAY",prompt:"What is the minimum hourly rate or minimum job price worth pursuing?",why:"Stops low-value leads from wasting verification time."},
  {id:"work.pay.preference",section:"PAY",prompt:"Do you prefer hourly pay, per-job pay, contract pay, or any of those?",why:"Keeps employment and service leads distinct."},
  {id:"work.employment",section:"WORK",prompt:"Employee, independent contractor, self-employed side work, or any?",why:"Changes where and how the system searches."},
  {id:"work.background-years",section:"WORK",prompt:"How many years of relevant hands-on experience do you have?",why:"Lets the system match seniority instead of assuming it."},
  {id:"work.customer-facing",section:"WORK",prompt:"Are you comfortable working directly with homeowners or business customers?",why:"Many field-service roles require independent customer interaction."}
];

const POOL: readonly IntakeQuestion[]=[
  {id:"work.pool.certification",section:"POOL",prompt:"What exact pool certification do you hold, who issued it, and when does it expire?",why:"Current NJ postings distinguish CPO/state and manufacturer credentials."},
  {id:"work.pool.open-close-years",section:"POOL",prompt:"How many seasons have you personally opened and closed pools?",why:"Pool-closing work is a distinct seasonal skill."},
  {id:"work.pool.chemistry",section:"POOL",prompt:"Can you independently test and balance chlorine, pH, alkalinity and related water chemistry?",why:"Frequently required in pool technician listings."},
  {id:"work.pool.equipment",section:"POOL",prompt:"Which equipment can you diagnose or service: pumps, filters, heaters, salt systems, automation, dosing systems?",why:"Separates basic maintenance from higher-paid service work."},
  {id:"work.pool.brands",section:"POOL",prompt:"Which brands have you worked on—Jandy, Pentair, Hayward, or others?",why:"Some employers value manufacturer-specific experience."},
  {id:"work.pool.repairs",section:"POOL",prompt:"Can you troubleshoot electrical, plumbing or equipment failures, and at what level?",why:"Technical repair ability materially changes role fit and pay."},
  {id:"work.pool.cover-types",section:"POOL",prompt:"What closing work have you done with safety/mesh covers, attached spas, autofill systems or complex equipment pads?",why:"Closing scope varies substantially by pool setup."},
  {id:"work.pool.weekends",section:"POOL",prompt:"Can you work Saturdays or overtime during peak closing season?",why:"Current pool-service listings often require busy-season flexibility."},
  {id:"work.pool.lifting",section:"POOL",prompt:"Are you able to safely handle the lifting and outdoor physical work typical of pool service? If you have limits, what are they?",why:"Listings commonly state lifting and outdoor-work requirements; this should be answered by the person, not inferred."},
  {id:"work.pool.vehicle",section:"POOL",prompt:"Do you have a valid driver's license and reliable vehicle, and can you carry tools or supplies?",why:"Local field-service work often depends on driving."},
  {id:"work.pool.tools",section:"POOL",prompt:"Do you own any pool-service tools, pumps, blowers, testing kits or winterization equipment?",why:"Independent jobs may require personal equipment while employee roles may supply it."},
  {id:"work.pool.insurance",section:"POOL",prompt:"For direct customer work, do you have business insurance or would you only take employee/contractor work under someone else's coverage?",why:"Prevents the system from treating a direct customer lead as executable when business prerequisites are missing."}
];

const TRADING: readonly IntakeQuestion[]=[
  {id:"learn.trading.experience",section:"TRADING",prompt:"What do you already know about stocks, orders, charts and risk management?",why:"Sets the starting level instead of assuming beginner knowledge."},
  {id:"learn.trading.goal",section:"TRADING",prompt:"Is the goal to understand day trading, learn active investing, paper trade, or eventually trade real money?",why:"Learning and real-money execution need different safeguards."},
  {id:"learn.trading.account-type",section:"TRADING",prompt:"Do you currently have no brokerage account, a cash account, or a margin account?",why:"Rules and practical constraints differ by account type."},
  {id:"learn.trading.broker",section:"TRADING",prompt:"Which brokerage, if any, would you use?",why:"Broker implementation matters because current intraday-margin rules are in transition."},
  {id:"learn.trading.paper-first",section:"TRADING",prompt:"Are you willing to learn and practice with paper trading before using real money?",why:"Lets the learning track build skills without treating trading as guaranteed income."},
  {id:"learn.trading.risk-capital",section:"TRADING",prompt:"If real-money trading is ever considered, would it use only money that can be lost without affecting bills, debt payments, emergency savings or retirement?",why:"Day trading can result in substantial losses and should not be framed as dependable income."},
  {id:"learn.trading.time",section:"TRADING",prompt:"How much time per day or week can you devote to learning and practice?",why:"Determines lesson size and whether intraday practice is realistic."},
  {id:"learn.trading.market",section:"TRADING",prompt:"What interests you most: stocks, ETFs, options, futures, forex, or just learning market basics first?",why:"Prevents a generic curriculum from jumping into the wrong product."}
];

export function buildPersonIntake(profile:PersonProfileDraft):IntakeQuestion[]{
  const answered=new Set(Object.keys(profile.answers??{}));
  const questions=[...COMMON,...(hasPoolGoal(profile)?POOL:[]),...(hasTradingGoal(profile)?TRADING:[])];
  return questions.filter(q=>!answered.has(q.id));
}

export function profileResultKey(profileId:string,resultId:string):string {
  return createHash("sha256").update(profileId.trim().toLowerCase()+"\0"+resultId).digest("hex");
}

function unique(values:string[]):string[]{return [...new Set(values.map(x=>x.trim()).filter(Boolean))];}

export function buildSearchPlan(profile:PersonProfileDraft):PersonSearchPlanItem[]{
  const out:PersonSearchPlanItem[]=[];
  const region=profile.homeRegion?.trim();
  for(const goal of profile.workGoals??[]){
    const terms=unique([goal.title,...goal.terms]);
    for(const term of terms){
      out.push({profileId:profile.id,lane:goal.kind,query:[term,region].filter(Boolean).join(" ")});
    }
    if(hasPoolGoal(profile)){
      for(const term of ["pool closing technician","pool winterization technician","seasonal pool service technician","certified pool operator","pool opening closing service"]){
        out.push({profileId:profile.id,lane:goal.kind,query:[term,region].filter(Boolean).join(" ")});
      }
    }
  }
  for(const goal of profile.learningGoals??[]){
    if(/day trad|intraday trad|stock trad/i.test(goal.topic)){
      for(const term of ["day trading basics risk management","paper trading beginner","broker intraday margin rules","order types bid ask spread"]){
        out.push({profileId:profile.id,lane:"LEARNING",query:term});
      }
    }else{
      out.push({profileId:profile.id,lane:"LEARNING",query:"learn "+goal.topic+" "+goal.level.toLowerCase()});
    }
  }
  return [...new Map(out.map(x=>[x.lane+"\0"+x.query.toLowerCase(),x])).values()];
}
