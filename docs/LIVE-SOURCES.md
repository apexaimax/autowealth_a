# Live source verification — 2026-09-28

Activation requires an official machine-readable endpoint, zero upfront spend to query it, authoritative provenance, and a verified response contract. Authentication-dependent sources may be supported later but are not unattended public feeds.

| Source | Status | Reason |
| --- | --- | --- |
| GitHub public issues | ACTIVE | Existing live adapter and workflow; authoritative issue state; payment remains separately unverified. |
| Topcoder Challenge V5 | CANDIDATE | Public API endpoint is documented in Topcoder's public challenge-api history and used as a public API, but the endpoint could not be directly exercised from the current research environment. Keep fail-closed until a live response/schema check succeeds. |
| Bugcrowd | DISABLED | Official API requires per-user API credentials. |
| HackerOne | DISABLED | Hacker API requires username + personal API token. |
| Kaggle | DISABLED | API uses credentials/OAuth; competition participation also requires accepting competition rules. |
| Devpost | DISABLED | No documented official public developer API found. |

Do not promote CANDIDATE to ACTIVE from search results alone. A live endpoint response and parser/schema test are required.
