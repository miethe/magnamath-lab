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

`LICENSE-NOTICE.md` grants no open-source licence and calls for an owner-selected licence and review of dependencies and other third-party material before distribution, plus an archived dependency licence report. The MIT file is staged as a proposal; Nick must decide the licence.

## Evidence gaps

The clean local clone installed and built with Node 22.20.0. The install reported 11 dependency advisories (3 low, 4 moderate, 4 high). Visual inspection and the requested screenshot remain outstanding: Chromium cannot start in this sandbox. No statement about overlap, clipping or empty/error states is supported by this run.

Gitleaks 8.24.2 originally reported 14 findings in commit `92ddc495972af3e45f7c41c1b523241bec28a288`: all are a comment or illustrative placeholder, reviewed individually in `.gitleaksignore`. History was not rewritten. The tracked-tree path scrub replaced 102 specific home-path occurrences across 23 files; imported log paths are marked as original-build-home to preserve their provenance. Historical commits retain their original contents.
