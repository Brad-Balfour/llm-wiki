import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  carryForwardMaintenanceHistory,
  reconcileSessionBundles,
  recordMaintenanceAttempts,
} from '../src/commute/import-session-bundles.js';

const fixturePath = path.resolve('tests/fixtures/commute-bundles/valid-partial-bundle.json');
const validBundle = readFileSync(fixturePath, 'utf8');
const artifactFilename = '202607200745-morning-commute-session-bundle.txt';

test('stores append-only maintenance attempts and derives the latest retry state', () => {
  const initial = importFixture('2026-07-20T12:00:00.000Z');
  const maintenanceKey = initial.maintenance_candidates[0]?.maintenance_key;
  assert.ok(maintenanceKey);
  assert.deepEqual(initial.maintenance_attempts, []);
  assert.deepEqual(initial.maintenance_results, []);

  const inaccessible = recordMaintenanceAttempts(initial, [
    {
      maintenance_key: maintenanceKey,
      source: 'retrieval',
      status: 'inaccessible_source',
      detail: 'HTTP 404',
      attempted_at: '2026-07-20T12:01:00.000Z',
    },
  ]);
  const unresolved = recordMaintenanceAttempts(inaccessible, [
    {
      maintenance_key: maintenanceKey,
      source: 'maintainer',
      status: 'unresolved',
      detail: 'The retrieved page did not establish whether an existing concept should change.',
      attempted_at: '2026-07-21T12:01:00.000Z',
    },
  ]);
  const noChange = recordMaintenanceAttempts(unresolved, [
    {
      maintenance_key: maintenanceKey,
      source: 'maintainer',
      status: 'no_change',
      detail: 'The existing wiki already covers the source without a useful link change.',
      attempted_at: '2026-07-22T12:01:00.000Z',
    },
  ]);

  assert.equal(noChange.maintenance_attempts.length, 3);
  assert.deepEqual(noChange.maintenance_results, [
    {
      maintenance_key: maintenanceKey,
      bundle_session_id: '2026-07-20-morning-tldr-dev',
      event_id: 'event-002',
      source_url: 'https://example.com/first',
      latest_status: 'no_change',
      latest_detail: 'The existing wiki already covers the source without a useful link change.',
      latest_attempted_at: '2026-07-22T12:01:00.000Z',
      attempt_count: 3,
      retryable: true,
    },
  ]);
});

test('does not automatically retry a candidate whose created PR needs manual review', () => {
  const initial = importFixture('2026-07-20T12:00:00.000Z');
  const maintenanceKey = initial.maintenance_candidates[0]?.maintenance_key;
  assert.ok(maintenanceKey);

  const result = recordMaintenanceAttempts(initial, [
    {
      maintenance_key: maintenanceKey,
      source: 'maintainer',
      status: 'review_required',
      detail:
        'Maintainer created https://github.com/Brad-Balfour/llm-wiki/pull/99, but its structured result requires manual review.',
      attempted_at: '2026-07-20T12:00:00.000Z',
    },
  ]);

  assert.equal(result.maintenance_results[0]?.latest_status, 'review_required');
  assert.equal(result.maintenance_results[0]?.retryable, false);
});

test('carries history into a retry and keeps the same candidate identity', () => {
  const initial = importFixture('2026-07-20T12:00:00.000Z');
  const maintenanceKey = initial.maintenance_candidates[0]?.maintenance_key;
  assert.ok(maintenanceKey);
  const prior = recordMaintenanceAttempts(initial, [
    {
      maintenance_key: maintenanceKey,
      source: 'maintainer',
      status: 'no_change',
      detail: 'No useful change on the first attempt.',
      attempted_at: '2026-07-20T12:01:00.000Z',
    },
  ]);

  const retryImport = importFixture('2026-07-21T12:00:00.000Z');
  const carried = carryForwardMaintenanceHistory(retryImport, prior);
  const completed = recordMaintenanceAttempts(carried, [
    {
      maintenance_key: maintenanceKey,
      source: 'maintainer',
      status: 'pr_created',
      detail: 'Updated the existing concept and opened a PR.',
      attempted_at: '2026-07-21T12:01:00.000Z',
    },
  ]);

  assert.equal(completed.maintenance_attempts.length, 2);
  assert.equal(completed.maintenance_results[0]?.attempt_count, 2);
  assert.equal(completed.maintenance_results[0]?.latest_status, 'pr_created');
  assert.equal(completed.maintenance_results[0]?.retryable, false);
});

