const COMMERCIAL_REQUEST=/\b(?:need help|looking for|seeking|contractor|consultant|freelancer|freelance|paid|bounty|hire|hiring|vendor|rfp|request for proposal|requesting assistance|pilot partner|implementation partner)\b/i;
export function isCommercialServiceSignal(title:string,body=""):boolean{return COMMERCIAL_REQUEST.test(title+"\n"+body);}
