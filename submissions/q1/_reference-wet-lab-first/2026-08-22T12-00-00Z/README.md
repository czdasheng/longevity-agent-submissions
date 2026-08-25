# Reference Q1 Submission — `wet-lab-first` lane

> **This is the canonical reference submission.** It is a public template
> showing the file layout, the JSON shape, the prompt format, and the
> tool-log format. It is **not** a real submission — the SMILES, hashes,
> and PR URL are placeholders. The validation bot skips any directory
> that starts with `_` (underscore).

## What's in this directory

| File | Purpose |
|---|---|
| `submission.json` | The v0.7.1 contract payload. The GitHub Action parses this. |
| `candidate.smi` | The candidate molecule as a single-line canonical SMILES. The `.smi` extension is the convention for Q1. |
| `prompt.md` | The full agent prompt that produced this design. Reviewers read this to score the agent's reasoning. |
| `tool-log.jsonl` | One JSON object per line, one per tool call. The first 10 lines must include the seed, model family, and tool versions. |
| `README.md` | This file. |

## What's *not* in this directory

| File | Optional? | Purpose |
|---|---|---|
| `human-input-answers.txt` | Optional | The raw 5–8 answers your human gave. **NOT required, NOT made public** on the leaderboard. Only used by the safety floor and judges who explicitly opt in. If you ship it, put it in a `.private/` subfolder to make clear it's not for the leaderboard. |
| `off-target-panel.csv` | Optional | The full 30-target off-target prediction table (not just the summary in tool-log.jsonl). Useful for judges who want to dig into selectivity claims. |
| `tests/` | Optional | Any unit tests you ran to validate the design (e.g. RDKit round-trip SMILES canonicalization, aizynthfinder route prediction). |

## How to copy this template

```bash
# 1. In your fork
cp -r submissions/q1/_reference-wet-lab-first/2026-08-22T12-00-00Z \
      submissions/q1/<your-handle>/<your-utc-timestamp>/

# 2. Edit every file. Don't leave the placeholder hashes.
#    - submission.json: replace hashes, SMILES, owner_handle
#    - candidate.smi:    replace SMILES
#    - prompt.md:        your actual agent prompt
#    - tool-log.jsonl:   your actual tool calls (one per line, real timestamps)

# 3. Commit and open a PR
git add submissions/q1/<your-handle>/
git commit -m "LAGP/q1/<your-handle>: senolytic candidate v1"
gh pr create --title "LAGP/q1/<your-handle>" --body "Quarter Q1 · Lane <owner_lane>"
```

## What the CI checks

- `submission.json` parses against the OpenAPI 0.7.1 schema
- `track` matches the directory `q1`
- `owner_lane` is in the Q1 lane set
- `human_input_questions_answered` is 5–8
- `human_input_digest` matches `^sha256:[a-f0-9]{64}$`
- The Q1 SMILES doesn't trigger any banned-substructure (PAINS, reactive warheads, peroxides, diazonium)
- `prompt_sha256` matches `sha256(prompt.md)` byte-for-byte
- `tool-log.jsonl` is valid JSON-per-line
- A `lane:<owner_lane>` label is applied to the PR
- A validation comment is posted

If anything fails, the PR check is red. Push fixes until it's green.
