# Revenue Automaton

A revenue-first agent control layer inspired by the open-source Conway Research Automaton.

## M0 goal

Produce one externally verifiable, positive-net-profit transaction without allowing autonomous activity to masquerade as revenue.

## Core rule

An opportunity is denied by default. It may proceed only when payment/demand evidence exists, the work is executable, expected costs are bounded, expected revenue clears the configured profit margin, and delivery/payment can be recorded.

M0 does **not** fund wallets, trade assets, gamble, buy ads, replicate agents, auto-top-up credits, or authorize uncontrolled spending.

```
opportunity -> evidence -> capability check -> profitability gate
            -> approved work -> delivery/QA -> payment -> realized P&L
```

Projected revenue is never counted as realized revenue.

## Acquisition modes

**Mode A — Posted opportunity** preserves the existing bounty/task/service pipeline. Authoritative payment, eligibility, device, cost and profitability gates remain fail-closed.

**Mode B — Capability to buyer** starts from a demonstrated capability, records external workflow/problem evidence, creates a commercial candidate only when the evidence chain is defensible, and may prepare an exact proposal for human review. Hourly GitHub demand discovery emits discovery-only `commercialResearchSeeds`; those seeds are not buyer intent or authoritative commercial evidence.

Commercial proposals bind approval to the exact recipient, route, subject, body, links, attachments and capability evidence references. This repository contains no autonomous email, DM, web-form, job-application or proposal-send worker.

Commercial pipeline events can be persisted through the Git-backed compare-and-swap store on a dedicated state branch. Hourly discovery also maintains a separate durable, deduplicated `opportunity-inbox` branch containing `opportunity-inbox.json`; this is discovery state only and cannot authorize claims, applications, outreach, or spending. A stale ref cannot silently overwrite newer committed history. See `docs/COMMERCIAL-MODE-B.md`.

## Development

```bash
npm test
npm run build
```

## License

MIT
