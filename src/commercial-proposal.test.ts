import test from "node:test";
import assert from "node:assert/strict";
import { createProposal, approveProposal, approvalMatchesProposal } from "./commercial-proposal.js";

function proposal(){
  return createProposal({
    candidateId:"cand-1",recipient:"buyer@example.com",contactRoute:"email:buyer@example.com",
    subject:"Technical evaluation",body:"Exact body",links:["https://example.test/evidence"],
    attachments:["report.txt"],capabilityEvidenceReferences:["cap:1"]
  });
}

test("proposal identity is deterministic",()=>{
  assert.equal(proposal().digest,proposal().digest);
});

test("approval binds every material proposal field",()=>{
  const p=proposal();
  const approval=approveProposal(p,{approver:"Anthony",approvedAt:"2026-10-01T00:00:00Z"});
  const mutations=[
    {...p,recipient:"other@example.com"},
    {...p,contactRoute:"email:other@example.com"},
    {...p,subject:"Changed"},
    {...p,body:"Changed body"},
    {...p,links:[...p.links,"https://example.test/new"]},
    {...p,attachments:[...p.attachments,"extra.pdf"]}
  ];
  for(const changed of mutations) assert.equal(approvalMatchesProposal(approval,changed),false);
  assert.equal(approvalMatchesProposal(approval,p),true);
});
