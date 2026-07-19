import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { reconcileSessionBundles } from '../src/commute/import-session-bundles.js';

const fixturePath = path.resolve('tests/fixtures/commute-bundles/valid-partial-bundle.json');
const validBundle = readFileSync(fixturePath, 'utf8');
const artifactFilename = '202607200745-morning-commute-session-bundle.txt';

test('reconciles a valid partial bundle without a second approval step', () => {
  const result = reconcileSessionBundles(
    [{ filename: artifactFilename, text: validBundle }],
    '2026-07-20T12:00:00.000Z'
  );

  assert.equal(result.sessions.length, 1);
  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.maintenance_candidates.length, 1);
  assert.deepEqual(result.maintenance_candidates[0], {
    maintenance_key: '2026-07-20-morning-tldr-dev:event-002:https://example.com/first',
    session_id: '2026-07-20-morning-tldr-dev',
    event_id: 'event-002',
    source_item_id: 'tldr-demo-001',
    title: 'First exact headline',
    url: 'https://example.com/first',
    status: 'pending',
  });
});

test('preserves an invalid bundle as a rejected independent session', () => {
  const result = reconcileSessionBundles(
    [
      { filename: artifactFilename, text: validBundle },
      { filename: 'broken.txt', text: '{not JSON' },
    ],
    '2026-07-20T12:00:00.000Z'
  );

  assert.equal(result.sessions[0]?.status, 'accepted');
  assert.equal(result.sessions[1]?.status, 'rejected');
  assert.match(result.sessions[1]?.error ?? '', /not valid JSON/);
  assert.equal(result.maintenance_candidates.length, 1);
});

test('isolates a bundle whose downloaded filename conflicts with its declaration', () => {
  const result = reconcileSessionBundles(
    [{ filename: 'commute-session-bundle.txt', text: validBundle }],
    '2026-07-20T12:00:00.000Z'
  );

  assert.equal(result.sessions[0]?.status, 'rejected');
  assert.match(result.sessions[0]?.error ?? '', /Bundle filename does not match/);
});
