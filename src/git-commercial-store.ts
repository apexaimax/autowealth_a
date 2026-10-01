import type { CommercialEvent } from "./commercial-events.js";
import { createCommercialEvent } from "./commercial-events.js";
import type { CommitResult, DurableEventStore, EventStoreView } from "./commercial-persistence.js";

export interface GitStateTransport {
  read():Promise<EventStoreView>;
  commit(expectedVersion:string,events:readonly CommercialEvent[]):Promise<CommitResult>;
}

export class GitCommercialEventStore implements DurableEventStore {
  constructor(private readonly transport:GitStateTransport){}
  read():Promise<EventStoreView>{ return this.transport.read(); }
  commit(expectedVersion:string,events:readonly CommercialEvent[]):Promise<CommitResult>{
    return this.transport.commit(expectedVersion,events);
  }
}

interface GitHubTransportConfig {
  owner:string;
  repo:string;
  branch:string;
  token:string;
  eventPrefix?:string;
  fetchImpl?:typeof fetch;
}

interface RefResponse { object:{sha:string}; }
interface CommitResponse { sha:string; tree:{sha:string}; }
interface TreeEntry { path?:string;type?:string;sha?:string; }
interface TreeResponse { sha:string; tree:TreeEntry[]; truncated?:boolean; }
interface BlobResponse { content:string; encoding:string; }
interface ShaResponse { sha:string; }

export class GitHubStateBranchTransport implements GitStateTransport {
  private readonly fetchImpl:typeof fetch;
  private readonly prefix:string;
  constructor(private readonly config:GitHubTransportConfig){
    if(!config.owner.trim() || !config.repo.trim() || !config.branch.trim() || !config.token.trim()) throw new Error("INVALID_GITHUB_STATE_CONFIG");
    this.fetchImpl=config.fetchImpl??fetch;
    this.prefix=(config.eventPrefix??"commercial-events").replace(/^\/+|\/+$/g,"");
  }

  private async request<T>(path:string,init:RequestInit={}):Promise<T>{
    const response=await this.fetchImpl(`https://api.github.com/repos/${this.config.owner}/${this.config.repo}${path}`,{
      ...init,
      headers:{
        "Accept":"application/vnd.github+json",
        "X-GitHub-Api-Version":"2022-11-28",
        "Authorization":"Bearer "+this.config.token,
        "User-Agent":"revenue-automaton",
        ...(init.headers??{})
      }
    });
    if(!response.ok){
      const text=await response.text();
      const error=new Error(`GITHUB_STATE_HTTP_${response.status}:${text.slice(0,200)}`) as Error & {status?:number};
      error.status=response.status;
      throw error;
    }
    return await response.json() as T;
  }

  private async head():Promise<string>{
    const ref=await this.request<RefResponse>(`/git/ref/heads/${encodeURIComponent(this.config.branch)}`);
    return ref.object.sha;
  }

  private async treeForCommit(commitSha:string):Promise<TreeResponse>{
    const commit=await this.request<CommitResponse>(`/git/commits/${commitSha}`);
    const tree=await this.request<TreeResponse>(`/git/trees/${commit.tree.sha}?recursive=1`);
    if(tree.truncated) throw new Error("STATE_TREE_TRUNCATED");
    return tree;
  }

  private async readEvent(entry:TreeEntry):Promise<CommercialEvent>{
    if(!entry.sha) throw new Error("CORRUPT_EVENT_ENTRY");
    const blob=await this.request<BlobResponse>(`/git/blobs/${entry.sha}`);
    if(blob.encoding!=="base64") throw new Error("UNSUPPORTED_EVENT_ENCODING");
    const parsed=JSON.parse(Buffer.from(blob.content.replace(/\n/g,""),"base64").toString("utf8")) as CommercialEvent;
    const rebuilt=createCommercialEvent({
      kind:parsed.kind,subjectId:parsed.subjectId,logicalKey:parsed.logicalKey,payload:parsed.payload,occurredAt:parsed.occurredAt
    });
    if(rebuilt.id!==parsed.id) throw new Error("CORRUPT_EVENT_DIGEST");
    return parsed;
  }

  async read():Promise<EventStoreView>{
    const version=await this.head();
    const tree=await this.treeForCommit(version);
    const entries=tree.tree
      .filter(entry=>entry.type==="blob" && entry.path?.startsWith(this.prefix+"/") && entry.path.endsWith(".json"))
      .sort((a,b)=>(a.path??"").localeCompare(b.path??""));
    const events:CommercialEvent[]=[];
    for(const entry of entries) events.push(await this.readEvent(entry));
    return {version,events};
  }

  async commit(expectedVersion:string,events:readonly CommercialEvent[]):Promise<CommitResult>{
    const current=await this.read();
    if(current.version!==expectedVersion) return {status:"STALE",version:current.version};
    const existing=new Set(current.events.map(event=>event.id));
    const additions=events.filter(event=>!existing.has(event.id));
    if(additions.length===0) return {status:"COMMITTED",version:current.version};

    const baseTree=await this.treeForCommit(expectedVersion);
    const treeElements:{path:string;mode:string;type:string;sha:string}[]=[];
    for(const event of additions){
      const blob=await this.request<ShaResponse>("/git/blobs",{
        method:"POST",
        body:JSON.stringify({content:JSON.stringify(event),encoding:"utf-8"})
      });
      treeElements.push({path:`${this.prefix}/${event.id}.json`,mode:"100644",type:"blob",sha:blob.sha});
    }
    const tree=await this.request<ShaResponse>("/git/trees",{
      method:"POST",
      body:JSON.stringify({base_tree:baseTree.sha,tree:treeElements})
    });
    const commit=await this.request<ShaResponse>("/git/commits",{
      method:"POST",
      body:JSON.stringify({
        message:`commercial state: append ${additions.length} event${additions.length===1?"":"s"}`,
        tree:tree.sha,
        parents:[expectedVersion]
      })
    });
    try{
      await this.request<RefResponse>(`/git/refs/heads/${encodeURIComponent(this.config.branch)}`,{
        method:"PATCH",
        body:JSON.stringify({sha:commit.sha,force:false})
      });
      return {status:"COMMITTED",version:commit.sha};
    }catch(error){
      const status=(error as Error & {status?:number}).status;
      if(status===409 || status===422){
        const latest=await this.head();
        return {status:"STALE",version:latest};
      }
      throw error;
    }
  }
}
