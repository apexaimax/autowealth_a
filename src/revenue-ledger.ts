import { createHash } from "node:crypto";

export type TransactionState =
  | "DISCOVERED" | "APPROVED" | "AUTHORIZED" | "EXECUTED"
  | "PAYMENT_VERIFIED" | "SETTLED";

export interface RevenueTransaction {
  id:string;
  opportunityId:string;
  evidenceDigest:string;
  state:TransactionState;
  approvedDigest?:string;
  authorizationId?:string;
  executionReference?:string;
  paymentReference?:string;
  grossRevenueUsd?:number;
  actualCostUsd?:number;
  netProfitUsd?:number;
}

export interface Approval {
  transactionId:string;
  opportunityId:string;
  evidenceDigest:string;
  approvedAt:string;
  approver:string;
}

const canonical=(value:unknown):string=>{
  if(value===null || typeof value!=="object") return JSON.stringify(value);
  if(Array.isArray(value)) return "["+value.map(canonical).join(",")+"]";
  const object=value as Record<string,unknown>;
  return "{"+Object.keys(object).sort().map(k=>JSON.stringify(k)+":"+canonical(object[k])).join(",")+"}";
};
export const digest=(value:unknown)=>createHash("sha256").update(canonical(value)).digest("hex");

export class RevenueLedger {
  private transactions=new Map<string,RevenueTransaction>();
  private consumedAuthorizations=new Set<string>();

  discover(opportunityId:string,evidence:unknown):RevenueTransaction {
    const evidenceDigest=digest(evidence);
    const id=digest({opportunityId,evidenceDigest});
    const existing=this.transactions.get(id);
    if(existing) return {...existing};
    const tx:RevenueTransaction={id,opportunityId,evidenceDigest,state:"DISCOVERED"};
    this.transactions.set(id,tx);
    return {...tx};
  }

  approve(transactionId:string,approval:Approval):RevenueTransaction {
    const tx=this.require(transactionId,"DISCOVERED");
    if(approval.transactionId!==tx.id || approval.opportunityId!==tx.opportunityId ||
       approval.evidenceDigest!==tx.evidenceDigest || !approval.approvedAt.trim() || !approval.approver.trim())
      throw new Error("APPROVAL_BINDING_MISMATCH");
    tx.approvedDigest=digest(approval);
    tx.state="APPROVED";
    return {...tx};
  }

  authorize(transactionId:string,approval:Approval):RevenueTransaction {
    const tx=this.require(transactionId,"APPROVED");
    if(digest(approval)!==tx.approvedDigest) throw new Error("APPROVAL_BINDING_MISMATCH");
    const authorizationId=digest({transactionId,approvedDigest:tx.approvedDigest});
    if(this.consumedAuthorizations.has(authorizationId)) throw new Error("AUTHORIZATION_REPLAY");
    this.consumedAuthorizations.add(authorizationId);
    tx.authorizationId=authorizationId;
    tx.state="AUTHORIZED";
    return {...tx};
  }

  recordExecution(transactionId:string,authorizationId:string,reference:string):RevenueTransaction {
    const tx=this.require(transactionId,"AUTHORIZED");
    if(!reference.trim() || authorizationId!==tx.authorizationId) throw new Error("EXECUTION_NOT_AUTHORIZED");
    tx.executionReference=reference;
    tx.state="EXECUTED";
    return {...tx};
  }

  verifyPayment(transactionId:string,reference:string,grossRevenueUsd:number):RevenueTransaction {
    const tx=this.require(transactionId,"EXECUTED");
    if(!reference.trim() || !Number.isFinite(grossRevenueUsd) || grossRevenueUsd<0)
      throw new Error("INVALID_PAYMENT_PROOF");
    tx.paymentReference=reference;
    tx.grossRevenueUsd=grossRevenueUsd;
    tx.state="PAYMENT_VERIFIED";
    return {...tx};
  }

  settle(transactionId:string,actualCostUsd:number):RevenueTransaction {
    const tx=this.require(transactionId,"PAYMENT_VERIFIED");
    if(!Number.isFinite(actualCostUsd) || actualCostUsd<0) throw new Error("INVALID_COST");
    tx.actualCostUsd=actualCostUsd;
    tx.netProfitUsd=tx.grossRevenueUsd!-actualCostUsd;
    tx.state="SETTLED";
    return {...tx};
  }

  get(transactionId:string):RevenueTransaction|undefined {
    const tx=this.transactions.get(transactionId);
    return tx?{...tx}:undefined;
  }

  private require(id:string,state:TransactionState):RevenueTransaction {
    const tx=this.transactions.get(id);
    if(!tx) throw new Error("TRANSACTION_NOT_FOUND");
    if(tx.state!==state) throw new Error(`INVALID_TRANSITION:${tx.state}->${state}`);
    return tx;
  }
}
