# Adaptive Opportunity Discovery Design

**Status:** Draft for owner review  
**Repository:** `apexaimax/autowealth_a`  
**Base commit:** `d4c8ece197a9b9f66582a41910f39ee900bce174`  
**Date:** 2026-09-29

## Goal

Find realistic zero-upfront-cost earning options through two separate streams: (1) paid tasks and evidence-backed service/product hypotheses, and (2) high-fit remote jobs. Vary searches, use permitted public sources, and adapt saved soft search filters from actual results without silently relaxing owner-confirmed constraints.

## User intent and constraints

The owner wants the system to create opportunities as well as find posted ones, and wants remote jobs included as a separate stream. Discovery should not depend on the same small set of queries returning a result. Existing job-search criteria must be carried forward without inventing missing preferences. The operating constraints remain:

- Free-to-query sources and services only; no paid API, subscription, ad spend, deposit, stake, or purchase.
- Use the configured capability profile and the separately saved remote-job profile. Keep each profile private; never put its personal values in public source files or unencrypted artifacts.
- Treat owner-confirmed job constraints as protected. Adapt search wording, adjacent role terms, and source selection automatically; do not relax protected constraints or fill unknown pay, hours, or employment-type preferences without owner confirmation.
- Keep remote-job findings separate from paid-task candidates, product/service hypotheses, and realized revenue.
- Keep evidence and source links with every lead.
- Do not represent an idea, listing, projected payment, or likely win as earned revenue.
- Do not impersonate the owner, submit applications or bids, contact prospects, publish offers, or spend money without a separately authorized human action.
- Never bypass logins, paywalls, CAPTCHAs, access controls, rate limits, or a source's stated restrictions.

## Current baseline

At the base commit, `.github/workflows/discover.yml` runs hourly and invokes `npm run discover:github`. `src/github-live.ts` issues nine fixed GitHub public-issue queries. The repository already has source adapters, a source registry/policy, profile-fit checks, evidence-based candidate classification, and an opportunity-universe taxonomy. There is no live non-GitHub source, remote-job stream, or mechanism to generate a business hypothesis from recurring problem reports. A read-only check of the related resume-builder repository found a product blueprint and starter documentation, but no owner resume or work-history data to import. The separate saved job-search criteria are the profile source for the first job-stream version; unspecified preferences stay unknown.

The existing trust boundary remains authoritative: search results and aggregators may discover a lead, but only verifiable source evidence can support an opportunity decision.

## Design

### 1. Adaptive query planner

Add a deterministic query planner that composes search variants from:

- opportunity category and task terms;
- reward and buyer-intent terms;
- the configured user capability profile;
- geography, device, recency, and eligibility terms where the source supports them.

The planner will rotate across categories and term combinations so consecutive hourly runs do not repeat one fixed query set. Within a run, it will broaden or narrow a query using observable yield signals such as result count, duplicate count, recency, and the number of candidates that survive source and profile checks. Search planning must be bounded by explicit per-source query, result, time, and request limits.

The plan must be deterministic for a given profile, source registry, prior-run metrics, and run seed. It must not require a paid model or invent query-performance facts. It must emit the exact queries used and the reason each was selected.

### 2. Source expansion and public-page extraction

Extend the existing source registry and adapter boundary rather than embedding source-specific parsing in the planner.

Source activation order:

1. Official public APIs and documented machine-readable feeds (including RSS/Atom) with a free query path.
2. Explicitly allowlisted public pages when a feed/API is unavailable and the source permits automated access.

A public-page adapter must use bounded requests, conservative per-domain rate limits, timeouts, response-size limits, redirect checks, and canonical URL validation. It must reject private/local network destinations and restricted pages. It must not attempt browser impersonation or anti-bot evasion. Each adapter is enabled only after its live response and parser contract have been verified. Search engines and aggregators remain lead sources; they do not prove payment or availability.

Captured evidence should retain the source URL, canonical URL, observation time, extraction method, and a content hash or concise supporting excerpt. Avoid storing unnecessary personal data.

### 3. Separate remote-job discovery stream

Add a remote-job stream with its own source adapters, saved profile, verification rules, and report section. It must not merge employment listings into paid-task economics, service/product hypotheses, or realized-revenue records.

Seed its private profile from the owner's existing saved job-search criteria. Store profile values outside public source files. Keep the profile structured into:

- **Protected constraints:** owner-confirmed requirements that discovery may never relax on its own.
- **Adjustable search filters:** role titles and synonyms, adjacent role categories, search terms, source/site selection, and recency/ranking weights that can be tuned from observed results.
- **Unknown preferences:** values the owner has not supplied, such as a minimum pay, desired hours, or employment type. Unknowns are recorded as unknown and do not silently become filters.

The system may automatically update and persist adjustable filters when measured results justify a change. Each revision must record a version, timestamp, before/after filter diff, evidence and reason, and a rollback path. Search-term expansion and adjacent role discovery may happen without a prompt. Any change that would relax a protected constraint or assign an unknown preference requires owner confirmation. If saved private state cannot be safely loaded or written, use only the confirmed baseline profile and report that adaptation was not saved.

Search only sources with a free query path and lawful/public access. Prefer official employer career pages and documented job feeds/APIs; use allowlisted public pages only where automated access is permitted. Retain the canonical employer/listing URL, posted/observed dates, location/remote terms, pay when stated, application route, and supporting evidence. Confirm that a listing is current and that the employer/source is credible before presenting it as a high-fit result. A job ad's stated salary is not payment received.

