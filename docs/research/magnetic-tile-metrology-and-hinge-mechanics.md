2026-08-10

# Physical Geometry and Hinge Mechanics of Magnetic Construction Tiles

## Executive decision summary

**TL;DR**

MAGNA-TILES publishes far less metrological geometry than a simulation-quality model needs. The strongest current dimensional evidence is an official MAGNA-TILES diagram giving the standard square as **74.93 mm / 2.95 in** and the microMAGS square as **37.465 mm / 1.475 in**; those values establish an exact nominal 2:1 linear relationship **for the square dimensions shown**, but no manufacturer tolerance is supplied. citeturn20view3

The general MAGNA-TILES FAQ says each piece has a “3-inch base measurement,” but that statement is both rounded relative to the 2.95-in square annotation and plainly not universal because microMAGS is 1.475 in. MagnaMath should therefore treat the FAQ value as **approximate standard-family marketing geometry**, not a drawing dimension or tolerance. citeturn20view2turn20view3

The manufacturer confirms current pieces use **MABS shells, ceramic/ferrite magnets, rivets, and a crisscross lattice**, but does not publish shell thickness, tile thickness, corner radius, magnet dimensions, magnet mobility, magnet-center coordinates, hinge clearance, dimensional tolerance, magnetic force, or hinge torque. Those are measurement-required parameters. citeturn20view2

The seeded US9636600B2 patent is useful engineering prior art but **must not be mapped onto MAGNA-TILES internals**. Its principal embodiments use bonded/plastic magnets and include a 7.5 cm prototype with thin facings, whereas MAGNA-TILES currently identifies its magnets as ceramic ferrite. Its discussion of angle-dependent attraction, magnet-cover separation, edge interference and pull-force testing is nevertheless highly relevant to experimental design. citeturn21view0turn21view1turn20view2

For MagnaMath, the recommended production model is **finite-thickness rigid tiles plus empirical, breakable revolute edge constraints**, not magnetic finite-element analysis and not an ideal zero-thickness pin hinge. Geometry should be deterministic from measured profiles; hinge strength should be represented by experimentally measured angle-dependent moment/force envelopes with optional hysteresis.

**Decision table**

| Decision | Recommendation | Evidence status |
|---|---|---|
| Standard square nominal edge | Ship as `74.93 mm`, explicitly labeled manufacturer nominal, tolerance unknown | **Official exact annotation** citeturn20view3 |
| microMAGS square nominal edge | Ship as `37.465 mm`, manufacturer nominal, tolerance unknown | **Official exact annotation** citeturn20view3 |
| Square scale ratio | Ship `2.000:1` standard:micro **for the annotated square dimensions** | **Derived exactly from official values** citeturn20view3 |
| Standard square nominal diagonal | Ship `105.967 mm` as mathematically derived nominal, not as-built measurement | **Derived** from 74.93 mm citeturn20view3 |
| micro square nominal diagonal | Ship `52.984 mm` as derived nominal | **Derived** from 37.465 mm citeturn20view3 |
| Triangle, rectangle, large-square exact geometry | Do not ship as exact physical dimensions yet | **Measurement required** |
| Thickness, corner radius, connector location | Do not invent | **Measurement required** |
| Hinge angle/torque/detachment values | Do not invent | **Measurement required** |
| Magnet composition | Ceramic/ferrite | **Official** citeturn20view2 |
| Magnet shape or ability to rotate | Unknown for current retail pieces | **Not manufacturer-published** |
| US9636600B2 construction attributed to MAGNA-TILES | Never | Patent is an unrelated patent embodiment; important aspects conflict with current manufacturer material description. citeturn20view0turn21view0turn20view2 |
| Browser mechanics | Rigid prism + empirical magnetic hinge/break constraint | **Engineering recommendation** based on needed observables and patent evidence that attraction changes with angle. citeturn21view2 |

A critical data-management rule follows from this: **nominal design geometry, measured as-built geometry, and population variation must be three different concepts in MagnaMath's data model**. An official nominal value without a tolerance is not evidence that every retail specimen has that dimension, and a household mean is not a manufacturer's tolerance.

## Evidence base, source table, and piece taxonomy

The current manufacturer explicitly says MAGNA-TILES are made from MABS, use ceramic/ferrite magnets, incorporate rivets and a crisscross lattice, are manufactured through partners in Indonesia, China, India and the Philippines, and that all MAGNA-TILES sets are compatible. It also says the same premium MABS material has been used since 1997. citeturn20view2 Current SKU pages show that actual country of origin varies by product: for example, microMAGS 70 is listed as China, while the core Classic sets include China/Indonesia and Philippines production depending on SKU. citeturn20view3turn1search0turn1search1turn1search2 This establishes a strong reason to stratify physical metrology by SKU, lot and country of origin; it does **not** establish that those strata have different dimensions.

The brand's own history places its U.S. story in 1997 with Rudy Valenta introducing tiles at educational trade shows. citeturn18search0 A 2015 interview reported that translucent variants were introduced in 2002, which establishes a historically relevant visual/material-product generation but does not demonstrate a dimensional change. citeturn18search7 An independent old/new-style comparison also documents a visible rivet-era distinction; because that is community evidence rather than a manufacturer engineering record, it should be used only as a lead when creating historical sampling strata. citeturn18search6

**Primary and standards evidence inventory**

| Source | Date/status | What it establishes | URL / DOI |
|---|---|---|---|
| MAGNA-TILES FAQ | Live page accessed 2026-08-10 | MABS, ceramic/ferrite magnets, rivets/lattice, global manufacturing locations, compatibility, rounded “3-inch base” claim, damaged-piece guidance | https://magnatiles.com/pages/faq citeturn20view2 |
| microMAGS 70 | Live page accessed 2026-08-10 | Explicit diagram: micro square 37.465 mm / 1.475 in vs standard square 74.93 mm / 2.95 in; SKU 244070MM; China; core micro inventory | https://magnatiles.com/products/micromags-70-piece-set citeturn20view3 |
| Classic 37 | Live page accessed 2026-08-10 | Core standard taxonomy and counts; item 14837; China/Indonesia | https://magnatiles.com/products/magna-tiles-classic-37-piece-set citeturn1search0 |
| Classic 74 | Live page accessed 2026-08-10 | Core taxonomy/counts; item 14874; China/Indonesia | https://magnatiles.com/products/magna-tiles-classic-74-piece-set citeturn1search1 |
| Classic 100 | Live page accessed 2026-08-10 | Core taxonomy/counts; item 4300; Philippines | https://magnatiles.com/products/magna-tiles-classic-100-piece-set citeturn1search2turn18search24 |
| Combo 46 | Live page accessed 2026-08-10 | Standard and micro pieces intentionally combined; item 244046COM; China/Indonesia | https://magnatiles.com/products/combo-46-piece-set citeturn1search3 |
| Builder XL 50 | Live page accessed 2026-08-10 | Confirms a current XL geometric family including XL square/equilateral/right-triangle pieces | https://magnatiles.com/products/builder-xl-50-piece-set citeturn14search11 |
| Police Station 35 | Live page accessed 2026-08-10 | Confirms current rectangle and Large Rectangle pieces; Philippines | https://magnatiles.com/products/police-station-35-piece-set citeturn19search4 |
| Space 32 | Live page accessed 2026-08-10 | Current Large Rectangle plus standard and micro pieces; China | https://magnatiles.com/products/space-32-piece-set citeturn19search2 |
| MAGNA-TILES Our Story | Live page accessed 2026-08-10 | Official 1997 brand-history anchor | https://magnatiles.com/pages/our-story citeturn18search0 |
| US9636600B2 | Filed 2013-02-14; granted 2017-05-02 | Generic magnetic-tile embodiments, prototype geometry and force data, shell/magnet-spacing discussion, angle-dependent attraction | https://patents.google.com/patent/US9636600B2/en citeturn20view0turn21view0turn21view2 |
| US7154363B2 | Priority 2004-12-23; granted 2006-12-26 | Generic rotating cylindrical edge-magnet/pocket mechanism | https://patents.google.com/patent/US7154363B2/en citeturn20view1turn21view8 |
| ISO 13385-1:2019 | Published 2019; confirmed 2025/current | Calliper design and metrological characteristics | https://www.iso.org/standard/71149.html citeturn22view3 |
| ISO 1:2022 | Published 2022 | Standard reference temperature for dimensional/geometrical specifications | https://www.iso.org/standard/80702.html citeturn15search16 |
| JCGM 100 / GUM | 2008; 2026 nonlinearity amendment available | Measurement-uncertainty framework | https://www.bipm.org/en/committees/jc/jcgm/publications ; DOI 10.59161/JCGM100-2008E citeturn20view7 |
| JCGM 101 | 2008 | Monte Carlo propagation of uncertainty distributions | DOI 10.59161/JCGM101-2008 citeturn20view7 |
| ASTM E4-24 | Active; updated 2024-09-24 | SI-traceable calibration/verification of static and quasi-static testing machines | https://store.astm.org/e0004-24.html ; DOI 10.1520/E0004-24 citeturn15search21 |
| ASTM E74-18(2026) | Active 2026 | Calibration of static force-measuring instruments | https://store.astm.org/e0074-18r26.html citeturn20view5 |
| 16 CFR Part 1250 | Current 2026 | U.S. toy standard incorporates applicable ASTM F963-23 provisions | https://www.ecfr.gov/current/title-16/chapter-II/subchapter-B/part-1250 citeturn22view4 |
| NIST TN 1297 | Page updated 2026-06-03 | Expanded uncertainty convention; NIST normally reports \(U=k u_c\) with \(k=2\) | https://www.nist.gov/pml/nist-technical-note-1297/nist-tn-1297-6-expanded-uncertainty citeturn22view5 |

