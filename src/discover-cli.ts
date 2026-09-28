import { readFile } from "node:fs/promises";
import { orchestrateDiscovery, discoverySummary } from "./orchestrator.js";
import type { RawOpportunity } from "./collector.js";

async function main() {
  const path=process.argv[2];
  if (!path) throw new Error("Usage: npm run discover -- <raw-opportunities.json>");
  const parsed=JSON.parse(await readFile(path,"utf8")) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array of raw opportunities.");
  const batch=orchestrateDiscovery([parsed as RawOpportunity[]]);
  process.stdout.write(JSON.stringify({
    summary:discoverySummary(batch),
    readyForEconomics:batch.readyForEconomics,
    needsVerification:batch.needsVerification,
    rejected:batch.rejected
  },null,2)+"\n");
}
main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
