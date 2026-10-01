import test from "node:test";
import assert from "node:assert/strict";
import { mapDemandObservation, mapSearchIssue } from "./github-live.js";

test("maps GitHub search result without inventing payment verification",()=>{
 const mapped=mapSearchIssue({html_url:"https://github.com/a/b/issues/4",number:4,title:"$25 bounty",state:"open",locked:false,labels:[{name:"bounty"}],assignees:[],body:"Paid after acceptance",comments:3,repository_url:"https://api.github.com/repos/a/b"});
 assert.equal(mapped.repository,"a/b");
 assert.equal(mapped.number,4);
 assert.deepEqual(mapped.labels,["bounty"]);
 assert.equal(mapped.comments,3);
});


test("maps widened search observations to explicit service and remote-work intents",()=>{
 const issue={html_url:"https://github.com/a/b/issues/8",number:8,title:"Need code review contractor",state:"open" as const,locked:false,labels:[],assignees:[],body:"Remote contract",comments:0,repository_url:"https://api.github.com/repos/a/b"};
 assert.equal(mapDemandObservation(issue,"2026-10-01T00:00:00Z","SERVICE_REQUEST").intent,"SERVICE_REQUEST");
 assert.equal(mapDemandObservation(issue,"2026-10-01T00:00:00Z","REMOTE_WORK").intent,"REMOTE_WORK");
});