**Current core inventories**

| Set | Square | Large square | Equilateral | Right triangle | Isosceles | Other relevant facts |
|---|---:|---:|---:|---:|---:|---|
| Classic 37 | 18 | 2 | 7 | 6 | 4 | China or Indonesia; item 14837. citeturn1search0 |
| Classic 74 | 40 | 6 | 14 | 6 | 8 | China or Indonesia; item 14874. citeturn1search1 |
| Classic 100 | 50 | 4 | 20 | 11 | 15 | Philippines; item 4300. citeturn1search2 |
| microMAGS 70 | 40 micro | — | 14 micro | 6 micro | 8 micro | Also 2 Large Rectangles; China; item 244070MM. citeturn20view3 |
| Combo 46 | 8 standard + 8 micro | — | 6 standard + 6 micro | 2 standard + 4 micro | 4 standard + 8 micro | Designed to combine both scales. citeturn1search3 |

The line has expanded beyond this classic taxonomy. Current official products contain ordinary rectangles, Large Rectangles, XL geometric pieces, micro cubes, quarter-circle-style pieces and numerous specialized components. citeturn19search4turn19search2turn14search11turn14search17 For MagnaMath's first defensible geometry library, the scope should remain **Classic square / large square / equilateral / right / tall isosceles, rectangle/Large Rectangle, and their micro equivalents**, followed by XL as a separate phase.

**Known dimensional state**

| Piece/measurand | Value | Evidence classification | MagnaMath treatment |
|---|---:|---|---|
| Standard square edge | **74.93 mm** | Manufacturer-published annotated diagram. No tolerance. citeturn20view3 | Ship as nominal |
| Standard square diagonal | **105.967 mm** | Derived \(74.93\sqrt2\). citeturn20view3 | Ship as `derived_nominal` |
| micro square edge | **37.465 mm** | Manufacturer-published annotated diagram. No tolerance. citeturn20view3 | Ship as nominal |
| micro square diagonal | **52.984 mm** | Derived \(37.465\sqrt2\). citeturn20view3 | Ship as `derived_nominal` |
| Standard:micro square ratio | **2.000000** | Directly derived from two official values. citeturn20view3 | Ship, square-specific |
| Generic standard “base” | ~3 in / 76.2 mm | FAQ marketing/general statement. citeturn20view2 | Do not use over explicit 74.93-mm annotation |
| Equilateral standard height, **if** physical edge = 74.93 mm | 64.891 mm | Conditional geometry \(L\sqrt3/2\) | Do not classify as physical measurement |
| Equilateral micro height, **if** edge = 37.465 mm | 32.446 mm | Conditional geometry | Do not classify as physical measurement |
| Large square side | Unknown | No explicit manufacturer dimension found | Measure |
| Rectangle / Large Rectangle sides | Unknown | Official piece names only | Measure |
| Standard right-triangle legs/hypotenuse | Unknown | Shape name alone insufficient | Measure |
| Standard tall-isosceles base/equal sides/height | Unknown | Shape name alone insufficient | Measure |
| micro triangle edge vectors | Unknown | “75% smaller” is not sufficient for exact linear dimensions | Measure |
| XL geometry | Unknown | Current family exists, but no explicit dimensions located | Measure |
| Overall thickness | Unknown | No current manufacturer engineering value found | Measure |
| Corner radii | Unknown | No current manufacturer value found | Measure |
| Connector/magnet centers | Unknown | No current manufacturer coordinate data found | Measure |
| Hinge gap/effective axis | Unknown | No current manufacturer value found | Measure |
| Mass per geometric tile | Unknown as a published piece specification | Product pages give package/set weights, not individual geometric-tile masses. citeturn20view3 | Measure |

The “75% smaller” microMAGS phrase should be handled carefully. The explicit square sizes show the micro square has half the standard square's side and therefore one-quarter its planar area; it is consequently **75% smaller in area**, not 75% smaller in linear dimension. The manufacturer page uses the marketing phrase alongside the exact size diagram, so MagnaMath should store the actual dimensions rather than converting “75% smaller” into a scaling formula. citeturn20view3

**Generation and lot risk.** The present evidence supports four stratification dimensions: product family/SKU, country of manufacture, purchase lot/date, and visible construction generation. Current MAGNA-TILES production spans several countries, the Classic SKUs themselves are not all made in the same country, and the brand has existed since 1997. citeturn20view2turn18search0turn1search0turn1search2 What the evidence **does not** establish is whether any of those strata have intentionally different edge dimensions, magnet spacing or hinge behavior. That question must be answered experimentally.

## Patent evidence and mechanical interpretation

The patent record is most useful for identifying **mechanisms worth measuring**, not for reverse-engineering current MAGNA-TILES by assumption.

**Patent-to-product claim matrix**

| Patent disclosure | What the patent actually supports | Relationship to current MAGNA-TILES | Permitted use in MagnaMath research |
|---|---|---|---|
| US9636600B2 prototype: 7.5 × 7.5 cm square, 2-mm pulp-board core, 0.08-mm vinyl facing, plastic magnets with 2.3 × 3.0-mm cross-section and 2.5-cm length | A specific disclosed/tested prototype; patent reports about 10-g mass and approximately 85 gram-force parallel / 70 gram-force perpendicular pull for that prototype. citeturn21view0 | **Not evidence of MAGNA-TILES dimensions or construction.** Current MAGNA-TILES states ceramic/ferrite magnets and MABS. citeturn20view2 | Experimental-design precedent only |
| US9636600B2 prior-art discussion of molded tiles with ceramic ferrite magnets, approximately 6.4-mm thickness and ~30-g mass | Patent author's characterization of prior art. citeturn21view0 | Not identified as a current MAGNA-TILES specification | Never import as MAGNA-TILES value |
| US9636600B2 statement that practical rigid-plastic wall thickness may be ~0.4–0.6 mm with strong magnets | General design discussion in the patent. citeturn21view1 | Does not prove current shell-wall thickness | Use only to motivate shell-separation sensitivity |
| US9636600B2 force-vs-angle tests | Patent reports angle-dependent attraction and comparatively stable forces for some plastic-magnet geometries from 45°–135°; some claims cover less than a factor-of-two variation from 45°–180°. citeturn21view2 | Mechanism is not demonstrated for current MAGNA-TILES | Strong justification for measuring hinge strength as \(F(\theta)\) or \(M(\theta)\), not one scalar |
| US9636600B2 edge interference discussion | Patent expressly notes that if core thickness exceeds magnet thickness, interference at different tile angles must be considered. citeturn21view3 | General geometry applies conceptually to finite-thickness tiles | Supports measuring thickness, edge profile and minimum angle |
| US9636600B2 clamshell embodiment | Cavities can retain/locate magnets; clamshell can use separate halves or a one-piece hinged shell. citeturn21view3 | Not evidence MAGNA-TILES uses that construction | Generic retention-design prior art |
| US7154363B2 | Describes longitudinal cylindrical magnets rotatably retained in edge pockets; opposite poles occupy diametric halves and magnets can rotate to orient for attraction. citeturn21view7turn21view8 | No current MAGNA-TILES manufacturer source located that specifies cylindrical or freely rotating magnets | Treat as a **hypothesis-generating mechanism**, not a product claim |
| Current manufacturer evidence | Ceramic/ferrite magnets; MABS, rivets and internal lattice. citeturn20view2 | Direct evidence about current branded product, but not about hidden magnet geometry/motion | Highest-priority product evidence |

This distinction matters because the dominant mechanical behavior of an edge connection is not determined by magnet material alone. The seeded patent demonstrates that attraction can change materially with relative angle, magnet cross section, covering thickness and separation geometry. citeturn21view1turn21view2 In an actual retail tile, shell-edge geometry, internal clearances, magnet motion if any, friction, shell deflection and multiple magnets along one edge can all contribute to what a user perceives as a “hinge.”

Accordingly, MagnaMath should define a **magnetic hinge operationally**, rather than internally:

> Two connected tile edges form a magnetic hinge when they remain magnetically engaged while permitting relative rotation over a measurable angular interval.

That definition is observable without opening a tile. It makes no assumption about whether an internal magnet rotates, translates, is fixed, or combines those motions.

The seed patent's angle convention is convenient and should be adopted: **180° = tiles coplanar and extended edge-to-edge; 90° = orthogonal; 0° = faces folded together.** The patent uses these configurations explicitly in its figures and force discussion. citeturn21view2 Standardizing this convention avoids one of the easiest sources of incompatible hinge datasets.

Three separate mechanical effects should then be measured:

1. **Kinematics:** what angles are physically reachable without shell interference or loss of magnetic engagement?
2. **Quasi-static resistance:** what external force/moment is required to initiate rotation, sliding or separation at a given angle?
3. **State transitions:** does the pair drift smoothly, remain metastable, snap to another angle, or detach?

