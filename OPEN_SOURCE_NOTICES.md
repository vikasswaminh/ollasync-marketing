# Open-source notices — Ollasync

Third-party open-source software included in the Ollasync web client and in the service that runs it.

**Why this file exists.** The public page at `/licenses` is no longer linked from the site. It is the
one page exempted from `scripts/mkt_no_leak.sh`, because attribution requires naming components
(LiveKit, NATS, PostgreSQL, DeepFilterNet) that the guard deliberately keeps out of public copy
everywhere else — and it was linked from the footer of all 54 pages. The page still builds, is still
`noindex`, is still excluded from the sitemap, and is still reachable at its URL. This file keeps the
same information as documentation in the repo.

Source of truth for the page: `src/pages/licenses.astro`. Keep the two in step.

Last reviewed: 5 August 2026.

---

## In the Ollasync web client

Delivered to the browser as part of the application, so attribution is owed.

| Component | Package | License | Copyright |
|---|---|---|---|
| LiveKit Client SDK | `livekit-client` | Apache-2.0 | © LiveKit, Inc. |
| LiveKit Track Processors | `@livekit/track-processors` | Apache-2.0 | © LiveKit, Inc. |
| Preact | `preact` | MIT | © The Preact Authors |
| Preact Signals | `@preact/signals` | MIT | © The Preact Authors |
| Noble Ciphers | `@noble/ciphers` | MIT | © Paul Miller |
| Noble Curves | `@noble/curves` | MIT | © Paul Miller |
| HPKE (ChaCha20-Poly1305) | `@hpke/chacha20poly1305` | MIT | © Daisuke Ajitomi |
| Web Noise Suppressor | `@sapphi-red/web-noise-suppressor` | MIT | © sapphi-red |
| DeepFilterNet3 Noise Filter | `deepfilternet3-noise-filter` | Apache-2.0 OR MIT | © the DeepFilterNet authors |

## Platform components

Operated as part of the service rather than shipped to the browser.

| Component | License | Copyright |
|---|---|---|
| LiveKit (media server / SFU) | Apache-2.0 | © LiveKit, Inc. |
| NATS | Apache-2.0 | © The NATS Authors |
| PostgreSQL | The PostgreSQL License | © The PostgreSQL Global Development Group |
| Go | BSD-3-Clause | © The Go Authors |
| Rust | Apache-2.0 OR MIT | © The Rust Project Developers |

## License texts

- Apache-2.0 — https://www.apache.org/licenses/LICENSE-2.0
- MIT — https://opensource.org/license/mit
- BSD-3-Clause — https://opensource.org/license/bsd-3-clause
- The PostgreSQL License — https://opensource.org/license/postgresql

Each package also ships its own `LICENSE` file with its distribution.

## Open item

The page carries the note *"Full open-source license notices are being finalised and will be added to
this page shortly."* That is still outstanding — this lists the principal components, not a generated
dependency-level notice.

## Attribution note

Apache-2.0 §4(d) and the MIT license both expect their notices to travel with the distributed work.
Unlinking the page does not remove the obligation, so the URL is kept live rather than deleted. If the
page is ever removed outright, the attributions need another reachable home — an in-product "about"
or a link from `/docs` — before that happens.
