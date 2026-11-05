# Deep Research Prompt — Compound Face Tiling with Magnetic Pieces

You are a discrete geometer, tiling-theory researcher, exact-cover/constraint-programming engineer, computational-fabrication specialist, and magnetic-construction-system designer.

**Current date:** [insert current date]

Create an implementation-ready dossier titled:

**“Tiling Polyhedron Faces with Multiple Magnetic Tiles”**

## Goal

Design a solver that represents one mathematical face—such as a pentagon, hexagon, rectangle, or irregular polygon—with several available physical magnetic pieces while preserving a usable external boundary and mechanically meaningful internal seams.

## Questions

1. Which face regions can be tiled exactly by supported square and triangle primitives at one global scale?
2. How should boundary approximation error be represented when exact tiling is impossible?
3. How do exact cover, dancing links, MILP, CP-SAT, SAT, integer lattice methods, and polygon-decomposition algorithms compare?
4. How should rotations, reflections, micro/standard scale, color, inventory, and connector compatibility be encoded?
5. How should internal seam edges be classified as connected, unsupported, or mechanically weak?
6. How can the solver avoid disconnected components, holes, slivers, and unusable internal closures?
7. Which objectives minimize piece count, seam count, unsupported boundary, inventory shortages, and assembly complexity?
8. How should compound face assemblies connect to adjacent faces in the global polyhedron build?
9. Which tilings are mathematically valid but physically implausible?
10. What interactive UI best explains a face decomposition to a learner?

## Required deliverables

- exact problem formulation;
- candidate-placement generation;
- boundary and connector constraints;
- solver comparison and recommendation;
- machine-readable tiling schema;
- solution certificate and verification algorithm;
- inventory-aware objective function;
- benchmark shapes and expected fixtures;
- UI/interaction storyboard;
- staged implementation plan;
- explicit limits and safe product terminology.

Include worked examples for a regular pentagon, regular hexagon, rectangle, octagon, and at least one irregular convex face using both standard-only and standard-plus-micro inventories.