The distinction is essential. A magnetic tile pair is unlikely to behave like a simple linear torsion spring over its full range; the patent evidence alone demonstrates a nonlinear relationship between relative angle and magnetic attraction. citeturn21view2

## Experimental metrology and hinge protocol

This is the recommended **MagnaMath Metrology Protocol v1.0**. It is deliberately non-destructive: do not cut, drill, pry, solvent-open, heat, or deliberately break specimens. MAGNA-TILES itself advises users to inspect pieces for damage and not allow damaged pieces to remain in play, and identifies magnets as an ingestion hazard if released. citeturn20view2 U.S. toys are currently subject to applicable ASTM F963-23 requirements through 16 CFR Part 1250; this research protocol is **not** a substitute for regulatory toy-safety testing or certification. citeturn22view4

**Equipment tiers**

| Capability | Budget bench | Prosumer / recommended MagnaMath bench | Laboratory / validation |
|---|---|---|---|
| Linear dimensions | 150-mm digital calliper, 0.01-mm resolution, stated accuracy ≤0.03 mm | Quality 150-mm calliper with traceable calibration; low-force micrometer for thickness cross-check | Vision measuring system / optical comparator / CMM with low-force probing |
| Dimensional references | Certified 25/50/75 or 100-mm length standards or gauge blocks | Traceable gauge-block set | Accredited calibrated gauge blocks |
| Radius/profile | Calibrated macro photograph + image fitting | Vision camera/copy stand with calibrated in-plane scale; radius gauges as cross-check | Optical comparator / vision metrology |
| Flatness/warpage | Reference glass/granite surface + feelers | Surface plate + dial/height indicator | CMM or optical surface measurement |
| Force | Calibrated small load cell or 0–20 N digital force gauge | 0–20 N gauge/load cell on linear test stand | Low-capacity calibrated load cell/test frame compliant with laboratory force practice |
| Torque | Force × measured lever arm | Dedicated low-range torque transducer or calibrated force gauge/lever fixture | Traceable torque transducer |
| Angle | Digital inclinometer ~0.1° + mechanical fixture | Rotary stage/encoder ≤0.05° | Calibrated rotary encoder/indexing stage |
| Mass | 0.01-g balance preferred | Calibrated 0.001–0.01-g balance | Laboratory analytical/top-loading balance |
| Environment | Temperature/RH logger | Calibrated T/RH logger | Controlled metrology room |
| Imaging | Smartphone/camera on rigid stand | Interchangeable-lens camera + macro/telecentric-style setup | Machine vision |
| Fixture | 3D-printed alignment blocks, dowel pins, bearings | Machined datum plate plus replaceable printed nests | Precision-machined fixtures |
| Safety | Eye protection + transparent shield | Same, with test-stand travel stops | Guarded instrument/test cell |

ISO 13385-1:2019 is the appropriate reference framework for calliper metrological characteristics and was confirmed current in 2025. citeturn22view3 For force systems, ASTM E4-24 addresses calibration/verification of static or quasi-static testing machines, while ASTM E74-18(2026) addresses calibration of force-measuring instruments. citeturn15search21turn20view5

A practical budget bench can be assembled without buying a CMM. The first dollars should go to **traceable dimensional references, a good calliper, a low-range force sensor, an angle encoder, and reproducible fixtures** rather than to unusually high display resolution. Registration error and specimen variability will likely exceed a cheap instrument's least significant digit.

**Coordinate system and measurement landmarks**

Rounded corners make “corner-to-corner” jaw measurements ambiguous. Define **virtual vertices** by extrapolating the straight edge segments rather than treating the rounded physical tip as a vertex.

```text
Square / rectangle, top view

          straight fitted edge e0
      V0 ------------------------- V1
       |                           |
       |      Cavity / magnet      |
   e3  |      K0 •                 | e1
       |                           |
       |            O              |
       |                           |
      V3 ------------------------- V2
          straight fitted edge e2

V0..V3 = virtual vertices: intersections of fitted straight edge lines
O       = polygon centroid
Mi      = midpoint of edge ei
Ki,j    = connector/cavity/effective-magnetic center j on edge i

DO NOT use the rounded physical corner tip as V.
Exclude the corner-radius transition from each straight-line fit.
```

```text
Triangle, top view

                      V0
                      /\
                     /  \
              e2    /    \    e0
                   /      \
                  /        \
                 /          \
                /            \
              V2--------------V1
                      e1

Edge length = distance between corresponding virtual vertices.
Altitude/angles are computed from the fitted vertex coordinates,
not inferred from the marketing shape name.
```

For connector positions use an edge-local coordinate:

\[
s=0\text{ at }V_i,\qquad s=L_e\text{ at }V_{i+1},\qquad
\lambda=s/L_e
\]

Storing the normalized coordinate \(\lambda\) as well as millimeters makes standard/micro comparisons much easier.

```text
Hinge cross-section

 θ = 180°                    θ = 90°

 Tile A   Tile B                 Tile B
========|========                  ||
        ^                          ||
  effective hinge                 ||
  / contact axis             =====||  Tile A
                              ^ gap/edge-contact region

Report:
θ              relative included angle
g(θ)           minimum shell-to-shell clearance
a_eff(θ)       fitted/effective hinge-axis position
F_break(θ)     separation-force envelope
M_hold(θ)      moment at onset of rotation/slip
```

**Dimensional measurands**

Every specimen receives an ID before measurement and is photographed front, back and on at least one edge. For translucent parts, add backlit views to document internal pocket locations. The core measurements are:

| Measurand | Method |
|---|---|
| Edge vectors / virtual vertices | Calibrated top-down image or optical system; fit each straight edge excluding rounded endpoints, intersect adjacent fitted lines |
| Parallel width/height | Calliper cross-check at three positions; keep jaws on straight flanks |
| Diagonal | Derived from fitted vertices; direct calliper measurement only as a secondary check |
| Corner radius | Circular/arc fit to calibrated image; record all corners independently |
| Overall thickness | Minimum-force measurement at center plus predefined face/edge positions |
| Thickness map | Center + four quadrants + one position adjacent to each edge, avoiding raised logos/rivets unless measuring maximum envelope |
| Warpage | Maximum departure from datum plane after natural resting placement, with no flattening load |
| Pocket/visible connector center | Image-based cavity centroid where visible |
| Effective magnetic center | Optional low-height Hall-field scan along edge; distinguish this from pocket geometry |
| Mass | Individual piece, dry, conditioned |
| Edge-gap/hinge clearance | Calibrated imaging or feeler/optical measurement at fixed θ |
| Rivet position | Image coordinate where present; potentially useful as a generation/mold fingerprint |

For calliper measurements, close the jaws only to stable contact. Do not use hand squeeze as an uncontrolled clamping fixture. If a thickness changes systematically with operator force, the measurand must be repeated with a low-force technique and a `contact_force_sensitive=true` flag.

**Repeat structure**

The minimum accepted session is exactly aligned with the requested design:

- **at least five intact pieces of each type where feasible**;
- **at least three independent readings of every dimension per piece**;
- fully remove and reposition the piece between repeats;
- reverse or rotate the piece between readings where the measurand permits, to expose jaw/alignment bias;
- do not average multiple display readings taken without reseating and call them independent repeats.

For image-derived geometry, acquire three independent placements/images rather than fitting the same photograph three times.

**Tool calibration**

Callipers should be cleaned, zeroed and checked at zero plus at least three points spanning the relevant range—e.g. approximately 25, 50 and 100 mm for Classic work and a longer reference for Large/XL pieces. Record both **as-found** and **as-left** checks. ISO 13385-1 covers the relevant metrological characteristics of callipers. citeturn22view3

The dimensional station should use **20 °C as its reference temperature**, consistent with ISO 1:2022, while practical testing may be conducted at 20 ± 2 °C if every session records actual temperature. citeturn15search16 Do not numerically thermal-correct MABS geometry until MagnaMath has a validated material-specific coefficient or an empirical temperature study.

Force instruments should be zeroed in test orientation and verified at several points through the working range using a traceable reference. ASTM E74-18(2026) specifically addresses static force-measuring instrument calibration; ASTM E4-24 addresses force verification of testing machines. citeturn20view5turn15search21 A budget dead-weight verification may use calibrated masses, but the local gravitational acceleration and pulley/friction effects must enter the uncertainty model if the fixture converts weight into horizontal force.

Angle sensors should be checked at 0° and 90° with reversal. Printed fixtures should **never be assumed to equal their CAD dimensions**: measure the final fixture, record printer/material/orientation, and use metal dowel pins or machined datums for critical pivot and lever-arm locations.

**Environmental controls**

Condition specimens dry at **20 ± 2 °C and 40–60% RH for at least 12 h** before a reference session; this is a proposed reproducibility condition, not a manufacturer requirement. Keep the temperature variation within a session below 1 °C when practical. MAGNA-TILES states that pieces are not waterproof and should not be submerged, so no wet-conditioning step belongs in baseline metrology. citeturn20view2

Record temperature, RH, conditioning duration, time since unpacking, visible contamination, cleaning method, piece age if known and whether the piece came from active household use.

**Hinge-angle sweep**

Use matched edge types first: standard-square to standard-square, micro-square to micro-square, and then mixed standard/micro interfaces.

