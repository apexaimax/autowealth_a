import test from "node:test";
import assert from "node:assert/strict";
import { mapPublicJson } from "./public-feed.js";

test("public feed mapping preserves authority and unknowns",()=>{
 const rows=mapPublicJson({id:"provider",endpoint:"https://provider.example/feed",authoritative:true,category:"research_study",defaultRewardType:"cash",participationMode:"HUMAN_REQUIRED"},[{id:1,title:"Study",url:"https://provider.example/1",rewardUsd:40,open:true}]);
 assert.equal(rows[0]?.provider,"provider");
 assert.equal(rows[0]?.authoritative,true);
 assert.equal(rows[0]?.rewardUsd,40);
 assert.equal(rows[0]?.eligible,undefined);
});
