# 15 — Worker-Based Net Portfolio Solver

## Purpose

The manual workshop needs more than a single opaque “optimize” button. Release 0.3.0 treats net search as a portfolio-generation problem: preserve the user's constraints, explore structurally distinct fold trees, expose the trade-offs, and allow the user to choose.

## Execution boundary

`src/core/net.js` remains the source of truth. `src/workers/net-optimizer.worker.js` invokes the same functions in a Web Worker, while `NetOptimizerClient` supplies:

- request IDs;
- progress events;
- cancellation through worker termination;
- stale-response rejection;
- a synchronous fallback when workers are unavailable.

No UI state is mutated inside the worker. The request contains a serializable polyhedron and search options; the response contains serializable net candidates whose sets/maps are reconstructed by the client.

## Search pipeline

1. Validate the closed, connected face-adjacency graph.
2. Seed a deterministic pseudo-random generator.
3. Generate constrained random spanning trees.
4. Reject duplicate canonical edge-set signatures.
5. Place every tree in 2D and compute overlap and objective metrics.
6. Select strong starts and improve them through bounded one-edge exchanges.
7. Compute the non-dominated set across overlap, area, cut perimeter, aspect, depth, and leaf behavior.
8. Apply diversity selection so visually or structurally near-identical candidates do not crowd the gallery.

## Constraint semantics

A required fold must appear in every tree. A required cut cannot appear in any tree. The required-fold set is checked for cycles before search; incompatible constraints fail explicitly rather than being relaxed silently.

## Determinism

For fixed:

```text
polyhedron geometry
root face
seed
objective
required folds
required cuts
attempt/local-search budgets
core version
```

the synchronous and worker paths use the same deterministic core. Browser event timing does not enter the pseudo-random stream.

## Current optimization status

This is a bounded heuristic, not a proof of optimality. It intentionally stops at configured budgets and reports the number of unique and overlap-free trees evaluated. Pending research may replace or augment local improvement with tabu search, symmetry-aware canonicalization, stronger lower bounds, or domain-specific folding objectives without changing the worker contract.

## Validation

The advanced validator exercises all sixteen catalog families with both a required fold and required cut. Every returned candidate:

- retains the required fold;
- excludes the required cut;
- reaches every face;
- contains exactly `F − 1` fold edges;
- is unique within its portfolio;
- is overlap-free.
