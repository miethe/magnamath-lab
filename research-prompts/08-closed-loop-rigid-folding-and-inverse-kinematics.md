# Deep Research Prompt — Closed-Loop Rigid Folding, Constraint Projection, and Inverse Kinematics

You are a rigid-origami mathematician, multibody kinematics researcher, robotics inverse-kinematics engineer, nonlinear optimization specialist, constraint-solver architect, and interactive-geometry systems designer.

Current date: 2026-08-10.

## Context

MagnaMath 0.4.0 represents an open net as a rooted spanning tree of rigid polygon faces. Forward kinematics is exact because every non-root face has one parent hinge. At the target, cut-edge copies close to reconstruct the source polyhedron. Future direct manipulation, arbitrary hinge graphs, compound panels, and physical closure introduce cycles and simultaneous constraints that cannot be represented by unconstrained tree forward kinematics alone.

## Research objective

Design the mathematical and implementation foundation for interactive rigid folding with loop-closure constraints, driven hinges, locked hinges, partial goals, and inverse-kinematic manipulation.

## Required research questions

1. How are rigid-origami configurations represented by fold angles, vertex coordinates, or rigid-body transforms?
2. What closure constraints arise around vertices, cycles, and cut-edge pairs?
3. Compare tree-coordinate, redundant-coordinate, and maximal-coordinate formulations.
4. How are loop-closure residuals and Jacobians derived?
5. Compare Newton-Raphson, Gauss-Newton, Levenberg-Marquardt, sequential quadratic programming, augmented Lagrangian, and position-based constraint projection.
6. How should singular configurations and multiple branches be detected and exposed?
7. What conditions characterize local rigid foldability and degrees of freedom?
8. How should user dragging define an objective while preserving exact face rigidity and closure?
9. How should overconstrained or inconsistent user requests be handled?
10. How can the solver preserve continuity with the previous frame rather than jumping branches?
11. What role can automatic differentiation, sparse linear algebra, WASM, or GPU compute play?
12. How should joint limits, finite-thickness offsets, and collision constraints enter the solve?
13. Can a physics joint solver substitute for geometric constraint projection, and what accuracy is lost?
14. What benchmarks exist for rigid origami, deployable mechanisms, and closed kinematic chains?
15. How can solver results carry residuals, condition numbers, branch identifiers, and confidence to the UI?

## Required deliverables

1. Recommended mathematical representation for MagnaMath.
2. Formal variables, constraints, residuals, and objective functions.
3. Derivation or source-grounded explanation of the Jacobian needed for loop closure.
4. Algorithm comparison table.
5. Proposed solver API for:
   - project current pose onto constraints;
   - solve for a dragged face/point;
   - drive selected hinges;
   - lock subsets;
   - find nearby branches;
   - report unsatisfiable requests.
6. Sparse data structures using stable face and edge identifiers.
7. Initialization and warm-start strategy from the existing tree pose.
8. Singularity and branch-continuity strategy.
9. Numerical tolerance and scaling policy.
10. Worker/WASM architecture.
11. Benchmark suite with known mechanisms and expected degrees of freedom.
12. UI recommendations for residuals, constraint conflict, and alternate solutions.
13. Implementation phases and acceptance criteria.
14. Primary-source table with dates and links.
15. Claims requiring original validation.

## Source requirements

Prioritize foundational rigid-origami papers, deployable mechanism literature, robotics closed-chain kinematics, numerical optimization references, and author-maintained implementations. Include the work of Tomohiro Tachi and other relevant primary researchers where applicable, but do not limit the search to one school of methods.

## Constraints

- Do not imply that all crease patterns have a valid rigid folding.
- Distinguish local solvability from a global path.
- Distinguish exact geometric constraints from compliant physical deformation.
- Preserve previous-pose continuity as a first-class interactive requirement.
