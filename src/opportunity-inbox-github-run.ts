import { updateInboxBranch } from "./opportunity-inbox-github.js";
const token=process.env.GITHUB_TOKEN??""; const repo=process.env.GITHUB_REPOSITORY??""; const [owner,name]=repo.split("/");
if(!token||!owner||!name)throw new Error("MISSING_INBOX_GITHUB_CONFIG");
await updateInboxBranch(process.argv[2]??"github-opportunities.json",{owner,repo:name,branch:process.env.OPPORTUNITY_INBOX_BRANCH??"opportunity-inbox",token});