Clamp Tile A by its central field without crushing an edge. Tile B attaches to the test edge. Its support arm pivots approximately around the observed magnetic joint while imposing minimal parasitic load.

The standard test sequence is:

1. Separate pieces completely and leave them apart for at least five seconds.
2. Reconnect in the prescribed orientation at 180°.
3. Perform three conditioning sweeps.
4. Record five sweeps from 180° toward the minimum reachable angle and five back toward 180°.
5. Use 5° angular increments for baseline characterization and 1° increments within ±10° of any snap, detachment or high-curvature transition.
6. Use a quasi-static sweep rate of approximately 1–2°/s and a two-second dwell at each requested stationary point.
7. Record force, angle and time synchronously.
8. Repeat on at least five independent hinge pairs.

A pair is classified as **freely stable** at a commanded angle when, after removing the positioning support, it remains attached and changes by no more than 2° over 10 s. The 2°/10-s threshold is a MagnaMath protocol definition, not a manufacturer specification.

Measure loading and unloading separately. Any difference is hysteresis and should not be averaged away.

**Holding moment and angular stiffness**

At target angle \(\theta\), apply a tangential force at a precisely measured lever arm \(r\) from the effective hinge axis. With tangential loading,

\[
M=F r
\]

and in the general case,

\[
M=F r\sin\phi
\]

where \(\phi\) is the angle between the force vector and lever arm.

Define `holding_moment` as the moment at the first of:

- sustained rotation exceeding 2°;
- edge translation exceeding the registration threshold;
- snap-through;
- detachment.

Where a genuinely elastic-looking region exists, estimate angular stiffness as

\[
k_\theta=\frac{dM}{d\theta}
\]

with \(\theta\) expressed in radians. Fit loading and unloading branches separately. Do **not** force a spring constant onto a plateau or friction-like region.

**Detachment testing**

Detachment is mode-dependent, so a single “magnet strength” value is insufficient. Measure at least:

| Mode | Configuration | Output |
|---|---|---|
| Coplanar edge pull | θ = 180°, tiles pulled away normal to common edge while remaining in-plane | \(F_\mathrm{edge-pull}\) |
| Edge-parallel shear | θ = 180°, relative translation parallel to seam | \(F_\mathrm{shear}\) |
| Peel / rotational separation | Force at known lever arm tending to open one tile | \(M_\mathrm{peel}\) |
| Orthogonal retention | θ = 90°, separation under controlled direction | \(F_\mathrm{90}\), optionally \(M_\mathrm{90}\) |
| Angle sweep | Multiple θ values | \(F_\mathrm{break}(\theta)\), \(M_\mathrm{break}(\theta)\) |

Use a slow crosshead speed such as 5 mm/min for baseline comparison and stop immediately at the first complete joint release. Dynamic impact testing is outside v1 scope; ASTM E74 itself distinguishes static force calibration from dynamic/high-speed applications. citeturn20view5

There is no manufacturer-published load in the sources that justifies declaring a universal “safe test force” in newtons. The defensible safety limit is therefore **event- and travel-based**. The fixture must not bend a tile as a surrogate for pulling its magnetic interface. Set the test stand to stop on first joint-release force drop, fixture travel limit, audible cracking, stress whitening, rivet displacement, or other permanent change. A specimen showing permanent dimensional change greater than its pre-test expanded uncertainty—or obvious visual damage—is removed from the nominal cohort. The manufacturer itself says damaged tiles should not remain in use. citeturn20view2

For automated tests, use a hard force limit set no higher than **125% of the largest previous clean detachment peak observed in the pilot cohort** and update it only after inspection confirms the previous specimens were undamaged. This is an equipment-protection rule, not a representation of product load capacity.

**Snap-through**

Use synchronized angle/force logging and preferably ≥120-fps video. Store the raw time series. For automated event tagging, MagnaMath can provisionally define snap-through as either an angular jump >5° occurring faster than the commanded fixture motion or a ≥20% force/moment drop accompanied by a new stable angular state. Store the raw event regardless; those thresholds can later be versioned.

## Sampling, uncertainty, and confidence model

A household profile and a product-population profile answer different questions and must never be conflated.

**Household calibration.** Measure five pieces per type when available, preferably sourced from more than one owned set, with at least three reseated readings per measurand. This gives a useful user-specific geometry and reveals obvious mixed-generation collections, but it does not estimate manufacturing-lot variance well.

**Product-level baseline.** Use at least **three independent purchase lots × five pieces/type = 15 pieces per type per manufacturing stratum**. A “stratum” means a materially relevant combination such as standard Classic vs microMAGS, country of origin, and visibly distinct construction generation. Because current product pages list multiple countries across the range and China/Indonesia alternatives for some Classic SKUs, country and lot should be captured rather than silently pooled. citeturn20view2turn1search0turn1search1turn1search2

Fifteen specimens is a **baseline characterization sample, not a universal tolerance-certification sample**. For parameters that become critical to collision/closure behavior, the preferred validation target is **five lots × ten pieces/type = 50 pieces per important manufacturing stratum**. Sampling should be precision-driven after the pilot:

\[
n_\mathrm{eff}\approx
\left(\frac{t_{0.975}\,s}{h}\right)^2
\]

where \(s\) is pilot piece-to-piece standard deviation and \(h\) is the desired 95% confidence-interval half-width. When multiple pieces from one set or lot are correlated, inflate nominal sample size for clustering rather than pretending every tile is an independent manufacturing draw.

A useful mixed-effects model is

\[
y_{o,l,s,p,r}
=
\mu+\beta_o+\beta_\mathrm{family}
+u_l+u_s+u_p+\epsilon_r
\]

where:

- \(\beta_o\) represents observed origin/generation effects;
- \(u_l\) is random lot effect;
- \(u_s\) is random set effect;
- \(u_p\) is piece-to-piece variation;
- \(\epsilon_r\) is repeated-measurement error.

This directly separates repeatability from genuine piece variation and avoids treating three measurements of one tile as three tiles.

**Uncertainty budget**

JCGM 100/GUM is the appropriate general framework, while JCGM 101 supplies a Monte Carlo route when the measurement model is nonlinear. The JCGM publications page now also lists a 2026 GUM amendment specifically concerning nonlinearity in measurement models. citeturn20view7

For a simple length mean:

\[
u_c^2 =
u_\mathrm{cal}^2+
u_\mathrm{res}^2+
u_\mathrm{zero}^2+
u_\mathrm{repeat}^2+
u_\mathrm{registration}^2+
u_\mathrm{contact}^2+
u_\mathrm{temp}^2+
u_\mathrm{method}^2
\]

where the terms have the following operational interpretation:

| Component | Estimate |
|---|---|
| Calibration/reference | From calibration certificate/reference uncertainty |
| Digital resolution | For rounding interval \(q\), use \(q/\sqrt{12}\) when a rectangular rounding distribution is appropriate |
| Zero/drift | Repeated before/after zero checks |
| Repeatability | Standard deviation of reseated measurements divided by \(\sqrt r\) for the mean of \(r\) repeats |
| Registration | Repeated removal/repositioning and, preferably, operator study |
| Contact force/flex | Difference/variance between controlled-light-force measurements or between contact and optical methods |
| Temperature | Empirical/validated correction uncertainty; otherwise control and record rather than inventing a coefficient |
| Method | Differences such as optical virtual-vertex fit vs direct jaw span |

The registration term is particularly important for rounded translucent toys: a 0.01-mm calliper display does not imply a 0.01-mm measurement if the operator is uncertain where the straight edge ends.

For reported results, use

\[
U=k\,u_c
\]

and normally report \(k=2\), while stating that the approximate coverage interpretation depends on the underlying distributions and degrees of freedom. NIST's current TN 1297 policy likewise uses \(k=2\) by convention for expanded uncertainty and explicitly notes that the mapping between \(k\) and a precise confidence level is not universally exact. citeturn22view5

**Derived dimensions**

For a nominal square edge \(L\),

\[
d=\sqrt2\,L
\]

so, if \(L\) is the only uncertain input,

\[
u(d)=\sqrt2\,u(L)
\]

For an equilateral triangle,

\[
h=\frac{\sqrt3}{2}L,
\qquad
u(h)=\frac{\sqrt3}{2}u(L)
\]

If vertex coordinates come from a common image fit, they are correlated; use the covariance matrix or Monte Carlo propagation rather than treating all coordinates as independent. JCGM 101 explicitly covers propagation of distributions using Monte Carlo methods. citeturn20view7

For torque,

\[
M=Fr\sin\phi
\]

and an independent-input first-order model gives

\[
u^2(M)=
(r\sin\phi)^2u^2(F)
+(F\sin\phi)^2u^2(r)
+(Fr\cos\phi)^2u^2(\phi)
\]

with radians used for \(u(\phi)\). For near-zero angles, event thresholds and nonlinear geometry can make linearized propagation poor; Monte Carlo is preferable. citeturn20view7

**Never combine measurement uncertainty and product variation into one ambiguous ± number.** A profile should separately report:

\[
\bar x,\quad
s_\mathrm{piece},\quad
s_\mathrm{lot},\quad
u_c,\quad
U_{k=2}
\]

That lets MagnaMath decide whether it needs the mean shape, a randomly sampled physical piece, or worst-case closure bounds.

**Outliers and damaged pieces**

