# Deep Research Prompt — Continuous Collision Detection and Folding-Path Planning for MagnaMath

You are a computational-geometry researcher, robot-motion-planning researcher, collision-detection engineer, rigid-origami researcher, numerical optimization specialist, browser/WASM performance engineer, and educational simulation architect.

Current date: 2026-08-10.

## Context

MagnaMath is a web-first exact polyhedron laboratory. It stores ordered polygon faces, creates a selected one-piece net as a rooted face-adjacency spanning tree, and performs exact forward kinematics by rotating rigid child subtrees around shared-edge hinges. Release 0.4.0 can sample poses, preserve hinge continuity and face rigidity, reach the exact target solid, and detect some zero-thickness polygon intersections at discrete samples.

The next problem is materially harder: determine whether a **continuous path** through hinge-angle space exists from a flat net to the target solid without self-intersection, and find or improve such a path when simultaneous or simple sequential folding collides.

## Research objective

Produce an implementation-oriented research dossier for a continuous collision and folding-path subsystem that can be integrated behind a renderer-independent JavaScript interface and can later support finite-thickness panels.

## Required research questions

1. What exact continuous collision-detection methods are suitable for rotating polygonal panels connected by hinges?
2. How should swept bounds be calculated for a subtree rotating about a fixed line?
3. Which narrow-phase methods are robust for continuously moving triangles or convex polygons under rotational motion?
4. When is adaptive temporal subdivision defensible, and how can it provide a conservative error or clearance bound?
5. How should adjacent faces, shared vertices, coplanar contact, and intended target closure be treated?
6. How should numerical tolerances scale with model size?
7. How should the system distinguish collision, touching contact, near contact, and uncertain contact?
8. How can path planning operate in an `F−1` dimensional hinge-angle space?
9. Compare:
   - monotone simultaneous schedules;
   - ordered one-hinge-at-a-time schedules;
   - local schedule optimization;
   - sampling-based planners such as RRT/RRT-Connect/PRM;
   - trajectory optimization;
   - constraint-aware search;
   - symmetry reduction;
   - learning-guided heuristics, if evidence exists.
10. Which methods can establish nonexistence versus merely failing to find a path?
11. How should the planner handle user-locked hinges and timeline windows?
12. How should collision checking and planning be distributed across Web Workers, WASM, WebGPU compute, or a server?
13. What benchmark corpora or known polyhedron-net examples exist?
14. What research distinguishes an overlap-free net from a continuously foldable net?
15. What licenses and implementation risks apply to candidate libraries or reference code?

## Required deliverables

1. Executive findings and clear recommendation.
2. Mathematical formulation of configuration space and collision constraints.
3. Algorithm comparison table with completeness, robustness, complexity, performance, and implementation burden.
4. Proposed staged architecture:
   - broad phase;
   - narrow phase;
   - path validator;
   - path search/repair;
   - worker protocol;
   - replayable motion-clip output.
5. Pseudocode for the recommended initial algorithm.
6. Data structures and TypeScript interfaces compatible with MagnaMath stable edge/face identifiers.
7. Numerical tolerance policy.
8. Contact classification policy.
9. Benchmark plan with at least 20 concrete cases, including known easy, colliding, and near-contact examples.
10. Performance budget for desktop, tablet, and phone.
11. Failure modes and how the UI should communicate them.
12. Validation plan against independent implementations or exact/interval methods.
13. Recommended open-source libraries and direct primary-source links.
14. A list of claims that still require original experimentation.
15. A 3-phase implementation backlog with acceptance criteria.

## Source requirements

Prioritize peer-reviewed papers, authors’ repositories, official library documentation, theses, and established computational-geometry texts. Use secondary summaries only to locate primary work. Include DOI, arXiv, project, or repository links and publication dates. Clearly distinguish exact guarantees from heuristics and empirical success.

## Constraints

- Do not assume that dense discrete sampling proves continuous collision freedom.
- Do not equate static net non-overlap with foldability.
- Preserve the distinction between zero-thickness geometry and finite-thickness physical panels.
- Do not recommend one library merely because it is convenient in JavaScript.
- The recommended API must be cancellable and deterministic when supplied a seed.
