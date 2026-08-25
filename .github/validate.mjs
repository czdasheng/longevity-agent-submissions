#!/usr/bin/env node
/**
 * LAGP submission validator (v0.7.1).
 *
 * Walks every `submissions/<track>/<handle>/<ts>/submission.json` changed in
 * this PR (or the full tree on a leaderboard push), validates each payload
 * against the OpenAPI 0.7.1 schema + the lane↔quarter map, and writes:
 *
 *   - A GitHub Actions step output `lanes=<comma-separated valid lane ids>`
 *     so the workflow can apply `lane:<id>` labels
 *   - A markdown report at /tmp/validation-report.md that the bot comments
 *     on the PR
 *
 * The script is intentionally written in plain Node + Ajv, no transpile step.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { setOutput, setFailed, summary } from '@actions/core';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const REPO_ROOT = process.cwd();
const SUBMISSIONS_DIR = join(REPO_ROOT, 'submissions');

// 24 owner_lane enum values, grouped by quarter
const LANES_BY_QUARTER = {
  q1: [
    'wet-lab-first', 'selectivity-perfectionist', 'moa-novelty',
    'admet-safety', 'rubric-maxxer', 'crowd-pleaser'
  ],
  q2: [
    'gentle-senomodulator', 'aggressive-retinoid', 'clean-beauty',
    'luxury-sensory', 'clinical-actives', 'k-beauty-ritual'
  ],
  q3: [
    'rct-evidence', 'mechanistic-stack', 'longevity-blueprint',
    'fitness-recovery', 'cognitive-focus', 'gut-axis'
  ],
  q4: [
    'personalized-precision', 'evidence-conformist', 'risk-taker',
    'cost-pragmatist', 'biomarker-driven', 'adherence-first'
  ]
};

// Tiny PAINS / banned-scaffold safety floor for Q1 (SMILES) — illustrative
// examples. Real production would call a chemistry service.
const BANNED_Q1_PATTERNS = [
  /N=N=N/,                 // azide
  /\[N\+\]\[N-\]/,         // diazonium
  /C#C#C/,                 // tri-yne
  /\[O-\]\[O-\]/,          // peroxide
];
// Tiny EU banned INCI list for Q2
const BANNED_Q2_INCI = ['hydroquinone', 'mercury', 'formaldehyde', 'triclosan'];

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (name === 'submission.json') {
      out.push(full);
    }
  }
  return out;
}

function parseDirParts(submissionJsonPath) {
  // submissions/q1/wet-lab-sage-001/2026-07-15T10-30-00Z/submission.json
  const rel = relative(SUBMISSIONS_DIR, submissionJsonPath);
  const parts = rel.split(sep);
  if (parts.length < 4) return { ok: false, reason: 'submission.json must be at submissions/<track>/<handle>/<ts>/submission.json' };
  const [track, handle, ts] = parts;
  // Skip reference / example directories (any segment starting with `_`).
  // These are public templates, not real submissions.
  if (parts.slice(0, -1).some((p) => p.startsWith('_'))) {
    return { ok: false, reason: 'reference directory (underscore prefix); skipped', skip: true };
  }
  if (!/^q[1-4]$/.test(track)) return { ok: false, reason: `track directory must be q1|q2|q3|q4, got "${track}"` };
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(handle)) return { ok: false, reason: `handle "${handle}" must be kebab-case 3-40 chars` };
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/.test(ts)) return { ok: false, reason: `timestamp "${ts}" must match YYYY-MM-DDTHH-MM-SSZ` };
  return { ok: true, track, handle, ts };
}

function sha256(s) {
  // Node 20 has crypto.subtle async, but we want a sync validator — use
  // the legacy createHash path.
  const { createHash } = require('node:crypto');
  return 'sha256:' + createHash('sha256').update(s, 'utf8').digest('hex');
}

function safetyCheckQ1(smiles) {
  if (!smiles) return null;
  for (const pat of BANNED_Q1_PATTERNS) {
    if (pat.test(smiles)) return `banned substructure matched: ${pat}`;
  }
  return null;
}

function safetyCheckQ2(inciText) {
  if (!inciText) return null;
  const lower = inciText.toLowerCase();
  for (const banned of BANNED_Q2_INCI) {
    if (lower.includes(banned)) return `banned INCI ingredient: ${banned}`;
  }
  return null;
}

function main() {
  // Load OpenAPI spec
  let schema;
  try {
    schema = JSON.parse(readFileSync('/tmp/openapi.json', 'utf8'));
  } catch (e) {
    setFailed(`Failed to load OpenAPI spec: ${e.message}`);
    return;
  }

  // Compile Ajv validator for SubmissionInput
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const submissionSchema = schema.components?.schemas?.SubmissionInput;
  if (!submissionSchema) {
    setFailed('OpenAPI spec has no components.schemas.SubmissionInput');
    return;
  }
  const validate = ajv.compile(submissionSchema);

  // Find all submission.json files
  const files = walk(SUBMISSIONS_DIR);
  if (files.length === 0) {
    summary.addRaw('No submission.json files found under submissions/.');
    return;
  }

  const results = [];
  const validLanes = new Set();

  for (const file of files) {
    const dirParts = parseDirParts(file);
    let payload;
    try {
      payload = JSON.parse(readFileSync(file, 'utf8'));
    } catch (e) {
      results.push({ file: relative(REPO_ROOT, file), ok: false, errors: [`invalid JSON: ${e.message}`] });
      continue;
    }

    const errors = [];
    if (!dirParts.ok) {
      if (dirParts.skip) {
        // Reference directory; mark as skipped and don't validate.
        results.push({ file: relative(REPO_ROOT, file), ok: true, errors: [], skipped: true, note: dirParts.reason });
        continue;
      }
      errors.push(`path: ${dirParts.reason}`);
    }

    // Ajv schema check
    if (!validate(payload)) {
      for (const e of validate.errors || []) {
        errors.push(`${e.instancePath || '/'} ${e.message}`);
      }
    }

    // Cross-field checks
    if (dirParts.ok) {
      if (payload.track !== dirParts.track) {
        errors.push(`track="${payload.track}" does not match directory "${dirParts.track}"`);
      }
      const expectedLanes = LANES_BY_QUARTER[dirParts.track] || [];
      if (payload.owner_lane && !expectedLanes.includes(payload.owner_lane)) {
        errors.push(`owner_lane "${payload.owner_lane}" is not in the ${dirParts.track} lane set (${expectedLanes.join(', ')})`);
      }
      if (payload.human_input_questions_answered != null) {
        const n = payload.human_input_questions_answered;
        if (n < 5 || n > 8) errors.push(`human_input_questions_answered must be 5-8, got ${n}`);
      }
    }

    // Safety floor (per quarter)
    if (dirParts.ok && payload.candidate) {
      if (dirParts.track === 'q1') {
        const banned = safetyCheckQ1(payload.candidate.smiles);
        if (banned) errors.push(`safety floor: ${banned}`);
      } else if (dirParts.track === 'q2') {
        const inciFile = join(file, '..', 'candidate.inci');
        if (existsSync(inciFile)) {
          const inciText = readFileSync(inciFile, 'utf8');
          const banned = safetyCheckQ2(inciText);
          if (banned) errors.push(`safety floor: ${banned}`);
        }
      }
    }

    // Hash integrity check (prompt.md must match prompt_sha256 if provided)
    if (payload.reproducibility?.prompt_sha256) {
      const promptFile = join(file, '..', 'prompt.md');
      if (existsSync(promptFile)) {
        const promptText = readFileSync(promptFile, 'utf8');
        const expected = 'sha256:' + require('node:crypto')
          .createHash('sha256').update(promptText, 'utf8').digest('hex');
        if (expected !== payload.reproducibility.prompt_sha256) {
          errors.push(`prompt_sha256 mismatch: declared ${payload.reproducibility.prompt_sha256}, actual ${expected}`);
        }
      } else {
        errors.push('prompt_sha256 declared but prompt.md is missing');
      }
    }

    const ok = errors.length === 0;
    if (ok && payload.owner_lane) validLanes.add(payload.owner_lane);
    results.push({ file: relative(REPO_ROOT, file), ok, errors, lane: payload.owner_lane, track: dirParts.track });
  }

  // Markdown report
  const lines = ['## LAGP submission validation', ''];
  const realResults = results.filter((r) => !r.skipped);
  const skippedResults = results.filter((r) => r.skipped);
  const okCount = realResults.filter((r) => r.ok).length;
  const failCount = realResults.length - okCount;
  lines.push(`**${okCount} / ${realResults.length} valid**${skippedResults.length ? ` (${skippedResults.length} reference template(s) skipped)` : ''}`, '');
  for (const r of realResults) {
    lines.push(`### ${r.ok ? '✅' : '❌'} \`${r.file}\``);
    if (r.lane) lines.push(`- track: \`${r.track}\` · lane: \`${r.lane}\``);
    if (!r.ok) {
      lines.push('- errors:');
      for (const e of r.errors) lines.push(`  - ${e}`);
    }
    lines.push('');
  }
  if (skippedResults.length) {
    lines.push('---', '', '### Reference templates (skipped, underscore prefix)', '');
    for (const r of skippedResults) {
      lines.push(`- \`${r.file}\` — ${r.note || 'public template'}`);
    }
    lines.push('');
  }
  writeFileSync('/tmp/validation-report.md', lines.join('\n'));
  setOutput('lanes', [...validLanes].join(','));

  if (failCount > 0) {
    setFailed(`${failCount} submission(s) failed validation`);
  } else {
    summary.addRaw(`✅ All ${okCount} submission(s) valid${skippedResults.length ? ` (${skippedResults.length} reference skipped)` : ''}`);
  }

  // eslint-disable-next-line no-console
  console.log(`Validated ${results.length} submission(s): ${okCount} OK, ${results.length - okCount} failed`);
}

main();
