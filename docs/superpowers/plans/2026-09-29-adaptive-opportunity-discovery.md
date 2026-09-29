# Adaptive Opportunity Discovery Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Goal

Implement the approved design in independently testable stages: retain current paid-task discovery, add adaptive bounded query selection, add a separate private-profile remote-job stream, and generate evidence-gated opportunity hypotheses. Preserve every existing profitability, approval, execution, payment-verification, and revenue-ledger boundary.

## Architecture

Keep the current paid-task path and its candidate economics intact. Add shared deterministic query planning and aggregate yield metrics, then independent remote-job profile/source/policy/ranking/report modules and independent problem-signal/hypothesis modules. A new all-stream runner composes the outputs without merging their types or counts. GitHub Actions restores only recent schema-compatible metrics and authenticated encrypted job-filter state; invalid/missing state falls back to cold-start behavior and the confirmed baseline.

The first remote-job source is a candidate adapter for Jobicy's public no-key listing endpoint. Implement it only after confirming its current official terms, live response shape, bounded-query behavior, and retained source-credit/link requirements. Do not use Jobicy's optional commercial API. Leave the adapter disabled if any check fails. Further feeds or public pages are a later source-expansion task and require separate access and parser verification.

## Tech Stack

- TypeScript and the existing Node.js built-in test runner.
- Existing package scripts: `npm run build` and `npm test`.
- Node built-in crypto for authenticated encryption; no paid API or model.
- GitHub Actions artifacts for seven-day aggregate metrics and encrypted filter state.
- Existing source-adapter, discovery-policy, and provenance conventions.

## Spec

Approved design: [Adaptive Opportunity Discovery Design](../specs/2026-09-29-adaptive-opportunity-discovery-design.md).

## Global Constraints

- Keep personal job-profile values, filter diffs, and resume facts out of public source, artifacts, and logs. Only aggregate non-personal query metrics may be public.
- Protected job constraints never change automatically. Adjustable terms may change only from observed metrics; unknown preferences remain unknown.
- On absent or invalid private profile, skip remote-job search and report the missing profile. On invalid encrypted state, reject it and use confirmed baseline filters without saving an adaptation.
- Do not combine job listings, advertised compensation, problem signals, or hypotheses with paid-task candidates or realized revenue.
- All search/source work is free to query, bounded, evidence-linked, permission-aware, and fail-closed. No applications, bids, messages, account creation, publication, purchases, or paid calls.
- Preserve the existing nine-query discovery behavior until the adaptive paid-task planner is integrated and validated; no regression to current evidence/policy paths.

## Review Focus

Review the protected-versus-adjustable profile boundary, authenticated encryption and cold-start behavior, real-metric feedback (not fabricated performance), source terms and provenance, destination/redirect/size/rate safety, the 3-report/2-domain/90-day/buyer-signal hypothesis gate, and separation from revenue accounting. Check that missing facts remain unknown and every active source has both parser tests and a passing live-contract probe.

## Implementation Tasks

### Task 1: Define private remote-job profile and authenticated filter state

**Files**
- Create `src/remote-job-profile.ts`
- Create `src/remote-job-profile.test.ts`
- Create `src/remote-job-filter-state.ts`
- Create `src/remote-job-filter-state.test.ts`

- [ ] Write failing tests for parsing the confirmed baseline profile, preserving explicitly unknown pay/hours/employment-type fields, and rejecting malformed or missing profiles without inventing defaults.
- [ ] Write failing tests proving updates can change only adjustable search terms/categories/source choices/recency weights; protected constraints remain byte-for-byte equivalent and unknown fields stay unknown.
- [ ] Write failing tests for authenticated encryption/decryption, tamper rejection, wrong-key rejection, schema/version rejection, revision metadata, and fallback behavior without logging plaintext or diffs.
- [ ] Implement the typed profile, validator, revision/diff model, and Node crypto-backed authenticated encryption using a versioned envelope.
- [ ] Run `npm test`; confirm the new tests pass and existing tests remain green.
- [ ] Review fixtures and failure messages for accidental personal values; commit as `feat: add private remote job profile state`.

