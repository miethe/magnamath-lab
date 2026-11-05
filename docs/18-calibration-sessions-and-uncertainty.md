# 18 — Calibration Sessions and Bounded Uncertainty

## Separation of raw evidence and derived profiles

A tile profile is a convenient solver input, but it is not sufficient provenance. Release 0.3.0 stores a raw calibration session separately and derives a profile from it.

This enables:

- later recalculation under improved statistics;
- inspection of individual samples;
- comparison across batches and tools;
- portable evidence exchange;
- preservation of the original measurement context.

## Session fields

A calibration-session v2 record may include:

- session, base-profile, and output-profile identity;
- title and label;
- timestamp, method, tool, and instrument resolution;
- set/SKU/batch notes;
- temperature and humidity;
- optional measured angles;
- complete per-piece edge arrays;
- optional thickness and corner radius;
- measured stable hinge range;
- free-form notes;
- derived dimensions, repeatability, and uncertainty.

## Statistics

For each edge position, the profile derives:

```text
sample mean
sample standard deviation
standard error of the mean
approximate two-sided 95% t interval half-width
estimated expanded uncertainty (coverage factor k = 2)
```

The expanded estimate combines repeatability standard error and instrument quantization modeled as a rectangular distribution:

```text
u_quantization = resolution / √12
u_combined = √(u_repeatability² + u_quantization²)
U_estimated = 2 × u_combined
```

## Confidence tier

The existing product rule remains intentionally simple:

```text
at least 3 complete samples
and maximum relative edge repeatability ≤ 1%
→ calibrated

otherwise
→ measured
```

This is a MagnaMath evidence tier, not ISO/IEC 17025 accreditation or a metrological traceability claim.

## Exclusions

The current uncertainty value does not include:

- systematic instrument bias;
- jaw alignment and contact-force effects;
- operator-to-operator variability;
- temperature expansion;
- within-set or lot-to-lot population sampling;
- manufacturer process drift;
- connector-center or effective hinge-axis uncertainty.

The UI and exported profile carry this caveat alongside the number.

## Round-trip behavior

Session collections can be exported and imported independently. On import, MagnaMath validates sample structure, merges sessions by ID, and can regenerate derived profile overrides against the current base profile. Snapshot v3 may embed both the raw session and the derived profile for reproducibility.