Do not delete statistical outliers merely because they make the distribution untidy. The sequence is:

`flag → inspect → remeasure → identify assignable cause → classify`.

A piece that is cracked, visibly warped, water-damaged, heat-damaged, stress-whitened, has a shifted rivet, or shows evidence of opened seams belongs in a **damage cohort**, not the nominal calibration cohort. MAGNA-TILES itself advises regular inspection and removal of damaged pieces from play. citeturn20view2

An intact specimen that remains extreme after remeasurement remains part of the product-variation dataset unless a documented measurement failure explains it.

**Evidence and confidence tiers**

Keep `provenance_class` separate from `confidence_tier`:

| Tier | Rule |
|---|---|
| **A — source-direct / validated population** | Explicit manufacturer statement used only within its stated scope, **or** calibrated multi-lot empirical result meeting the project's predetermined uncertainty/precision criterion |
| **B — controlled empirical / exact derivation** | ≥3 lots ×5 pieces with quantified uncertainty but incomplete stratum coverage; or exact mathematical derivation from a Tier-A nominal, explicitly labeled nominal |
| **C — local calibration** | ≥5 pieces/type, ≥3 repeats, calibrated tools, one household or limited lot coverage |
| **D — lead / hypothesis** | Patent analogy, reseller/community measurement, marketing-image estimate, assumed geometric family relationship |
| **X — unsupported** | No defensible provenance; not eligible for production defaults |

An official nominal edge length can therefore be Tier A for the claim **“the manufacturer publishes this nominal dimension”** but cannot be used to claim a ± tolerance the manufacturer did not publish.

## Browser simulation parameters and reference-build fixtures

The simulation should be designed around the observables that control three outcomes: **collision**, **geometric closure**, and **static stability**.

**Parameter priority**

| Parameter | Collision | Closure | Stability | Recommendation |
|---|---:|---:|---:|---|
| Vertex/edge geometry | Critical | Critical | Moderate | Measure/official nominal |
| Tile thickness | Critical | Critical | Moderate | Measure |
| Corner radius/profile | High near vertices | High in multi-tile junctions | Low | Measure |
| Effective hinge axis / edge clearance | High | **Critical** | High | Measure |
| Mass | Low | None | **Critical** | Measure |
| Center of mass | Low | None | High for asymmetric/special pieces | Measure/derive |
| Stable angular range | Moderate | High | **Critical** | Measure |
| Holding/break moment vs angle | None | Low | **Critical** | Measure |
| Edge-pull/shear detachment force | None | Low | **Critical** | Measure |
| Connector-center spacing | Moderate | High for mixed scales / partial overlaps | High | Measure |
| Hysteresis/snap thresholds | Low | Moderate | High near transitions | Measure for advanced model |
| Exact internal magnet shape | None | Usually none | Indirect | Do not require for v1 |
| Ferrite remanence/FE field map | None | None | Usually unnecessary if joint response measured | Optional research only |
| Shell elastic modulus | Low unless heavily loaded | Low | Advanced/failure model only | Defer |

**Recommended browser model**

Represent every tile as a finite-thickness rigid prism with a planar polygon profile. Each connectable edge contains one or more logical connector sites. When compatible edges enter the empirically measured capture envelope, create a **breakable revolute magnetic constraint** whose axis is the measured effective hinge axis rather than an assumed line through ideal mathematical vertices.

A useful staged implementation is:

**Geometry mode.** For fold puzzles and closure reasoning, use rigid tiles, measured thickness/radii and a revolute hinge with measured angular limits. Ignore forces. This is far superior to zero-thickness polygons for deciding whether real pieces collide.

**Default mechanics mode.** Add tile mass and a break/yield envelope:

\[
|M_\mathrm{external}| < M_\mathrm{hold}(\theta)
\]

and

\[
(F_n,F_s,M)
\in \mathcal E_\mathrm{retain}(\theta)
\]

where \(\mathcal E_\mathrm{retain}\) is an experimentally fitted retention envelope. The connection breaks when the state leaves that envelope.

A simple implementation can use tabulated values at 15° or 5° nodes and piecewise interpolation. This is preferable to deriving magnetic forces from an assumed dipole because the seed patent itself shows attraction depends on geometry and angle, and current MAGNA-TILES does not publish the internal dimensions required for a defensible field model. citeturn21view1turn21view2turn20view2

**Higher-fidelity mode.** Add loading/unloading curves, snap events and a small rotational yield/friction term. One possible empirical law is

\[
M(\theta,\dot\theta)=
k_\theta(\theta-\theta_0)+
M_f\,\operatorname{sgn}(\dot\theta)
\]

only in regions where measurements actually support such behavior. At transition points, use measured state-switch thresholds rather than smoothing snap-through into a fictitious spring.

The model becomes misleading for fast impacts, acoustic snap behavior, exact internal magnet rotations, shell cracking, permanent deformation, aged/damaged pieces, water-contaminated tiles, mixed third-party brands, or structures operating near catastrophic multi-joint failure. The manufacturer says pieces are not waterproof and damaged pieces should be removed; those states should not be silently treated as nominal. citeturn20view2

MagnaMath should **not** present the browser model as a toy-safety, load-bearing or structural-certification calculation.

**Reference physical builds**

These fixtures turn individual measurements into system-level validation.

| Fixture | Pieces | Primary diagnostic | Expected nominal geometry |
|---|---|---|---|
| Coplanar square pair | 2 standard squares | 180° seam location, connector alignment, straightness, pull force | 180° |
| Orthogonal square book | 2 squares | 90° hinge clearance and effective axis | 90° |
| Six-square cube | 6 standard squares | Cumulative edge/thickness error; 90° closure; final-seam gap | Six equal square faces; 90° adjacent planes |
| micro two-on-one seam | 1 standard + 2 micro squares | Validates exact nominal 2:1 square relationship and connector registration | \(2×37.465=74.93\) mm from published square dimensions. citeturn20view3 |
| Equilateral tetrahedron | 4 equilateral triangles | Triangle edge equality + low-angle hinge behavior | Interior dihedral ≈70.5288° for ideal regular tetrahedron |
| Flat large-square tessellation | Large square + standards | Tests hypothesized integer modular sizing | **Discovery fixture; no 2L assumption allowed until measured** |
| Right-triangle reconstruction | Matched right triangles + square | Determines whether the right-triangle geometry composes into a square | **Discovery fixture** |
| Isosceles pyramid/wedge | Tall isosceles set | Validates equal-side geometry and closure angles | Compute from measured triangle profile |
| Five-square hanging chain | 5 squares | Simple whole-system retention benchmark | The same general test concept appears in US9636600B2. citeturn21view2 |
| Mixed micro/standard cube façade | Both scales | Connector compatibility under partial-edge loading | Empirical |

For every completed fixture, photograph all faces with a scale, measure final seam gaps, record final hinge angles, note spontaneous drift over 60 s, and repeat the assembly at least three times with randomized piece assignment.

The **six-square cube** should be MagnaMath's primary closure acceptance fixture because it stresses exactly the parameters an ideal mathematical model tends to ignore: finite thickness, edge-axis offset, corner relief, dimensional accumulation and hinge freedom.

## Machine-readable profiles and test records

All files should use SI-derived units internally: **millimeters, grams, newtons, N·mm, degrees for human-facing angle storage plus radians where required by calculations, °C and %RH**. Store values as numbers and put units in explicit fields; never encode `"74.93 mm"` as a string.

The evidence taxonomy should be common across schemas:

```json
{
  "provenance_classes": [
    "manufacturer_published",
    "patent_disclosure",
    "geometrically_derived",
    "experimentally_measured",
    "third_party_lead",
    "hypothesis"
  ],
  "record_statuses": [
    "production",
    "provisional",
    "synthetic_example",
    "superseded"
  ],
  "condition_classes": [
    "new",
    "used_intact",
    "damaged_excluded",
    "unknown"
  ]
}
```

The following official identifiers and dimensions in the examples come directly from the current manufacturer pages; all artificial test readings are explicitly marked `synthetic_example` and must not enter production data. citeturn20view3turn1search0