The remote-job output should explain fit, list pay when available, note schedule or application-process evidence, and identify unknowns. Include a direct application link when available. Discovery may prepare this information but must not submit applications, create accounts, message employers, or represent the owner.

### 4. Opportunity hypotheses from demand evidence

Add a separate output for **opportunity hypotheses**. The system may form a hypothesis when independent, recent public signals show a recurring problem that plausibly matches the configured capabilities. A hypothesis should identify:

- the observed problem and supporting source links;
- who appears to have the problem;
- a narrowly scoped service or product offer that could address it;
- evidence of a buyer, existing spend, or another concrete willingness-to-pay signal;
- what remains unknown;
- the smallest zero-cost validation step the owner could choose to take.

A hypothesis is not a paid opportunity, an authorized offer, a commitment, or revenue. Recurring complaints alone are insufficient to claim demand or payment. When willingness-to-pay evidence is missing, the record must say so and remain unvalidated. The system may draft an offer for review; it must not publish it or contact anyone.

Use a deterministic, testable first version for clustering and hypothesis templates. Any later model-assisted step must remain optional, free to operate, evidence-cited, and unable to change the trust or execution boundary.

### 5. Separate evidence states and reporting

The discovery artifact will report, separately:

- verified-source opportunity candidates and their current policy/economics states;
- unverified leads awaiting an authoritative source check;
- opportunity hypotheses and their evidence gaps;
- remote jobs in a separate list with fit, source, status, pay evidence, and unknowns;
- queries and sources attempted, including failures and bounded-limit outcomes;
- deduplication and relevance counts.

Unknown values remain unknown. A generated hypothesis must not enter a verified-candidate or realized-revenue count. Remote job listings and advertised pay must not enter paid-task or realized-revenue counts. The current fail-closed profitability, approval, execution, payment verification, and revenue-ledger paths remain unchanged.

## Data flow

```text
private owner profiles + source registry + run seed + aggregate metrics
                         ↓
                 adaptive query planner
                    ↙              ↘
       paid-task/problem sources    remote-job sources
                    ↓              ↓
    source adapters + provenance   job verification + profile fit
              ↙              ↘          ↓
  paid candidates/hypotheses    separate remote-job report
              ↘              ↙
          evidence-linked run artifact
```

## State and feedback

Persist aggregate query metrics as a `discovery-metrics.json` GitHub Actions artifact with a seven-day retention, matching the existing discovery artifact's retention. Metrics contain a schema version, query/source identifiers, run timestamps, result counts, duplicate counts, and counts passing source/profile checks; they never contain credentials, full page content, or personal profile values.

Persist the remote-job filter state separately as authenticated ciphertext in a `remote-job-filter-state.enc.json` artifact, refreshed on successful updates. Encrypt and authenticate it using a key held only as a GitHub Actions secret. Do not upload the decrypted profile or filter diff in an artifact or log. Record revision metadata inside the encrypted state and emit only a non-sensitive revision ID plus generic change reason in public logs. If the encrypted state cannot be decrypted, authenticated, or saved, reject it and fall back to the owner-confirmed baseline; never relax a protected constraint.

Each run may use only schema-compatible state from the previous seven days. If it is missing, expired, or invalid, use a deterministic rotating schedule, load only the confirmed baseline, and label the run a cold-start. Discovery must continue safely without historical metrics. The workflow must not commit run state or personal filter values back to the public repository.
## Failure handling

- A failed source, parser mismatch, blocked page, or exhausted request limit is recorded as a source failure; it does not become an empty successful result.
- Retry only bounded transient failures, with backoff and per-domain limits.
- Invalid, stale, duplicate, or unsupported evidence stays out of verified candidates.
- If the private job profile is missing or invalid, do not guess defaults; skip job search and report that the profile needs owner input.
- If an authoritative page contradicts a search result, use the authoritative page and record the conflict.
- If the source cannot be fetched or its permissions are unclear, leave the lead unverified and do not scrape it.

## Verification criteria

The implementation is acceptable when tests and run evidence show that:

1. Consecutive run seeds produce varied, reproducible queries while respecting fixed request budgets.
2. Query feedback changes later query selection from real recorded metrics; missing/corrupt metrics produce a safe cold-start.
3. Duplicate and low-relevance results reduce a query's priority, while qualified unique results can increase related exploration.
4. Every active source has a parser/schema test and at least one verified live response; unverified adapters remain disabled.
5. Public-page extraction enforces the domain allowlist, destination/redirect checks, response and rate limits, and restricted-page refusal.
6. Every candidate or hypothesis carries provenance and observation time; hypothesis records never count as verified paid opportunities or realized revenue.
7. Repeated problem signals without willingness-to-pay evidence remain explicitly unvalidated.
8. No application, bid, contact, publication, account action, or purchase is performed by discovery.
9. Remote-job results remain separate from paid opportunities and realized revenue; advertised compensation is never treated as received payment.
10. Job-profile adaptation changes only adjustable filters, writes an authenticated encrypted revision, and preserves every protected constraint; unknown preferences remain unknown.
11. Public repository files, artifacts, and logs contain no plaintext remote-job profile, personal resume, or filter diff.
12. ResuMaster contributes no owner profile facts unless a later read confirms owner-authored resume data is actually present and the owner approves that source.
13. Existing discovery policy, profitability, approval, execution, and revenue-ledger tests remain green.

## Implementation boundaries

This design adds a separate remote-job discovery stream to opportunity discovery. It does not merge job listings with paid-task economics or revenue accounting. It does not add a payment processor, paid search/data service, autonomous sales/contact/application activity, an execution capability, or a new authorization path. Any such change requires a separate design review.
