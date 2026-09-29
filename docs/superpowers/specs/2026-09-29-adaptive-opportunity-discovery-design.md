# Adaptive Opportunity Discovery Design

**Status:** Draft for owner review  
**Repository:** `apexaimax/autowealth_a`  
**Base commit:** `d4c8ece197a9b9f66582a41910f39ee900bce174`  
**Date:** 2026-09-29

## Goal

Find and develop realistic zero-upfront-cost revenue opportunities for the owner's configured capabilities by varying searches, checking permitted public sources, and turning repeated evidence of unmet demand into clearly labeled offers to validate.

## User intent and constraints

The owner wants the system to create opportunities as well as find posted ones. Discovery should not depend on the same small set of queries returning a result. The operating constraints remain:

- Free-to-query sources and services only; no paid API, subscription, ad spend, deposit, stake, or purchase.
- Use the configured capability profile, including device and location constraints.
- Keep evidence and source links with every lead.
- Do not represent an idea, listing, projected payment, or likely win as earned revenue.
- Do not impersonate the owner, submit applications or bids, contact prospects, publish offers, or spend money without a separately authorized human action.
- Never bypass logins, paywalls, CAPTCHAs, access controls, rate limits, or a source's stated restrictions.

## Current baseline

At the base commit, `.github/workflows/discover.yml` runs hourly and invokes `npm run discover:github`. `src/github-live.ts` issues nine fixed GitHub public-issue queries. The repository already has source adapters, a source registry/policy, profile-fit checks, evidence-based candidate classification, and an opportunity-universe taxonomy. There is no live non-GitHub source and no mechanism to generate a business hypothesis from recurring problem reports.

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

### 3. Opportunity hypotheses from demand evidence

Add a separate output for **opportunity hypotheses**. The system may form a hypothesis when independent, recent public signals show a recurring problem that plausibly matches the configured capabilities. A hypothesis should identify:

- the observed problem and supporting source links;
- who appears to have the problem;
- a narrowly scoped service or product offer that could address it;
- evidence of a buyer, existing spend, or another concrete willingness-to-pay signal;
- what remains unknown;
- the smallest zero-cost validation step the owner could choose to take.

A hypothesis is not a paid opportunity, an authorized offer, a commitment, or revenue. Recurring complaints alone are insufficient to claim demand or payment. When willingness-to-pay evidence is missing, the record must say so and remain unvalidated. The system may draft an offer for review; it must not publish it or contact anyone.

Use a deterministic, testable first version for clustering and hypothesis templates. Any later model-assisted step must remain optional, free to operate, evidence-cited, and unable to change the trust or execution boundary.

### 4. Separate evidence states and reporting

The discovery artifact will report, separately:

- verified-source opportunity candidates and their current policy/economics states;
- unverified leads awaiting an authoritative source check;
- opportunity hypotheses and their evidence gaps;
- queries and sources attempted, including failures and bounded-limit outcomes;
- deduplication and relevance counts.

Unknown values remain unknown. A generated hypothesis must not enter a verified-candidate or realized-revenue count. The current fail-closed profitability, approval, execution, payment verification, and revenue-ledger paths remain unchanged.

## Data flow

```text
profile + source registry + prior query metrics + run seed
                         ↓
                 adaptive query planner
                         ↓
       official feeds/APIs and permitted public pages
                         ↓
            source adapters + provenance capture
                   ↙                    ↘
      opportunity verification      recurring-demand signals
                 ↓                         ↓
      existing fail-closed gates     hypothesis generator
                   ↘                    ↙
            separate, evidence-linked report
```

## State and feedback

The planner needs privacy-safe query metrics from prior runs to learn which variables produce useful results. Persist only aggregate metrics (query/source identifier, result counts, duplicate counts, survival counts, timestamps, and schema version), not private credentials or unnecessary personal information. Prefer a bounded GitHub Actions artifact or other existing free storage mechanism; define expiration and recovery behavior before implementation. If history is unavailable or invalid, start with a deterministic rotation and label the run as cold-start. Never let missing history stop safe discovery.

## Failure handling

- A failed source, parser mismatch, blocked page, or exhausted request limit is recorded as a source failure; it does not become an empty successful result.
- Retry only bounded transient failures, with backoff and per-domain limits.
- Invalid, stale, duplicate, or unsupported evidence stays out of verified candidates.
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
9. Existing discovery policy, profitability, approval, execution, and revenue-ledger tests remain green.

## Implementation boundaries

This design changes opportunity discovery and its reporting only. It does not add a payment processor, a paid search/data service, an autonomous sales agent, an execution capability, or a new authorization path. Any such change requires a separate design review.
