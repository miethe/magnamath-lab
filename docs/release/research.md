# Release research — 2026-11-05

## Existing work

- [Stella](https://software3d.com/Stella.php) advertises hundreds of polyhedra, printable nets with tabs, and folding animation. Its public description does not establish equivalent magnetic-tile calibration.
- [Polyhedron Playground](https://polyh.app/) offers browser-based cutting, gluing and unfolding.
- [PullupStructs](https://hcie.csail.mit.edu/research/popupnets/popupnets.html) researches mesh unfolding and fabrication of pull-up nets.
- [When can a net fold to a polyhedron?](https://www.sciencedirect.com/science/article/pii/S0925772104001361) studies folding nets, including non-intersection with rigid faces.
- [Unfolding Polyhedra](https://arxiv.org/abs/1908.07152) surveys open and solved geometric unfolding questions.

This is a bounded discovery pass, not proof of novelty or a feature-by-feature independent test.

## Name and licensing

On 2026-11-05 the requested USPTO and WIPO database searches for `MAGNA*` in Nice classes 28, 41 and 9 could not be executed: [USPTO search](https://tmsearch.uspto.gov/) returned a JavaScript-only page and [WIPO Global Brand Database](https://branddb.wipo.int/) presented a verification challenge. No database result ordering or exhaustive coverage is claimed. An alternative web query, `site:uspto.gov trademark search MAGNA TILES class 28 registration`, found these official USPTO tribunal records:

- [MAGNA-TILES, registration 5622354, class 28](https://ttabvue.uspto.gov/ttabvue/ttabvue-91297440-OPP-1.pdf): toy building and construction blocks incorporating magnets.
- [MAGNA-QUBIX, registration 5687289, class 28](https://ttabvue.uspto.gov/ttabvue/ttabvue-91297235-OPP-1.pdf): toy building and construction blocks incorporating magnets.
- [MAGNA-TILES, registration 2654320, class 28](https://ttabvue.uspto.gov/ttabvue/ttabvue-91299356-OPP-1.pdf): manipulative blocks and puzzles.

These are selections from case filings, not current-status searches. Classes 9 and 41 and WIPO remain unsearched; no clearance conclusion is offered. The older [miethe/MagnaMath](https://github.com/miethe/MagnaMath) repository is public; GitHub reports creation on 2026-02-22.

The repository is licensed under MIT; see `LICENSE` and `LICENSE-NOTICE.md`. Third-party materials may have separate terms.

## Evidence gaps

On 2026-11-10, `npm audit` reported 6 affected packages (2 low, 4 moderate; no high). The clean local clone installed and built with Node 22.20.0.
