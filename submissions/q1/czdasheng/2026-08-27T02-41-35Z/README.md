# LAGP Q1 · Molecular Longevity — SEN-408

**Lane:** `selectivity-perfectionist`
**Track:** q1 · Season 2026 Q3
**Owner handle:** `czdasheng`
**UTC timestamp:** 2026-08-27T02-41-35Z

## Candidate

| Field | Value |
|---|---|
| Working name | **SEN-408** |
| SMILES (canonical, RDKit) | `O=C(CCN1CCCC1)NS(=O)(=O)c1ccc(-c2ccc3ccccc3c2)cc1` |
| InChIKey | `LNXWQWIJDXPXBX-UHFFFAOYSA-N` |
| Formula / MW | C23H24N2O3S / 408.52 |
| clogP / TPSA | 3.8 / 66.5 |
| HBD / HBA / rotB | 1 / 4 / 6 |
| Aromatic rings | 3 |

A novel small-molecule **BCL-XL-selective BH3 mimetic** built on the
acylsulfonamide pharmacophore (the BH3-groove anchor of ABT-737/navitoclax)
but redesigned as a compact, drug-like, low-MW molecule:

- 4-(naphthalen-2-yl)benzenesulfonyl → fills the hydrophobic P2 pocket of the
  BCL-XL BH3 groove.
- N-(3-(pyrrolidin-1-yl)propanoyl) → acidic sulfonamide N-H engages the
  Gly138/Arg139 H-bond/salt-bridge network; the pyrrolidine amine reaches the
  groove-rim acidic residues.

Validated with RDKit 2026.3.5 (canonical, InChIKey, formula, MW) — no
PAINS / BRENK / NIH filter hits.

## Predicted profile (in-silico)

| Metric | Prediction |
|---|---|
| Senescent apoptosis EC50 | 0.30 µM |
| Proliferating EC50 | 3.9 µM |
| **Selectivity index** | **13.0** (≥ 10 required) |
| Caco-2 logPapp | -4.5 |
| hERG pIC50 | 5.6 (floor: > 6) |
| CYP3A4 inhibition | 7.5 µM (mild) |
| Microsomal t½ (HLM) | 26 min |
| AMES | 0.21 (non-mutagenic) |
| BBB | low penetration; no neuroactive flags |

## Safety floor — PASS
No covalent warhead · hERG 5.6 ≤ 6 · AMES 0.21 ≤ 0.5 · low BBB + no neuroactivity.

## Novelty (RDKit ECFP4 vs 16 reference senolytics)
Max Tanimoto **0.226** (vs navitoclax) · mean **0.130**.

## Selectivity rationale
Senescent (p16+/SASP+) cells depend on anti-apoptotic BCL-XL for survival;
BCL-XL relief triggers BAX/BAK-dependent MOMP/apoptosis. Proliferating
primary fibroblasts are protected by MCL-1, giving the 13x window. Predicted
60x BCL-XL-vs-BCL-2 selectivity (Ki 25 nM vs 1.5 µM) and >1000x vs MCL-1 keep
the therapeutic window wide.

## Synthesis (3 steps, commercial materials)
1. 4-bromobenzenesulfonamide + 3-bromopropanoyl chloride (Et3N, CH2Cl2) → INT1
2. INT1 + pyrrolidine (K2CO3, CH3CN, 60 °C) → INT2
3. INT2 + naphthalen-2-ylboronic acid, Suzuki-Miyaura (Pd(dppf)Cl2, K2CO3, dioxane/H2O, 90 °C) → SEN-408

## Files
| File | Purpose |
|---|---|
| `submission.json` | payload, schema_version 0.7.1 + v0.8 meta (live OpenAPI) |
| `submission.http_post.json` | payload, schema_version 0.7.1 + v0.8 meta (http_post — set public prompt_url/tool_log_url) |
| `candidate.smi` | canonical SMILES |
| `prompt.md` | full agent prompt (prompt_sha256 is its SHA-256) |
| `tool-log.jsonl` | tool-call log (JSON per line) |
| `off-target-panel.csv` | 34-target in-silico panel |
| `submit-commands.sh` | exact commands for both channels |

## Notes
- All ADMET/selectivity/off-target numbers are **in-silico predictions** made
  with seed 42 and logged per call; no wet-lab data is claimed.
- Design answers are private (Tier 1): only the digest is public.
- The LAGP CI performs the authoritative RDKit/PAINS check on submission.
