import type { CustomerLeadProfile } from "./customer-leads.js";

function q(value:string):string { return `"${value.replaceAll('"',"")}"`; }
function unique(items:string[]):string[]{return [...new Set(items)];}

export interface CustomerLeadQueries {
  github:string[];
  web:string[];
}

export function buildCustomerLeadQueries(profile:CustomerLeadProfile):CustomerLeadQueries {
  const problems=profile.problemTerms.slice(0,4);
  const industries=profile.targetIndustries.slice(0,3);
  const roles=profile.targetRoles.slice(0,3);
  const solutions=profile.solutionTerms.slice(0,3);
  const github:string[]=[];
  for(const problem of problems){
    github.push(`is:issue is:open ${q(problem)} ("need help" OR "looking for" OR "seeking" OR "pilot")`);
    for(const industry of industries) github.push(`is:issue is:open ${q(problem)} ${q(industry)}`);
  }
  for(const solution of solutions) github.push(`is:issue is:open ${q(solution)} ("contract" OR "integration" OR "pilot")`);
  const web:string[]=[];
  for(const problem of problems){
    for(const industry of industries.length?industries:[""]) web.push([industry,problem,"need help OR seeking OR pilot OR contract"].filter(Boolean).join(" "));
    for(const role of roles) web.push([role,problem,"request OR contract OR vendor"].join(" "));
  }
  web.push([profile.offer,...profile.targetRegions.slice(0,2),"contract OR pilot OR vendor"].filter(Boolean).join(" "));
  return {github:unique(github),web:unique(web)};
}