### Task 2: Add deterministic adaptive query planning and aggregate metrics

**Files**
- Create `src/query-planner.ts`
- Create `src/query-planner.test.ts`
- Create `src/discovery-metrics.ts`
- Create `src/discovery-metrics.test.ts`

- [ ] Write failing tests for deterministic query selection from profile, source registry, run seed, and prior metrics; consecutive seeds must vary the selection within configured budgets.
- [ ] Write failing tests that result count, deduplication, recency, and surviving candidates affect later query priority, while missing/corrupt metrics produce a documented cold-start rotation.
- [ ] Write failing tests that each planned query carries its selection reason and exact query text; enforce per-source query/result/request/time caps.
- [ ] Implement a bounded planner and schema-versioned metrics reducer. Persist only query/source identifiers, timestamps, and aggregate counts; exclude profiles, credentials, content, and filter diffs.
- [ ] Run `npm test`; confirm planner tests use concrete metric fixtures and no fabricated performance values.
- [ ] Commit as `feat: plan adaptive discovery queries`.

### Task 3: Add a permission-checked first remote-job source

**Files**
- Create `src/remote-job-sources/jobicy.ts`
- Create `src/remote-job-sources/jobicy.test.ts`
- Update `src/source-registry.ts` only for a source that passes validation
- Add a recorded, non-personal fixture under `src/remote-job-sources/fixtures/` if needed

- [ ] Write parser tests for the current official public no-key endpoint response, optional fields, malformed records, canonical listing URLs, source attribution, and bounded result counts.
- [ ] Add tests that reject unexpected hosts/redirect destinations, oversized or non-JSON responses, invalid dates/URLs, and unsafe HTML from descriptions; sanitize any retained description excerpts.
- [ ] Verify the official source terms and perform one bounded live contract probe (including the documented active-listing check where required). Record the probe date and expected schema in the adapter documentation/test metadata, not in user data.
- [ ] Implement the adapter with timeout, request/result bounds, canonical URL validation, and retained listing/source links. Do not implement a paid endpoint or fetch application destinations as part of discovery.
- [ ] Keep the source disabled if the terms, schema, or probe do not pass. Run `npm test` and the focused live probe; report a source failure distinctly from a successful zero-result run.
- [ ] Commit as `feat: add verified remote job feed`.

### Task 4: Validate, rank, and report remote jobs separately

**Files**
- Create `src/remote-job-policy.ts`
- Create `src/remote-job-policy.test.ts`
- Create `src/remote-job-ranking.ts`
- Create `src/remote-job-ranking.test.ts`
- Create `src/remote-job-report.ts`
- Create `src/remote-job-report.test.ts`

- [ ] Write failing tests for currentness, remote/location eligibility, source credibility, duplicates, application route, and stated compensation evidence; missing values must remain unknown.
- [ ] Write failing tests proving protected profile constraints exclude mismatches, adjustable terms contribute only explainable evidence, and no fit percent, pay estimate, hiring probability, or schedule is invented.
- [ ] Write failing tests that output contains source/canonical URLs, observed and posted dates, evidence, unknowns, and direct application link when present; job results and advertised compensation cannot enter paid-candidate/revenue records.
- [ ] Implement verification, deterministic ranking, and a distinct report section. An absent/invalid private profile must skip this stream with a clear status.
- [ ] Run `npm test`; confirm existing paid-candidate, profitability, and ledger tests still pass.
- [ ] Commit as `feat: report remote jobs as a separate stream`.

### Task 5: Cluster problem signals and gate opportunity hypotheses

**Files**
- Create `src/problem-signals.ts`
- Create `src/problem-signals.test.ts`
- Create `src/opportunity-hypotheses.ts`
- Create `src/opportunity-hypotheses.test.ts`