**`physical-piece-profile.json` schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://magnamath.example/schema/physical-piece-profile-1.0.0.json",
  "title": "MagnaMath Physical Piece Profile",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "profile_id",
    "brand",
    "system",
    "piece_type",
    "record_status",
    "geometry",
    "provenance"
  ],
  "properties": {
    "schema_version": { "type": "string" },
    "profile_id": { "type": "string" },
    "record_status": {
      "enum": ["production", "provisional", "synthetic_example", "superseded"]
    },
    "brand": { "type": "string" },
    "system": {
      "enum": ["classic", "micromags", "xl", "special", "unknown"]
    },
    "piece_type": { "type": "string" },
    "variant": { "type": ["string", "null"] },
    "sku_refs": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["item_number"],
        "properties": {
          "item_number": { "type": "string" },
          "upc": { "type": ["string", "null"] },
          "set_name": { "type": ["string", "null"] }
        }
      }
    },
    "manufacturing_scope": {
      "type": "object",
      "properties": {
        "country_of_origin": { "type": ["string", "null"] },
        "lot_ids": { "type": "array", "items": { "type": "string" } },
        "generation_id": { "type": ["string", "null"] }
      }
    },
    "geometry": {
      "type": "object",
      "required": ["unit"],
      "properties": {
        "unit": { "const": "mm" },
        "vertices_xy": {
          "type": ["array", "null"],
          "items": {
            "type": "array",
            "prefixItems": [{ "type": "number" }, { "type": "number" }],
            "minItems": 2,
            "maxItems": 2
          }
        },
        "edge_lengths": {
          "type": "array",
          "items": { "$ref": "#/$defs/quantity" }
        },
        "diagonals": {
          "type": "array",
          "items": { "$ref": "#/$defs/quantity" }
        },
        "thickness": { "$ref": "#/$defs/nullableQuantity" },
        "corner_radii": {
          "type": "array",
          "items": { "$ref": "#/$defs/quantity" }
        },
        "connector_centers": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["edge_id", "coordinate_mm"],
            "properties": {
              "edge_id": { "type": "string" },
              "coordinate_mm": { "type": "number" },
              "normalized_coordinate": { "type": ["number", "null"] },
              "kind": {
                "enum": ["cavity_center", "visible_magnet_center", "effective_magnetic_center"]
              },
              "uncertainty_mm_k2": { "type": ["number", "null"] }
            }
          }
        }
      }
    },
    "mass_g": { "$ref": "#/$defs/nullableQuantity" },
    "population_statistics": {
      "type": ["object", "null"],
      "properties": {
        "n_pieces": { "type": "integer", "minimum": 1 },
        "n_lots": { "type": "integer", "minimum": 1 },
        "between_piece_sd": { "type": ["number", "null"] },
        "between_lot_sd": { "type": ["number", "null"] }
      }
    },
    "photos": {
      "type": "array",
      "items": { "$ref": "#/$defs/photo" }
    },
    "provenance": {
      "type": "array",
      "items": { "$ref": "#/$defs/provenance" }
    }
  },
  "$defs": {
    "quantity": {
      "type": "object",
      "required": ["name", "value"],
      "properties": {
        "name": { "type": "string" },
        "value": { "type": "number" },
        "standard_uncertainty": { "type": ["number", "null"] },
        "expanded_uncertainty_k2": { "type": ["number", "null"] },
        "evidence_scope": { "type": "string" }
      }
    },
    "nullableQuantity": {
      "anyOf": [{ "$ref": "#/$defs/quantity" }, { "type": "null" }]
    },
    "photo": {
      "type": "object",
      "required": ["uri", "view"],
      "properties": {
        "uri": { "type": "string" },
        "sha256": { "type": ["string", "null"] },
        "view": { "type": "string" },
        "scale_reference_id": { "type": ["string", "null"] }
      }
    },
    "provenance": {
      "type": "object",
      "required": ["class", "source"],
      "properties": {
        "class": {
          "enum": [
            "manufacturer_published",
            "patent_disclosure",
            "geometrically_derived",
            "experimentally_measured",
            "third_party_lead",
            "hypothesis"
          ]
        },
        "source": { "type": "string" },
        "accessed_date": { "type": ["string", "null"], "format": "date" },
        "claim_scope": { "type": ["string", "null"] }
      }
    }
  }
}
```

Example:

```json
{
  "schema_version": "1.0.0",
  "profile_id": "magnatiles-classic-square-manufacturer-nominal-v1",
  "record_status": "production",
  "brand": "MAGNA-TILES",
  "system": "classic",
  "piece_type": "square",
  "variant": "standard",
  "sku_refs": [],
  "manufacturing_scope": {
    "country_of_origin": null,
    "lot_ids": [],
    "generation_id": null
  },
  "geometry": {
    "unit": "mm",
    "vertices_xy": null,
    "edge_lengths": [
      {
        "name": "nominal_square_side",
        "value": 74.93,
        "standard_uncertainty": null,
        "expanded_uncertainty_k2": null,
        "evidence_scope": "manufacturer_nominal_no_tolerance_published"
      }
    ],
    "diagonals": [
      {
        "name": "derived_nominal_diagonal",
        "value": 105.967022,
        "standard_uncertainty": null,
        "expanded_uncertainty_k2": null,
        "evidence_scope": "derived_from_manufacturer_nominal"
      }
    ],
    "thickness": null,
    "corner_radii": [],
    "connector_centers": []
  },
  "mass_g": null,
  "population_statistics": null,
  "photos": [],
  "provenance": [
    {
      "class": "manufacturer_published",
      "source": "https://magnatiles.com/products/micromags-70-piece-set",
      "accessed_date": "2026-08-10",
      "claim_scope": "standard square size shown in manufacturer comparison diagram"
    },
    {
      "class": "geometrically_derived",
      "source": "d = side * sqrt(2)",
      "accessed_date": null,
      "claim_scope": "nominal diagonal only"
    }
  ]
}
```

**`measurement-session.json` schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://magnamath.example/schema/measurement-session-1.0.0.json",
  "type": "object",
  "required": [
    "schema_version",
    "session_id",
    "started_at",
    "environment",
    "tools",
    "specimens",
    "measurements"
  ],
  "properties": {
    "schema_version": { "type": "string" },
    "session_id": { "type": "string" },
    "record_status": { "type": "string" },
    "started_at": { "type": "string", "format": "date-time" },
    "operator_id": { "type": ["string", "null"] },
    "protocol_version": { "type": "string" },
    "environment": {
      "type": "object",
      "required": ["temperature_c", "relative_humidity_pct"],
      "properties": {
        "temperature_c": { "type": "number" },
        "relative_humidity_pct": { "type": "number" },
        "conditioning_hours": { "type": ["number", "null"] }
      }
    },
    "tools": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["tool_id", "type"],
        "properties": {
          "tool_id": { "type": "string" },
          "type": { "type": "string" },
          "make_model": { "type": ["string", "null"] },
          "serial": { "type": ["string", "null"] },
          "resolution": { "type": ["number", "null"] },
          "resolution_unit": { "type": ["string", "null"] },
          "calibration_id": { "type": ["string", "null"] },
          "calibration_due": { "type": ["string", "null"], "format": "date" }
        }
      }
    },
    "specimens": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["sample_id", "piece_type", "condition"],
        "properties": {
          "sample_id": { "type": "string" },
          "piece_type": { "type": "string" },
          "system": { "type": "string" },
          "set_item_number": { "type": ["string", "null"] },
          "set_upc": { "type": ["string", "null"] },
          "lot_id": { "type": ["string", "null"] },
          "country_of_origin": { "type": ["string", "null"] },
          "purchase_date": { "type": ["string", "null"], "format": "date" },
          "condition": { "type": "string" }
        }
      }
    },
    "measurements": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "sample_id",
          "measurand",
          "unit",
          "readings",
          "mean"
        ],
        "properties": {
          "sample_id": { "type": "string" },
          "measurand": { "type": "string" },
          "landmark_definition": { "type": "string" },
          "unit": { "type": "string" },
          "readings": {
            "type": "array",
            "minItems": 3,
            "items": { "type": "number" }
          },
          "mean": { "type": "number" },
          "repeatability_sd": { "type": ["number", "null"] },
          "combined_standard_uncertainty": { "type": ["number", "null"] },
          "expanded_uncertainty_k2": { "type": ["number", "null"] },
          "tool_id": { "type": "string" },
          "photo_ids": {
            "type": "array",
            "items": { "type": "string" }
          }
        }
      }
    }
  }
}
```

Synthetic example:

```json
{
  "schema_version": "1.0.0",
  "session_id": "SYNTH-2026-08-10-001",
  "record_status": "synthetic_example",
  "started_at": "2026-08-10T14:00:00-04:00",
  "operator_id": "operator-01",
  "protocol_version": "MagnaMath-Metrology-1.0",
  "environment": {
    "temperature_c": 20.4,
    "relative_humidity_pct": 48.0,
    "conditioning_hours": 12
  },
  "tools": [
    {
      "tool_id": "CAL-001",
      "type": "digital_caliper",
      "make_model": null,
      "serial": null,
      "resolution": 0.01,
      "resolution_unit": "mm",
      "calibration_id": "CALCERT-001",
      "calibration_due": "2027-08-01"
    }
  ],
  "specimens": [
    {
      "sample_id": "C37-SQ-LOT-A-001",
      "piece_type": "square",
      "system": "classic",
      "set_item_number": "14837",
      "set_upc": "631291148371",
      "lot_id": "LOT-A",
      "country_of_origin": "RECORD_FROM_PACKAGE",
      "purchase_date": "2026-08-10",
      "condition": "new"
    }
  ],
  "measurements": [
    {
      "sample_id": "C37-SQ-LOT-A-001",
      "measurand": "parallel_edge_span",
      "landmark_definition": "straight-flank datum to opposite straight-flank datum",
      "unit": "mm",
      "readings": [74.92, 74.93, 74.92],
      "mean": 74.923333,
      "repeatability_sd": 0.005774,
      "combined_standard_uncertainty": null,
      "expanded_uncertainty_k2": null,
      "tool_id": "CAL-001",
      "photo_ids": []
    }
  ]
}
```

