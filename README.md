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

## Development

```bash
npm test
npm run build
```

## License

MIT
