import test from "node:test";
import assert from "node:assert/strict";
import { isCliEntryPoint, mapSearchIssue } from "./github-live.js";

test("maps GitHub search result without inventing payment verification",()=>{
 const mapped=mapSearchIssue({html_url:"https://github.com/a/b/issues/4",number:4,title:"$25 bounty",state:"open",locked:false,labels:[{name:"bounty"}],assignees:[],body:"Paid after acceptance",comments:3,repository_url:"https://api.github.com/repos/a/b"});
 assert.equal(mapped.repository,"a/b");
 assert.equal(mapped.number,4);
 assert.deepEqual(mapped.labels,["bounty"]);
 assert.equal(mapped.comments,3);
});

test("live discovery only runs when its module is the direct CLI entry point",()=>{
 assert.equal(isCliEntryPoint(import.meta.url,"/workspace/tests/github-live.test.js"),false);
 assert.equal(isCliEntryPoint("file:///workspace/src/github-live.js","/workspace/src/github-live.js"),true);
});
