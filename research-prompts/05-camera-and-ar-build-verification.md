# Deep Research Prompt — Camera and AR Build Verification

You are an iOS computer-vision engineer, ARKit/RealityKit architect, 3D pose-estimation researcher, human-computer-interaction specialist, and child-safety/privacy designer.

**Current date:** [insert current date]

Create an evidence-grounded dossier titled:

**“Camera-Assisted Magnetic Tile Recognition and AR Build Guidance for MagnaMath”**

## Goal

Determine whether and how an iPhone/iPad companion can recognize magnetic tile types, estimate pose and adjacency, compare a physical build with an exact MagnaMath project, and guide the next placement under real home/classroom conditions.

## Questions

1. Which tasks can be solved reliably with RGB only, RGB plus depth/LiDAR, or optional fiducials?
2. How should transparent/translucent, reflective, similarly colored, and occluded pieces be detected?
3. What representation best estimates polygon corners, plane pose, edge adjacency, and fold angle?
4. Would classical geometry, synthetic-data-trained detectors, segmentation models, keypoint models, neural radiance/3D reconstruction, or a hybrid be most robust?
5. How should uncertainty accumulate from camera calibration, depth, occlusion, and repeated pieces?
6. How can the app reconcile multiple possible correspondences in symmetric solids?
7. When should it ask the learner to tap/correct rather than advance automatically?
8. What dataset is needed, and how can synthetic scenes reduce real-data burden?
9. What on-device performance, battery, and thermal constraints apply?
10. What privacy design keeps children, rooms, and recordings local by default?

## Required deliverables

- feasibility assessment by feature;
- iOS architecture using current official APIs;
- recognition/pose pipeline;
- dataset and annotation specification;
- synthetic-data plan;
- evaluation protocol with precision, recall, pose error, adjacency error, and false-advance rate;
- UX states for confidence and correction;
- project/observation schema;
- prototype plan with go/no-go thresholds;
- privacy and data-retention model;
- fallback experience for devices without LiDAR.

Use current official Apple documentation and primary computer-vision research. Distinguish demonstrated capability from proposed inference.
