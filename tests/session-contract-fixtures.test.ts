import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { reconcileSessionBundles } from '../src/commute/import-session-bundles.js';
import {
  parseCommuteSessionBundleText,
  queueSnapshotFingerprint,
} from '../src/commute/session-bundle.js';

type PathPart = string | number;

interface Mutation {
  op: 'set' | 'delete' | 'append';
  path: PathPart[];
  value?: unknown;
}

interface FixtureCase {
  id: string;
  description: string;
  input_filename: string;
  expected: 'accepted' | 'rejected';
  error?: string;
  text?: string;
  mutations: Mutation[];
}

interface FixtureManifest {
  fixture_version: number;
  base_fixture: string;
  cases: FixtureCase[];
}

const fixtureDirectory = path.resolve('tests/fixtures/commute-bundles');
const manifest = JSON.parse(
  readFileSync(path.join(fixtureDirectory, 'session-contract-cases.json'), 'utf8')
) as FixtureManifest;
const baseBundle = JSON.parse(
  readFileSync(path.join(fixtureDirectory, manifest.base_fixture), 'utf8')
) as Record<string, unknown>;

test('session-contract fixture manifest has unique scenario ids', () => {
  assert.equal(manifest.fixture_version, 1);
  assert.ok(manifest.cases.length >= 15);
  assert.equal(new Set(manifest.cases.map((fixture) => fixture.id)).size, manifest.cases.length);
});

for (const fixture of manifest.cases) {
  test(`session-contract fixture: ${fixture.id}`, () => {
    const text = fixtureText(fixture);
    const rejectionPattern =
      fixture.expected === 'rejected' ? requiredErrorPattern(fixture) : undefined;

    if (fixture.expected === 'accepted') {
      const parsed = parseCommuteSessionBundleText(text);
      assert.equal(parsed.schema_version, 'commute-session-bundle.v1');
    } else {
      assert.ok(rejectionPattern);
      assert.throws(() => parseCommuteSessionBundleText(text), rejectionPattern);
    }

    const imported = reconcileSessionBundles([{ filename: fixture.input_filename, text }]);
    assert.equal(imported.sessions[0]?.status, fixture.expected);
    if (fixture.expected === 'rejected') {
      assert.ok(rejectionPattern);
      assert.match(imported.sessions[0]?.error ?? '', rejectionPattern);
    }
  });
}

test('same queue filename with different content stays independently fingerprinted and imported', () => {
  const baseCase = requiredFixture('valid-single-queue-partial');
  const alternateCase = requiredFixture('same-queue-filename-different-content');
  const base = parseCommuteSessionBundleText(fixtureText(baseCase));
  const alternate = parseCommuteSessionBundleText(fixtureText(alternateCase));

  assert.equal(base.queue_snapshot.filename, alternate.queue_snapshot.filename);
  const baseFingerprint = queueSnapshotFingerprint(base.queue_snapshot.queue);
  const alternateFingerprint = queueSnapshotFingerprint(alternate.queue_snapshot.queue);
  assert.notEqual(baseFingerprint, alternateFingerprint);

  const imported = reconcileSessionBundles([
    { filename: baseCase.input_filename, text: fixtureText(baseCase) },
    { filename: alternateCase.input_filename, text: fixtureText(alternateCase) },
  ]);
  assert.deepEqual(
    imported.sessions.map((session) => session.status),
    ['accepted', 'accepted']
  );
  assert.notEqual(imported.sessions[0]?.session_id, imported.sessions[1]?.session_id);
  assert.deepEqual(
    imported.sessions.map((session) => session.queue_fingerprint),
    [baseFingerprint, alternateFingerprint]
  );
});

test('two same-day exports and a Library-suffixed artifact remain independent', () => {
  const firstCase = requiredFixture('valid-single-queue-partial');
  const secondCase = requiredFixture('same-day-library-suffixed-export');
  const imported = reconcileSessionBundles([
    { filename: firstCase.input_filename, text: fixtureText(firstCase) },
    { filename: secondCase.input_filename, text: fixtureText(secondCase) },
  ]);

  assert.deepEqual(
    imported.sessions.map((session) => session.status),
    ['accepted', 'accepted']
  );
  assert.notEqual(imported.sessions[0]?.session_id, imported.sessions[1]?.session_id);
  assert.notEqual(imported.sessions[0]?.input_filename, imported.sessions[1]?.input_filename);
});