- [ ] Write failing tests for deduplication and independent-source counting across unrelated domains in a rolling 90-day window.
- [ ] Write failing tests that fewer than three independent reports, fewer than two unrelated domains, stale reports, or no verifiable buyer/willingness-to-pay evidence remain problem signals.
- [ ] Write failing tests that a qualifying hypothesis includes source links, observed problem, affected buyer, narrow offer, buyer/spend signal, unknowns, and a zero-cost owner-chosen validation step.
- [ ] Implement deterministic clustering and evidence templates. Do not introduce model calls or let hypotheses enter verified paid opportunities or realized-revenue counts.
- [ ] Run `npm test`; confirm threshold boundary cases and separate output types.
- [ ] Commit as `feat: gate opportunity hypotheses on evidence`.

### Task 6: Integrate all streams and secure seven-day workflow state

**Files**
- Create `src/discovery-run.ts`
- Create `src/discovery-run.test.ts`
- Update `src/github-live.ts` only as needed to preserve the existing command and paid stream
- Update `package.json` with a separate all-stream script while preserving existing scripts
- Update `.github/workflows/discover.yml`
- Update `docs/LIVE-SOURCES.md` and `docs/OPPORTUNITY-UNIVERSE.md`

- [ ] Write failing orchestration tests for three isolated outputs (paid candidates, problem signals/hypotheses, remote jobs), useful per-source failure summaries, and no-results summaries.
- [ ] Add a new command (for example, `npm run discover:all`) without removing or silently changing the current `discover` or `discover:github` commands.
- [ ] Update the scheduled workflow to run the new command, request only the artifact-read permission needed for prior-run state, restore only artifacts younger than seven days, and upload aggregate metrics plus authenticated ciphertext with seven-day retention. Never log decrypted data or upload plaintext filter state.
- [ ] Use `REVENUE_REMOTE_JOB_PROFILE_JSON` and `REVENUE_JOB_FILTER_STATE_KEY` as secret inputs. If either is absent, skip remote-job search safely and report setup required; do not synthesize preferences. Keep existing capability profile values separate.
- [ ] Confirm the action has no permission to write repository contents and does not commit run state. Preserve a deterministic cold-start if the Actions read/artifact path is unavailable.
- [ ] Run `npm test`, `npm run build`, and the all-stream command with safe fixture inputs; inspect generated artifacts and logs for personal data and stream separation.
- [ ] Commit as `feat: integrate adaptive discovery streams`.

### Task 7: Final verification and owner setup handoff

**Files**
- Update relevant test/docs files only if verification finds a gap

- [ ] Run `npm test` and `npm run build` from a clean checkout.
- [ ] Run the bounded live source probe and confirm every enabled source has a current contract check; disabled/unverified sources must be labeled as such.
- [ ] Inspect a complete fixture-backed run artifact for separate streams, provenance, query reasons, source failures, unknowns, and no unsupported pay/fit/probability values.
- [ ] Confirm private-state encryption round trip and tamper rejection without printing secret material; confirm uploaded test artifacts contain ciphertext only.
- [ ] Recheck the repository diff against every verification criterion in the spec and confirm existing trust/policy/ledger tests remain green.
- [ ] Commit any verification-only documentation changes as `docs: record discovery verification`.
- [ ] After code review, provide the owner the one-time GitHub Actions secret setup values/instructions privately; until those secrets exist the scheduled workflow must explicitly skip remote-job search rather than guess.

## Dependency Order

Tasks 1 and 2 establish the state and feedback contracts. Task 3 can proceed independently after source-term verification. Task 4 depends on Task 1 and Task 3. Task 5 is isolated from remote-job ranking and can proceed after provenance types are known. Task 6 integrates Tasks 1–5. Task 7 follows integration and review.

## Self-Review

- Coverage: includes adaptive paid-task queries, separate remote-job discovery, saved-filter adaptation, a gated first source, evidence-backed hypotheses, reporting, encrypted private state, Actions persistence, and all spec safety constraints.
- Task size: each task produces a reviewable unit with focused tests and a commit.
- Interfaces: profile, metrics/planner, source adapter, job policy/report, hypothesis output, and runner have explicit ownership boundaries; implementation must keep those boundaries rather than merge streams.
- Failure modes: missing profile, corrupt/expired state, source/parser failures, no results, unsafe destinations, missing buyer evidence, and workflow artifact failures all have defined safe behavior.
