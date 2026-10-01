import { createCommercialEvent } from "./commercial-events.js";
import { GitCommercialEventStore, GitHubStateBranchTransport } from "./git-commercial-store.js";

function env(name:string):string {
  const value=process.env[name];
  if(!value?.trim()) throw new Error("Missing "+name);
  return value;
}

function store(){
  const [owner,repo]=env("GITHUB_REPOSITORY").split("/");
  if(!owner || !repo) throw new Error("Invalid GITHUB_REPOSITORY");
  const transport=new GitHubStateBranchTransport({
    owner,repo,branch:env("COMMERCIAL_STATE_BRANCH"),token:env("GITHUB_TOKEN")
  });
  return new GitCommercialEventStore(transport);
}

function proofEvent(suffix:string){
  const key=env("COMMERCIAL_PROOF_KEY")+":"+suffix;
  return createCommercialEvent({
    kind:"CANDIDATE_QUALIFIED",
    subjectId:"proof:"+key,
    logicalKey:"proof:"+key,
    payload:{proof:true},
    occurredAt:"2026-10-01T00:00:00Z"
  });
}

async function main(){
  const [command,arg1,arg2]=process.argv.slice(2);
  const s=store();
  if(command==="capture"){
    const view=await s.read();
    process.stdout.write(view.version+"\n");
    return;
  }
  if(command==="write"){
    if(!arg1) throw new Error("Missing proof suffix");
    const view=await s.read();
    const result=await s.commit(view.version,[proofEvent(arg1)]);
    if(result.status!=="COMMITTED") throw new Error("Proof write did not commit");
    process.stdout.write(result.version+"\n");
    return;
  }
  if(command==="read"){
    if(!arg1) throw new Error("Missing proof suffix");
    const target=proofEvent(arg1).subjectId;
    const view=await s.read();
    if(!view.events.some(event=>event.subjectId===target)) throw new Error("Cross-process reconstruction failed");
    process.stdout.write("FOUND "+target+"\n");
    return;
  }
  if(command==="expect-stale"){
    if(!arg1 || !arg2) throw new Error("Usage: expect-stale <version> <suffix>");
    const result=await s.commit(arg1,[proofEvent(arg2)]);
    if(result.status!=="STALE") throw new Error("Expected stale write rejection");
    process.stdout.write("STALE "+result.version+"\n");
    return;
  }
  throw new Error("Unknown proof command");
}

main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