test('restart and duplicate recognition fixtures preserve unresolved evidence, not classifier feedback', () => {
  const restart = requiredFixture('recovered-terminal-voice-restart');
  const duplicate = requiredFixture('duplicate-recognition-becomes-unresolved');
  const imported = reconcileSessionBundles([
    { filename: restart.input_filename, text: fixtureText(restart) },
    {
      filename: '202607200900-morning-commute-session-bundle.txt',
      text: fixtureText(withDistinctSession(duplicate)),
    },
  ]);

  assert.deepEqual(
    imported.sessions.map((session) => session.status),
    ['accepted', 'accepted']
  );
  assert.equal(imported.unresolved_captures.length, 2);
  assert.equal(imported.feedback_events.length, 0);
});

function fixtureText(fixture: FixtureCase): string {
  if (fixture.text !== undefined) return fixture.text;
  const bundle = clone(baseBundle);
  for (const mutation of fixture.mutations) {
    applyMutation(bundle, mutation);
  }
  return JSON.stringify(bundle);
}

function applyMutation(root: Record<string, unknown>, mutation: Mutation): void {
  const { parent, key } = resolveParent(root, mutation.path);
  if (mutation.op === 'set') {
    setChild(parent, key, clone(mutation.value));
  } else if (mutation.op === 'delete') {
    if (Array.isArray(parent) && typeof key === 'number') {
      parent.splice(key, 1);
    } else {
      assert.equal(typeof key, 'string');
      delete (parent as Record<string, unknown>)[key];
    }
  } else {
    const target = getChild(parent, key);
    assert.ok(Array.isArray(target), `append target ${mutation.path.join('.')} must be an array`);
    target.push(clone(mutation.value));
  }
}

function setChild(
  parent: Record<string | number, unknown> | unknown[],
  key: PathPart,
  value: unknown
): void {
  if (Array.isArray(parent)) {
    assert.equal(typeof key, 'number');
    parent[key as number] = value;
  } else {
    parent[key] = value;
  }
}

function getChild(parent: Record<string | number, unknown> | unknown[], key: PathPart): unknown {
  if (Array.isArray(parent)) {
    assert.equal(typeof key, 'number');
    return parent[key as number];
  }
  return parent[key];
}

function resolveParent(
  root: Record<string, unknown>,
  pathParts: PathPart[]
): { parent: Record<string | number, unknown> | unknown[]; key: PathPart } {
  assert.ok(pathParts.length > 0, 'mutation path must not be empty');
  let current: unknown = root;
  for (const part of pathParts.slice(0, -1)) {
    assert.ok(
      (typeof current === 'object' && current !== null) || Array.isArray(current),
      `mutation path ${pathParts.join('.')} has a non-container parent`
    );
    current = (current as Record<string | number, unknown>)[part];
  }
  assert.ok(
    (typeof current === 'object' && current !== null) || Array.isArray(current),
    `mutation path ${pathParts.join('.')} has a non-container parent`
  );
  return {
    parent: current as Record<string | number, unknown> | unknown[],
    key: pathParts.at(-1)!,
  };
}

function requiredFixture(id: string): FixtureCase {
  const fixture = manifest.cases.find((candidate) => candidate.id === id);
  assert.ok(fixture, `missing fixture ${id}`);
  return fixture;
}

function requiredErrorPattern(fixture: FixtureCase): RegExp {
  assert.ok(fixture.error, `rejected fixture ${fixture.id} must declare its expected error`);
  return new RegExp(escapeRegExp(fixture.error));
}

function withDistinctSession(fixture: FixtureCase): FixtureCase {
  return {
    ...fixture,
    input_filename: '202607200900-morning-commute-session-bundle.txt',
    mutations: [
      ...fixture.mutations,
      {
        op: 'set',
        path: ['session', 'session_id'],
        value: '2026-07-20-morning-tldr-dev-duplicate-recognition',
      },
      {
        op: 'set',
        path: ['session', 'artifact_filename'],
        value: '202607200900-morning-commute-session-bundle.txt',
      },
    ],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
