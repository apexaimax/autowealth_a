import type { CommercialEvent } from "./commercial-events.js";
import { appendCommercialEvent } from "./commercial-events.js";

export interface EventStoreView { version:string; events:CommercialEvent[]; }
export type CommitResult={status:"COMMITTED";version:string}|{status:"STALE";version:string};

export interface DurableEventStore {
  read():Promise<EventStoreView>;
  commit(expectedVersion:string,events:readonly CommercialEvent[]):Promise<CommitResult>;
}

export class InMemoryCasEventStore implements DurableEventStore {
  private version=0;
  private events:CommercialEvent[]=[];

  async read():Promise<EventStoreView> {
    return {version:String(this.version),events:[...this.events]};
  }

  async commit(expectedVersion:string,events:readonly CommercialEvent[]):Promise<CommitResult> {
    if(expectedVersion!==String(this.version)) return {status:"STALE",version:String(this.version)};
    for(const event of events) this.events=appendCommercialEvent(this.events,event);
    this.version+=1;
    return {status:"COMMITTED",version:String(this.version)};
  }
}