test('deduplicates an identical attempt without rewriting prior history', () => {
  const initial = importFixture('2026-07-20T12:00:00.000Z');
  const maintenanceKey = initial.maintenance_candidates[0]?.maintenance_key;
  assert.ok(maintenanceKey);
  const attempt = {
    maintenance_key: maintenanceKey,
    source: 'retrieval' as const,
    status: 'inaccessible_source' as const,
    detail: 'HTTP 404',
    attempted_at: '2026-07-20T12:01:00.000Z',
  };

  const once = recordMaintenanceAttempts(initial, [attempt]);
  const twice = recordMaintenanceAttempts(once, [attempt]);

  assert.equal(twice.maintenance_attempts.length, 1);
  assert.equal(twice.maintenance_results[0]?.attempt_count, 1);
});

test('rejects prior history from a different maintenance candidate', () => {
  const current = importFixture('2026-07-21T12:00:00.000Z');
  const prior = JSON.parse(JSON.stringify(importFixture('2026-07-20T12:00:00.000Z'))) as {
    maintenance_candidates: Array<{ url: string }>;
  };
  prior.maintenance_candidates[0]!.url = 'https://example.com/different';

  assert.throws(
    () => carryForwardMaintenanceHistory(current, prior),
    /does not match maintenance candidate/
  );
});

test('rejects duplicate attempts in prior history', () => {
  const current = importFixture('2026-07-21T12:00:00.000Z');
  const maintenanceKey = current.maintenance_candidates[0]?.maintenance_key;
  assert.ok(maintenanceKey);
  const prior = recordMaintenanceAttempts(importFixture('2026-07-20T12:00:00.000Z'), [
    {
      maintenance_key: maintenanceKey,
      source: 'retrieval',
      status: 'inaccessible_source',
      detail: 'HTTP 404',
      attempted_at: '2026-07-20T12:01:00.000Z',
    },
  ]);
  prior.maintenance_attempts.push(prior.maintenance_attempts[0]!);

  assert.throws(
    () => carryForwardMaintenanceHistory(current, prior),
    /duplicate maintenance attempt ids/
  );
});

function importFixture(importedAt: string) {
  return reconcileSessionBundles([{ filename: artifactFilename, text: validBundle }], importedAt);
}

// --- Item 2: single maintenance-candidate contract (issue #55) ---

test('reports a malformed prior-record URL as a named contract failure', () => {
  // Before consolidation this path let the URL constructor throw, surfacing a
  // raw `TypeError: Invalid URL` with no indication of which field was bad.
  // Both producers now share one parser, so the field is always named.
  const current = importFixture('2026-07-20T12:00:00.000Z');
  const candidate = current.maintenance_candidates[0];
  assert.ok(candidate);

  assert.throws(
    () =>
      carryForwardMaintenanceHistory(current, {
        schema_version: 'commute-session-import.v1',
        maintenance_candidates: [{ ...candidate, url: 'not a url' }],
      }),
    (error: unknown) =>
      error instanceof Error &&
      !(error instanceof TypeError) &&
      /Prior maintenance_candidates\[0\]\.url must be an HTTP\(S\) URL/.test(error.message)
  );
});

test('rejects a non-HTTP prior-record URL through the same shared rule', () => {
  const current = importFixture('2026-07-20T12:00:00.000Z');
  const candidate = current.maintenance_candidates[0];
  assert.ok(candidate);

  assert.throws(
    () =>
      carryForwardMaintenanceHistory(current, {
        schema_version: 'commute-session-import.v1',
        maintenance_candidates: [{ ...candidate, url: 'file:///etc/passwd' }],
      }),
    /Prior maintenance_candidates\[0\]\.url must be an HTTP\(S\) URL/
  );
});

test('both producers of a maintenance candidate share one parser', async () => {
  const shared = await import('../src/commute/maintenance.js');
  const retrieval = await import('../src/wiki/retrieve-maintenance-sources.js');
  const malformed = {
    maintenance_key: 'k',
    session_id: 's',
    event_id: 'e',
    source_item_id: 'i',
    title: 't',
    url: 'not a url',
  };

  // Same input, same field-scoped message, whichever entry point is used.
  assert.throws(
    () => shared.parseMaintenanceCandidate(malformed, 'field'),
    /field\.url must be an HTTP\(S\) URL/
  );
  assert.throws(
    () => retrieval.parseMaintenanceCandidate(malformed, 'field'),
    /field\.url must be an HTTP\(S\) URL/
  );
});