**`hinge-pair-test.json` schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://magnamath.example/schema/hinge-pair-test-1.0.0.json",
  "type": "object",
  "required": [
    "schema_version",
    "test_id",
    "sample_a",
    "sample_b",
    "angle_convention",
    "fixture",
    "cycles"
  ],
  "properties": {
    "schema_version": { "type": "string" },
    "test_id": { "type": "string" },
    "record_status": { "type": "string" },
    "sample_a": { "type": "string" },
    "edge_a": { "type": "string" },
    "sample_b": { "type": "string" },
    "edge_b": { "type": "string" },
    "angle_convention": {
      "const": "0_deg_face_to_face_90_deg_orthogonal_180_deg_coplanar_extended"
    },
    "fixture": {
      "type": "object",
      "properties": {
        "fixture_id": { "type": "string" },
        "lever_arm_mm": { "type": ["number", "null"] },
        "lever_arm_uncertainty_mm_k2": { "type": ["number", "null"] },
        "force_tool_id": { "type": ["string", "null"] },
        "angle_tool_id": { "type": ["string", "null"] }
      }
    },
    "cycles": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "cycle": { "type": "integer" },
          "direction": { "enum": ["closing", "opening"] },
          "samples": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["angle_deg"],
              "properties": {
                "angle_deg": { "type": "number" },
                "force_n": { "type": ["number", "null"] },
                "moment_n_mm": { "type": ["number", "null"] },
                "drift_deg_10s": { "type": ["number", "null"] },
                "state": {
                  "enum": ["stable", "drifting", "snapped", "detached", "not_tested"]
                }
              }
            }
          }
        }
      }
    },
    "stable_angle_range_deg": {
      "type": ["array", "null"],
      "prefixItems": [{ "type": "number" }, { "type": "number" }]
    },
    "detachment": {
      "type": ["object", "null"],
      "properties": {
        "mode": { "type": "string" },
        "angle_deg": { "type": "number" },
        "peak_force_n": { "type": ["number", "null"] },
        "peak_moment_n_mm": { "type": ["number", "null"] }
      }
    },
    "damage_observed": { "type": "boolean" },
    "photo_ids": { "type": "array", "items": { "type": "string" } }
  }
}
```

Synthetic example:

```json
{
  "schema_version": "1.0.0",
  "test_id": "SYNTH-HINGE-001",
  "record_status": "synthetic_example",
  "sample_a": "CLASSIC-SQ-001",
  "edge_a": "e0",
  "sample_b": "CLASSIC-SQ-002",
  "edge_b": "e2",
  "angle_convention": "0_deg_face_to_face_90_deg_orthogonal_180_deg_coplanar_extended",
  "fixture": {
    "fixture_id": "HINGE-JIG-01",
    "lever_arm_mm": 50.0,
    "lever_arm_uncertainty_mm_k2": 0.05,
    "force_tool_id": "FORCE-001",
    "angle_tool_id": "ANGLE-001"
  },
  "cycles": [
    {
      "cycle": 1,
      "direction": "closing",
      "samples": [
        {
          "angle_deg": 180,
          "force_n": null,
          "moment_n_mm": null,
          "drift_deg_10s": 0.2,
          "state": "stable"
        },
        {
          "angle_deg": 90,
          "force_n": null,
          "moment_n_mm": null,
          "drift_deg_10s": 0.4,
          "state": "stable"
        }
      ]
    }
  ],
  "stable_angle_range_deg": null,
  "detachment": null,
  "damage_observed": false,
  "photo_ids": []
}
```

**`connector-compatibility.json` schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://magnamath.example/schema/connector-compatibility-1.0.0.json",
  "type": "object",
  "required": [
    "schema_version",
    "compatibility_id",
    "piece_a",
    "piece_b",
    "result",
    "provenance"
  ],
  "properties": {
    "schema_version": { "type": "string" },
    "compatibility_id": { "type": "string" },
    "record_status": { "type": "string" },
    "piece_a": {
      "type": "object",
      "required": ["profile_id", "edge_id"],
      "properties": {
        "profile_id": { "type": "string" },
        "edge_id": { "type": "string" }
      }
    },
    "piece_b": {
      "type": "object",
      "required": ["profile_id", "edge_id"],
      "properties": {
        "profile_id": { "type": "string" },
        "edge_id": { "type": "string" }
      }
    },
    "alignment_offset_mm": { "type": ["number", "null"] },
    "engaged_connector_count": { "type": ["integer", "null"] },
    "tested_orientations": { "type": "integer", "minimum": 0 },
    "successful_orientations": { "type": "integer", "minimum": 0 },
    "force_summary": {
      "type": ["object", "null"],
      "properties": {
        "mode": { "type": "string" },
        "mean_n": { "type": "number" },
        "sd_n": { "type": ["number", "null"] },
        "n_pairs": { "type": "integer" }
      }
    },
    "result": {
      "enum": ["compatible", "conditional", "incompatible", "manufacturer_claim_only", "not_tested"]
    },
    "provenance": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["class", "source"],
        "properties": {
          "class": { "type": "string" },
          "source": { "type": "string" }
        }
      }
    }
  }
}
```

Manufacturer-claim example:

```json
{
  "schema_version": "1.0.0",
  "compatibility_id": "MT-CLASSIC-MICRO-MFR-CLAIM",
  "record_status": "production",
  "piece_a": {
    "profile_id": "magnatiles-classic-square-manufacturer-nominal-v1",
    "edge_id": "any"
  },
  "piece_b": {
    "profile_id": "magnatiles-micromags-square-manufacturer-nominal-v1",
    "edge_id": "any"
  },
  "alignment_offset_mm": null,
  "engaged_connector_count": null,
  "tested_orientations": 0,
  "successful_orientations": 0,
  "force_summary": null,
  "result": "manufacturer_claim_only",
  "provenance": [
    {
      "class": "manufacturer_published",
      "source": "https://magnatiles.com/products/micromags-70-piece-set"
    }
  ]
}
```

The manufacturer does explicitly state that microMAGS and the rest of the line are compatible, so that compatibility claim is source-backed even before MagnaMath has quantified connector registration or strength. citeturn20view3turn20view2

