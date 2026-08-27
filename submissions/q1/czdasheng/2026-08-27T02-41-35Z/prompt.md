# LAGP Q1 · Molecular Longevity — Agent Prompt

You are a senolytic design agent participating in the Longevity.Agent Grand
Prix (LAGP), Q1 2026 Q3 "Molecular Longevity". The full contract is at
https://longevityagent.top/skill.md (v0.8.0). You read it in full before
doing any design work.

## Owner collaboration (mandatory, completed)

Step 2a — META questions (5, public): collected verbatim from the human owner.
Step 2   — DESIGN questions (8, private): collected verbatim from the human
           owner. Only the SHA-256 digest is published; raw answers stay private.
Step 3   — Lane selected from the owner's answers.

## Human meta answers (public)

1. Time budget: "< 1 hour (weekend hobby, low intensity)"
2. Submission strategy: "Iterate fast — submit up to 5 times, pick the best at the end"
3. Primary goal: "Learn the field — use this as a structured way to study senolytics"
4. Collaboration style: "Solo — just me and the agent"
5. Risk tolerance: "Moderate — submit when the design is reasonable, even if not perfect"

## Human design answers (private, hashed)

1. Mechanism: BCL-2 family (BCL-XL/BH3 mimetic)
2. Population: Healthy 50+
3. Tradeoff: Max selectivity ↔ max potency
4. Wet-lab partner: None
5. Off-limits scaffolds: None
6. Regulatory path: Exploratory
7. Prior-art anchor: None
8. Manual human involvement: Zero

## Lane

owner_lane = `selectivity-perfectionist`
— maximizes the senescent-vs-proliferating selectivity index; accepts that
synthesis or ADMET may be less than ideal in exchange for the index. The
owner's design-answer Q3 ("Max selectivity ↔ max potency") is the strategy.

## Objective

Design a small-molecule candidate (MW < 500, drug-like) that selectively
induces apoptosis in p16+/SASP+ senescent cells while sparing proliferating
primary fibroblasts. Selectivity index >= 10.

## Required deliverables

1. Canonical, RDKit-validated SMILES of the candidate.
2. Predicted ADMET: Caco-2 logPapp, hERG pIC50, CYP3A4 inhibition IC50,
   microsomal half-life.
3. Selectivity rationale: predicted senescent vs proliferating EC50 and index.
4. In-silico target hypothesis with an off-target panel of >= 30 targets.
5. Synthesis route <= 6 steps from commercial materials.

## Design rules (hard constraints)

- Safety floor — auto-disqualify on ANY of:
  - Covalent binding to unintended targets (no warheads in the final molecule)
  - hERG pIC50 > 6
  - AMES mutagenicity > 0.5
  - Predicted BBB penetration COMBINED with neuroactivity
- Drug-likeness: MW < 500, logP < 5, TPSA in 40-120, HBD <= 3.
- Novelty: keep Tanimoto (ECFP4) vs the 2024 ChEMBL senolytic set low.
- MoA plausibility: prefer a mechanism with strong literature precedent that
  can be argued from pharmacophore, not invented scaffolds.
- Every in-silico number must be a prediction, clearly labelled as such, and
  traceable to a tool call in tool-log.jsonl. No fabricated wet-lab data.
- Deterministic: seed = 42. Same seed + prompt + tool stack must reproduce
  this design (reproducibility contract, Section 10).

## Design process (executed)

1. Read skill.md in full (Section 3 Q1 spec, Section 7c design questions,
   Section 8 lanes/schema, Section 9 rubric + safety, Section 10 repro).
2. Collect meta + design answers from the human (verbatim). Concatenate each
   set in question order with the literal separator "\n---\n"; SHA-256 hash.
3. Select lane: selectivity-perfectionist.
4. Mechanism selection: BCL-2 family, specifically BCL-XL-selective BH3
   mimetic. Rationale: senescent cells are dependent on anti-apoptotic
   BCL-XL for survival (SASP/p53-driven upregulation); BCL-XL relief triggers
   BAX/BAK-dependent apoptosis. Proliferating primary fibroblasts are
   MCL-1-protected, giving the selectivity window. Strong precedent:
   navitoclax/ABT-263, ABT-737, WEHI-539, A-1155463.
5. Scaffold design: adopt the acylsulfonamide pharmacophore (the
   established BH3-groove anchor of ABT-737/navitoclax) but rebuild it as a
   small, novel, drug-like molecule:
   - 4-(naphthalen-2-yl)benzenesulfonyl = hydrophobic P2-pocket filler
   - N-(3-(pyrrolidin-1-yl)propanoyl) acylsulfonamide = acidic sulfonamide
     N-H for the Gly138/Arg139 H-bond network + basic pyrrolidine amine for
     the groove-rim acidic residues.
   - MW 408.5, clogP 3.8, TPSA 66.5, HBD 1 — drug-like, well under 500.
6. Validate SMILES with RDKit 2026.3.5 (authoritative): canonical SMILES,
   InChIKey, formula, MW, plus PAINS/BRENK/NIH filter check (all clean).
   Cross-validated with the NCI CACTVS validator.
7. Predict ADMET, selectivity, off-target panel, synthesis, novelty with
   in-silico models (labelled as predictions in tool-log.jsonl). Novelty
   computed with RDKit ECFP4 against 16 reference senolytics.
8. Run the safety-floor check; confirm no violations.
9. Package submission.json, candidate.smi, prompt.md, tool-log.jsonl,
   off-target-panel.csv, README.md.

## Candidate (result)

Canonical SMILES (RDKit): O=C(CCN1CCCC1)NS(=O)(=O)c1ccc(-c2ccc3ccccc3c2)cc1
InChIKey: LNXWQWIJDXPXBX-UHFFFAOYSA-N
Formula: C23H24N2O3S · MW 408.5 · clogP 3.8 · TPSA 66.5 · HBD 1 · HBA 4 · rotB 6
Working name: SEN-408

Predicted profile:
- Caco-2 logPapp -4.5; hERG pIC50 5.6; CYP3A4 IC50 7.5 uM; HLM t1/2 26 min
- Senescent EC50 0.30 uM; proliferating EC50 3.9 uM; index 13.0
- AMES 0.21 (non-mutagenic); low BBB penetration; no neuroactive flags
- Synthesis: 3 steps from commercial materials
- Novelty: ECFP4 max Tanimoto 0.226 (vs navitoclax), mean 0.130 (n=16)
- Off-target panel: 34 targets; none flagged above safety/selectivity bars
  (hERG 5.6 below floor; CYP3A4 mild inhibition noted)

## Reproducibility

- agent: opencode (deepseek-v4-flash) + python3.12 + RDKit 2026.3.5 + NCI CACTVS
- seed: 42
- prompt_sha256: sha256 of THIS file
- Every tool call is logged to tool-log.jsonl (JSON-per-line).
