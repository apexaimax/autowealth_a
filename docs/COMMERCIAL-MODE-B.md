# Mode B — Capability-to-Buyer Commercial Pipeline

## Purpose

Mode B turns demonstrated software capabilities into evidence-backed commercial candidates without treating technical similarity, discussion, or projected revenue as realized revenue.

The pipeline is separate from the existing posted-opportunity transaction flow:

```
capability evidence
-> discovery-only research seed
-> authoritative workflow/problem evidence
-> commercial candidate
-> commercial-fit gate/ranking
-> verified public contact route
-> exact proposal
-> exact human approval
-> human-controlled external action
-> response evidence
-> market learning
-> real payable opportunity
-> existing RevenueLedger
-> independently verified payment
-> realized P&L
```

## Evidence rules

Capability evidence is scoped to an individual capability. Project-level maturity does not promote every project capability.

Supported evidence levels are:

- LIVE_VERIFIED
- DETERMINISTICALLY_TESTED
- USER_REAL_WORLD_VERIFIED
- PARTIAL
- UNVERIFIED
- HYPOTHESIS

Search results, aggregators, community content and generated summaries are discovery data. They do not become authoritative evidence merely because they match a capability.

External evidence records preserve the canonical source, observation time, source class, supported claim and content digest. A changed page creates a new observation; historical evidence is not silently rewritten. Freshness is policy-driven by the decision using the evidence.

All external content is treated as data, never as control-plane instructions.

## Buyer evidence

Buyer intent defaults to UNKNOWN and may move to INFERRED or EXPLICIT only from qualifying authoritative evidence.

Payment-path status defaults to UNKNOWN.

A contact route is stored only when it has a public verification reference. Missing or stale contact data must be re-verified before use.

## Commercial fit and ranking

A qualified commercial fit requires more than shared keywords. The expected chain is:

```
verified external workflow/problem
-> concrete friction, cost, risk or value opportunity
-> demonstrated Anthony capability
-> plausible intervention
-> plausible commercial model
```

Mode B ranking is independent of the existing economics ranking and does not invent expected revenue. Zero-upfront-cost and profile incompatibility fail closed.

## Proposal approval

Proposal identity binds:

- candidate ID
- recipient
- contact route
- subject
- exact body
- links
- attachments
- capability/evidence references

Changing any bound value changes the proposal digest and invalidates the old approval.

Commercial event history additionally refuses to record OUTREACH_SENT unless the exact proposal digest was previously prepared and approved. Recording an externally performed action is not the same as performing it.

There is no autonomous outbound sender in this milestone.

## Durable state

The authoritative commercial store uses immutable event files under a dedicated Git branch.

Each write:

1. reads the current branch head;
2. validates event digests;
3. creates immutable event blobs/tree entries;
4. creates a commit whose parent is the expected head;
5. updates the branch ref with force disabled.

If another process has advanced the branch, the competing sibling commit cannot fast-forward the ref. The writer returns STALE rather than overwriting newer state.

Stable event identity derives from domain data. Workflow-run IDs, timestamps and random values are not used as the sole business idempotency key.

The production state target is the `commercial-state` branch. The `commercial-state-proof` branch is reserved for durability verification.

### Proven durability behavior

The proof workflow has independently demonstrated:

- process A commits an event;
- process B reconstructs the committed event from Git;
- process C advances the state;
- process D attempts to commit from the stale parent and is rejected;
- the stale loser event does not appear in reachable state.

The manual workflow is `.github/workflows/commercial-state-proof.yml`.

This is optimistic concurrency through Git ref ancestry, not a distributed database transaction.

## External-action uncertainty

Git cannot atomically transact with an external mail/form provider.

If a future external action may have occurred but durable completion was not recorded, its state must remain UNKNOWN / reconciliation-required. Automatic retry is prohibited until the external outcome is reconciled.

This milestone does not implement external sending, so it cannot create that ambiguity itself.

## Historical outreach

Historical outreach imports are provenance-labelled as `HISTORICAL_EXTERNAL`. Duplicate source records are idempotent. Automated responses, support-channel rejections and no-response records remain distinct.

Historical records do not claim Revenue Automaton executed the original communication.

## Current runtime integration

The existing hourly GitHub discovery scheduler is unchanged. It now also emits `commercialResearchSeeds` for matched existing capabilities.

A research seed is deliberately weak: it contains discovery URLs and organization/repository hints but explicitly sets `authoritativeCommercialEvidence: false` and requires verification of:

- authoritative workflow/problem evidence
- capability evidence
- buyer intent
- payment path
- verified contact

No seed becomes a proposal or transaction automatically.

## Known limitations

- General first-party web research is not yet an unattended crawler inside the repository.
- The hourly discovery job does not autonomously write commercial candidates to `commercial-state`; the store is available for verified pipeline events once created.
- Contact freshness must be evaluated from the underlying evidence before proposal use.
- There is no external sender and no autonomous application/submission path.
- A commercial `PAYMENT_RECEIVED` response classification cannot create realized revenue. Only the existing independent payment-verification path may do that.
- Git persistence provides durable append history and stale-writer protection, not cross-system atomicity with future external providers.