**`reference-build-observation.json` schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://magnamath.example/schema/reference-build-observation-1.0.0.json",
  "type": "object",
  "required": [
    "schema_version",
    "observation_id",
    "fixture_id",
    "piece_instances",
    "observations"
  ],
  "properties": {
    "schema_version": { "type": "string" },
    "observation_id": { "type": "string" },
    "record_status": { "type": "string" },
    "fixture_id": { "type": "string" },
    "fixture_version": { "type": "string" },
    "session_id": { "type": ["string", "null"] },
    "piece_instances": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["role", "sample_id"],
        "properties": {
          "role": { "type": "string" },
          "sample_id": { "type": "string" },
          "orientation": { "type": ["string", "null"] }
        }
      }
    },
    "expected_geometry": {
      "type": "object",
      "properties": {
        "source": { "type": "string" },
        "target_angles_deg": {
          "type": "array",
          "items": { "type": "number" }
        },
        "target_closure": { "type": ["string", "null"] }
      }
    },
    "observations": {
      "type": "object",
      "properties": {
        "seam_gaps_mm": {
          "type": "array",
          "items": { "type": "number" }
        },
        "hinge_angles_deg": {
          "type": "array",
          "items": { "type": "number" }
        },
        "stable_duration_s": { "type": ["number", "null"] },
        "closure_success": { "type": "boolean" },
        "failure_mode": { "type": ["string", "null"] }
      }
    },
    "photos": {
      "type": "array",
      "items": { "type": "string" }
    },
    "notes": { "type": ["string", "null"] }
  }
}
```

Synthetic cube example:

```json
{
  "schema_version": "1.0.0",
  "observation_id": "SYNTH-CUBE-001",
  "record_status": "synthetic_example",
  "fixture_id": "classic-six-square-cube",
  "fixture_version": "1.0",
  "session_id": "SYNTH-2026-08-10-001",
  "piece_instances": [
    {"role": "bottom", "sample_id": "SQ-001", "orientation": "A"},
    {"role": "north", "sample_id": "SQ-002", "orientation": "A"},
    {"role": "east", "sample_id": "SQ-003", "orientation": "A"},
    {"role": "south", "sample_id": "SQ-004", "orientation": "A"},
    {"role": "west", "sample_id": "SQ-005", "orientation": "A"},
    {"role": "top", "sample_id": "SQ-006", "orientation": "A"}
  ],
  "expected_geometry": {
    "source": "ideal cube geometry",
    "target_angles_deg": [90, 90, 90, 90],
    "target_closure": "all final seams magnetically engage without forced shell deformation"
  },
  "observations": {
    "seam_gaps_mm": [],
    "hinge_angles_deg": [],
    "stable_duration_s": null,
    "closure_success": false,
    "failure_mode": null
  },
  "photos": [],
  "notes": "Synthetic example only; populate from physical test."
}
```

Version every schema independently from the data. A future change in measurement protocol should increment `protocol_version`; changing a source value should create a new profile version rather than silently mutating an old record.

## Procurement, ship/no-ship claims, open questions, and verification checklist

**Prioritized specimen procurement**

| Priority | Procurement | Purpose |
|---|---|---|
| P0 | **microMAGS 70**, at least 3 separately purchased sets | Exact manufacturer square-size anchor; micro triangle family; current China production; Large Rectangles. citeturn20view3 |
| P0 | **Classic 37 or Classic 74**, minimum 3 lots, intentionally obtain both China and Indonesia labeled stock when possible | Core standard shapes plus Large Square; manufacturer currently lists those origins for these Classic SKUs. citeturn1search0turn1search1 |
| P0 | **Classic 100**, ≥3 separately sourced lots | Independent Classic SKU currently listed as Philippines-made, giving a valuable manufacturing-origin comparison. citeturn1search2 |
| P0 | **Combo 46** or another current official mixed-scale Combo set, ≥3 lots | Same-package standard/micro compatibility and likely tight production-date pairing. The official Combo lines intentionally mix scales. citeturn1search3turn19search6 |
| P1 | **Police Station 35** | Source of current rectangles and Large Rectangle, plus Philippines production. citeturn19search4 |
| P1 | **Space 32** | Additional Large Rectangle and mixed micro/standard specimen source from China. citeturn19search2 |
| P1 | **Builder XL 50**, ≥2 lots | Establish XL size family separately from Classic. citeturn14search11 |
| P2 | Verified older pre-rivet / earlier-style used set with provenance | Historical-generation comparison; do not mix with current population baseline |
| P2 | One unopened witness set from each critical SKU/lot | Preserves provenance if later mold changes are discovered |

Purchase nominally identical sets through at least **three independent order events** rather than buying three boxes from a single retail case and assuming they are independent lots. Photograph every package panel carrying item number, UPC, origin, date/lot codes and regulatory markings before pieces are mixed.

For equipment, procurement priority should be: **traceable length references → good calliper → low-range force sensor → rigid linear test stand → angle encoder/stage → environmental logger → calibrated optical imaging → low-range torque transducer → laboratory vision/CMM validation**. A high-resolution instrument without controlled registration will not solve the dominant metrology problem.

**Claims safe to ship now**

MagnaMath can safely state, with appropriate provenance labels:

- MAGNA-TILES' current official microMAGS diagram identifies a standard square as **74.93 mm / 2.95 in** and a microMAGS square as **37.465 mm / 1.475 in**. citeturn20view3
- Those published square dimensions have an exact nominal **2:1 linear ratio**.
- Their mathematically derived nominal diagonals are approximately **105.967 mm** and **52.984 mm**, respectively; these are derived design values, not specimen measurements. citeturn20view3
- Current MAGNA-TILES manufacturer materials identify **MABS plastic, ceramic/ferrite magnets, rivets and an internal crisscross lattice**. citeturn20view2
- MAGNA-TILES says its sets are mutually compatible and specifically promotes microMAGS as compatible with other MAGNA-TILES sets. citeturn20view2turn20view3
- Current Classic and microMAGS product pages establish the piece taxonomy and set inventories listed in this dossier. citeturn1search0turn1search1turn1search2turn20view3
- Current product pages demonstrate that different SKUs can come from different countries, so provenance-aware calibration is justified. citeturn1search0turn1search2turn20view3

**Claims requiring physical measurement before shipping**

Exact as-built dimensions and tolerances for all shapes; all triangle side lengths/angles; Large Square and rectangle dimensions; whether micro triangle geometries are exactly one-half linear scale; XL dimensions; corner radii; overall and local thickness; warpage; rivet coordinates; connector/pocket/magnetic-center positions; magnet count per edge; effective hinge axis; hinge clearance; minimum and maximum stable angle; individual tile mass and center of mass; hinge torque/stiffness; pull/shear/peel detachment; snap-through thresholds; lot/site variation; and dimensional/force effects of age or wear.

**Claims that should not be made**

Do **not** state that:

- US9636600B2 describes MAGNA-TILES construction. Its documented prototype uses a different magnet technology from the current MAGNA-TILES manufacturer description. citeturn21view0turn20view2
- Current MAGNA-TILES are approximately 6.4 mm thick or 30 g because those figures appear in the patent's prior-art discussion. citeturn21view0
- Current magnets are elongated cylinders or freely rotate simply because US7154363B2 discloses that mechanism. citeturn21view8
- Current magnets are fixed simply because another patent uses fixed magnets.
- All microMAGS dimensions are exactly half Classic dimensions merely because the **square** measurements have that relationship. citeturn20view3
- “75% smaller” means a 75% reduction in each linear dimension; the official square diagram demonstrates otherwise. citeturn20view3
- A Large Square is exactly \(2L\), a Large Rectangle has a particular integer module, or a right triangle is exactly half a square until physical/official evidence establishes it.
- “3 inches” is a manufacturing tolerance or more precise specification than the explicitly annotated 74.93-mm square. citeturn20view2turn20view3
- Manufacturer compatibility implies identical connector strength across every shape, angle or generation.
- Compatibility with MAGNA-TILES implies compatibility with third-party “MAGNA-TILES-compatible” brands.
- A MagnaMath static simulation predicts regulatory toy safety, real-world abuse strength or maximum safe structural loading.

**Open questions ranked by impact**

| Priority | Open question | Why it matters |
|---|---|---|
| Critical | What are actual current Classic and micro shell thickness distributions? | Changes collision, vertex packing and effective hinge geometry |
| Critical | Where are effective connector centers on every edge family? | Determines partial-edge and micro-to-standard mating |
| Critical | What is \(M_\mathrm{hold}(\theta)\) / \(M_\mathrm{break}(\theta)\)? | Governs structure stability |
| Critical | What is the effective hinge-axis offset and minimum reachable angle? | Governs fold closure |
| High | Are right triangles mathematically half-squares or another profile? | Major geometry/topology assumption |
| High | What are exact tall-isosceles dimensions? | Needed for pyramids/polyhedra |
| High | Is Large Square exactly modular with standard square? | Needed for tessellation |
| High | Are all micro geometric profiles exactly 1:2 scale? | Needed for a unified lattice |
| High | Do China/Indonesia/Philippines specimens differ measurably? | Determines one profile vs origin-specific profiles |
| High | Are visible historical rivet/mold generations geometrically interchangeable? | Household collections can span decades |
| Medium | Do internal magnets rotate, translate, or both? | Useful for dynamic model, but not necessary for empirical static hinge model |
| Medium | How much does repeated cycling alter retention? | Relevant to used household collections |
| Medium | How sensitive are measurements to temperature and age? | Determines environmental corrections |
| Low for v1 | Exact magnet dimensions/grade/field model | Empirical connector model can bypass these |

**Final verification checklist**

| Gate | Acceptance requirement |
|---|---|
| Source provenance | Every production parameter carries `manufacturer_published`, `derived`, or `measured` provenance; patent hypotheses cannot masquerade as product facts |
| Exact official geometry | Archive the source image/page showing 74.93 and 37.465 mm with access date and hash/screenshot if maintained internally |
| Lot metadata | SKU/item, UPC, origin, retailer/order, purchase date and visible lot/date codes captured before unpacking |
| Sample minimum | ≥5 pieces/type where feasible and ≥3 reseated readings/dimension |
| Product baseline | ≥3 independent lots ×5 pieces/type for critical parameters |
| Higher-confidence validation | Target ≥5 lots ×10 pieces/type for parameters whose variation materially changes simulated closure |
| Caliper control | Zero and multi-point reference check recorded before/after session |
| Optical calibration | Scale is coplanar with specimen and distortion/calibration residual documented |
| Force calibration | Force sensor check/certificate and orientation recorded |
| Angle calibration | 0°/90° checks plus reversal recorded |
| Fixture calibration | Actual lever arm/pivot dimensions measured; CAD nominal not substituted |
| Environment | Temperature, RH and conditioning time recorded |
| Damage screen | Pre/post photographs and condition code |
| Hinge convention | 0°/90°/180° convention recorded in every test |
| Hinge repeats | ≥5 independent pairs and ≥3 recorded cycles; recommended five cycles |
| Hysteresis | Opening and closing data retained separately |
| Detachment | Pull, shear and peel/torque modes kept distinct |
| Uncertainty | Measurement uncertainty reported separately from piece/lot variation |
| Outliers | No automatic deletion; assignable cause required |
| Reference builds | Cube, micro 2:1 seam and tetrahedron/triangle fixtures tested against measured profiles |
| Browser validation | Predicted fixture seam gaps/angles compared directly to physical observations |
| Release gate | No unknown geometric parameter is silently populated from a marketing image or unrelated patent |
| Versioning | Schema version, profile version, source date and protocol version are immutable per record |

The highest-value immediate experiment is therefore not a destructive magnet teardown. It is a **carefully provenance-controlled cross-lot dimensional campaign followed by square-to-square hinge tests**. Those measurements directly determine whether MagnaMath's geometry closes and whether its structures remain standing. Internal magnetic construction can remain abstracted until empirical data demonstrates that a simpler edge-joint model is inadequate.

The most defensible MagnaMath v1 representation is consequently:

\[
\boxed{
\text{measured finite-thickness rigid geometry}
+
\text{empirical magnetic hinge constraints}
+
\text{explicit population uncertainty}
}
\]

rather than:

\[
\boxed{
\text{ideal mathematical polygons}
+
\text{assumed dimensions}
+
\text{patent-derived magnet physics}
}
\]

That boundary preserves what is already known with high confidence, leaves unmeasured quantities honestly unknown, and creates a direct path from laboratory observations to browser-simulation parameters.

Approx. user-visible conversation tokens: ~19,000.

#MagnaMath #MagneticTiles #Metrology #MechanicalEngineering #UncertaintyAnalysis #ExperimentalDesign #Magnetics #Simulation