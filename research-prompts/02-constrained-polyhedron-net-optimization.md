# Deep Research Prompt — Constrained Polyhedron-Net Optimization

You are a computational-geometry researcher, graph-algorithms specialist, combinatorial-optimization engineer, digital-fabrication researcher, and interactive-systems architect.

**Current date:** [insert current date]

Create a source-grounded implementation dossier titled:

**“Interactive Constrained Polyhedron Nets: Algorithms, Objectives, and Benchmarks for MagnaMath”**

## Goal

Select and specify the next solver architecture for generating and interactively repairing non-overlapping edge unfoldings under locked cuts/folds, root-face constraints, page constraints, physical-build objectives, and strict latency budgets.

## Scope

Compare at minimum:

- randomized spanning-tree search;
- local/basis-exchange search;
- tabu search;
- simulated annealing;
- evolutionary methods;
- maximum-leaf spanning-tree heuristics;
- minimum/maximum spanning-tree formulations with learned or geometric edge weights;
- SAT/SMT, CP-SAT, MILP, and exact enumeration for bounded cases;
- progressive mesh segmentation approaches;
- symmetry reduction and canonicalization;
- incremental overlap checking and spatial indexing.

## Research questions

1. Which variants address general polygonal-face polyhedra versus triangular meshes?
2. Which provide feasibility only, optimization, or proofs of optimality/infeasibility?
3. How do methods incorporate required and forbidden dual edges?
4. Which objectives correlate with compactness, page count, cut length, build depth, closure accessibility, label readability, and self-folding behavior?
5. How should multi-objective results be presented as a Pareto gallery?
6. What robust geometric predicates are needed for convex, concave, and nearly coincident faces?
7. What can be updated incrementally after one edge exchange?
8. How should cancellation, deterministic seeds, progress, and time budgets work in a Web Worker?
9. Which benchmark corpus and metrics can prevent solver regressions?
10. Where is the edge-unfolding existence question unresolved, and how should product language avoid overclaiming?

## Required benchmark design

Define a reproducible corpus including:

- Platonic and Archimedean solids;
- Catalan and Johnson solids;
- prisms, antiprisms, cupolas, rotundas;
- non-edge-uniform and high-face-count models;
- concave-face cases after declared decomposition;
- adversarial nearly-overlapping cases;
- locked-edge scenarios of increasing constraint density.

Metrics must include:

- success rate by time budget;
- first-valid latency and best-known latency;
- overlap area/pair count;
- bounding area and aspect;
- true exposed cut perimeter;
- tree depth, leaves, and branching near root;
- page count after packing;
- determinism/reproducibility;
- memory and main-thread blocking;
- constraint retention.

## Required outputs

1. Literature/source table with dates, DOIs, and code/data availability.
2. Algorithm taxonomy and comparison matrix.
3. Recommended hybrid solver architecture.
4. Pseudocode and data structures.
5. Web Worker message/API contract.
6. Incremental geometry strategy.
7. Benchmark corpus specification and machine-readable result schema.
8. Pareto-objective design.
9. Acceptance thresholds for desktop and mobile.
10. Risks, open mathematical questions, and claims requiring verification.
11. A staged implementation plan with small, medium, and research-heavy increments.

Use primary papers and official project repositories. Reproduce published claims cautiously; distinguish theoretical guarantees from empirical performance.

## Seed primary literature

Begin with, but do not limit the review to:

- Lars Zawallich, “Unfolding polyhedra via tabu search,” *The Visual Computer* 41, 1141–1154 (2025), DOI: <https://doi.org/10.1007/s00371-024-03395-2>
- N. A. M. Araújo et al., “Finding the Optimal Nets for Self-Folding Kirigami,” *Physical Review Letters* 120, 188001 (2018), DOI: <https://doi.org/10.1103/PhysRevLett.120.188001>
- Y. Hao et al., “Creating Foldable Polyhedral Nets Using Evolution Control,” RSS 2018: <https://www.roboticsproceedings.org/rss14/p07.pdf>
- M. Bhargava et al., “Mesh Simplification for Unfolding,” *Computer Graphics Forum* (2025), DOI: <https://doi.org/10.1111/cgf.15269>

Also trace cited datasets, code, negative results, and subsequent work. Do not conflate non-overlapping static unfolding with continuous collision-free refolding or self-folding quality.
