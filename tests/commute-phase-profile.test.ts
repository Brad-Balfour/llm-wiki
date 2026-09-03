import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  PHASES,
  phaseProfileFile,
  summarizePhaseProfile,
  validatePhaseProfile,
} from '../src/commute/phase-profile.js';

function fixture() {
  const profile = {
    schema_version: 'commute-phase-profile.v1',
    run_id: 'test',
    model: 'gpt-5.6-sol',
    reasoning_effort: 'low',
    phases: PHASES.map((phase, index) => ({
      phase,
      started_at: `2026-09-02T00:0${index}:00Z`,
      completed_at: `2026-09-02T00:0${index + 1}:00Z`,
      active_seconds: 10,
      tool_execution_seconds: 4,
      tool_call_count: 2,
      retry_seconds: 1,
      work_units: 2,
      note: null as string | null,
    })),
  };
  const run = {
    schema_version: 'commute-performance-run.v1',
    run_id: 'test',
    experiment: { actual_model: profile.model, actual_reasoning_effort: 'low' },
    phases: {
      task_invoked_at: '2026-09-02T00:00:00Z',
      terminal_completed_at: '2026-09-02T00:05:00Z',
    },
    durations_seconds: { strict_agent_active: 50, tool_execution: 20 },
    activity: { tool_call_count: 10 },
    workload: { bundles: 2 },
  };
  return { profile, run };
}

test('published profile schema covers the runtime taxonomy and requires every phase', async () => {
  const schema = JSON.parse(await readFile('schema/commute-phase-profile-v1.schema.json', 'utf8'));
  assert.equal(schema.properties.schema_version.const, fixture().profile.schema_version);
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.$defs.phase.additionalProperties, false);
  assert.deepEqual(schema.$defs.phase.properties.phase.enum, [...PHASES]);
  assert.equal(schema.properties.phases.minItems, PHASES.length);
  assert.equal(schema.properties.phases.maxItems, PHASES.length);
  assert.deepEqual(
    schema.properties.phases.allOf.map(
      (rule: { contains: { properties: { phase: { const: string } } } }) =>
        rule.contains.properties.phase.const
    ),
    [...PHASES]
  );
  assert.deepEqual(schema.$defs.phase.required, Object.keys(fixture().profile.phases[0]!));
});

test('five-phase summary reconciles totals, residuals and seconds per bundle', () => {
  const { profile, run } = fixture();
  profile.phases.reverse();
  const summary = summarizePhaseProfile(validatePhaseProfile(profile, run));
  assert.match(summary, /acquisition \| 10.00 \| 4.00 \| 6.00 \| 1.00 \| 5.00/);
  assert.match(summary, /Total \| 50.00 \| 20.00 \| 30.00 \| 5.00 \| 25.00/);
});

test('rejects missing, duplicate, unknown phases and arbitrary content fields', () => {
  for (const phases of [
    PHASES.slice(1),
    [...PHASES, 'acquisition'],
    [...PHASES.slice(1), 'acquisition-extra'],
    [...PHASES.slice(1), 'cleanup_finalization'],
  ]) {
    const { profile, run } = fixture();
    assert.throws(() =>
      validatePhaseProfile(
        { ...profile, phases: phases.map((phase) => ({ ...profile.phases[0], phase })) },
        run
      )
    );
  }
  const { profile, run } = fixture();
  assert.throws(
    () => validatePhaseProfile({ ...profile, transcript: 'unwanted' }, run),
    /unsupported/
  );
});

test('rejects invalid measurements, timestamps, identity and workload', () => {
  for (const change of [
    { active_seconds: -1 },
    { active_seconds: Infinity },
    { active_seconds: NaN },
    { active_seconds: 61 },
    { tool_execution_seconds: 11 },
    { retry_seconds: 5 },
    { tool_call_count: 0 },
    { tool_call_count: 0.5 },
    { work_units: 3 },
    { completed_at: '2026-09-01T00:00:00Z' },
    { started_at: '2026-02-31T00:00:00Z' },
    { started_at: '2026-09-01T00:00:00Z' },
    { completed_at: '2026-09-03T00:00:00Z' },
    { note: 'x'.repeat(161) },
  ]) {
    const { profile, run } = fixture();
    Object.assign(profile.phases[0]!, change);
    assert.throws(() => validatePhaseProfile(profile, run));
  }
  for (const change of [{ run_id: '../test' }, { model: 'other' }, { reasoning_effort: 'Light' }]) {
    const { profile, run } = fixture();
    assert.throws(() => validatePhaseProfile({ ...profile, ...change }, run));
  }
});

test('wall-clock human waiting is excluded; totals allow at most two seconds rounding', () => {
  const { profile, run } = fixture();
  assert.equal(validatePhaseProfile(profile, run).phases[3]!.active_seconds, 10);
  profile.phases[3]!.active_seconds = 60; // Counting the 50 seconds spent waiting for Brad fails.
  assert.throws(() => validatePhaseProfile(profile, run), /reconcile/);
  profile.phases[3]!.active_seconds = 12;
  validatePhaseProfile(profile, run);
  profile.phases[3]!.active_seconds = 12.001;
  assert.throws(() => validatePhaseProfile(profile, run), /reconcile/);
  profile.phases[3]!.active_seconds = 10;
  profile.phases[0]!.tool_execution_seconds = 7;
  assert.throws(() => validatePhaseProfile(profile, run), /reconcile/);
});

test('skipped phases require a reason and zero values', () => {
  const { profile, run } = fixture();
  Object.assign(profile.phases[2]!, {
    active_seconds: 0,
    tool_execution_seconds: 0,
    tool_call_count: 0,
    retry_seconds: 0,
    work_units: 0,
  });
  run.durations_seconds = { strict_agent_active: 40, tool_execution: 16 };
  run.activity.tool_call_count = 8;
  assert.throws(() => validatePhaseProfile(profile, run), /Skipped/);
  profile.phases[2]!.note = 'No tracked changes';
  assert.match(
    summarizePhaseProfile(validatePhaseProfile(profile, run)),
    /repository_work \| 0.00 \| 0.00 \| 0.00 \| 0.00 \| n\/a/
  );
});

test('private recording is immutable, summary is read-only, and symlinks cannot escape', async () => {
  const cwd = process.cwd();
  const root = await mkdtemp(path.join(os.tmpdir(), 'phase-profile-'));
  try {
    process.chdir(root);
    await mkdir('.private/commute-performance', { recursive: true });
    const { profile, run } = fixture();
    const input = '.private/input.json';
    const finalized = '.private/commute-performance/test.json';
    const output = '.private/commute-performance/test-phase-profile.json';
    await writeFile(input, JSON.stringify(profile));
    await writeFile(finalized, JSON.stringify(run));
    const table = await phaseProfileFile('record', input, finalized);
    assert.equal(await phaseProfileFile('summary', output, finalized), table);
    assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), profile);
    await assert.rejects(phaseProfileFile('record', input, finalized), /EEXIST/);
    await writeFile('outside.json', JSON.stringify(profile));
    await assert.rejects(phaseProfileFile('record', 'outside.json', finalized), /inside/);
    await symlink(path.join(root, 'outside.json'), '.private/escape.json');
    await assert.rejects(phaseProfileFile('record', '.private/escape.json', finalized), /outside/);
    await rm(output);
    await symlink(path.join(root, 'outside.json'), output);
    await assert.rejects(phaseProfileFile('record', input, finalized), /outside/);
  } finally {
    process.chdir(cwd);
    await rm(root, { recursive: true, force: true });
  }
});
