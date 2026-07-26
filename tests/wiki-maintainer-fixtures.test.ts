import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  maintenanceAttemptsFromAgentResult,
  maintenanceAttemptsFromRetrieval,
  type AgentResult,
} from '../src/wiki/maintain-commute.js';

interface BaseFixture {
  id: string;
  description: string;
  maintenance_key: string;
  detail: string;
  expected_attempt_status: string;
  review_checks: string[];
}

interface RetrievalFixture extends BaseFixture {
  boundary: 'retrieval';
  requested_url: string;
  retrieval_status: 'inaccessible' | 'unsupported_content';
}

interface MaintainerFixture extends BaseFixture {
  boundary: 'maintainer';
  overall_status: AgentResult['status'];
  candidate_status: AgentResult['results'][number]['status'];
}

interface FixtureManifest {
  fixture_version: number;
  cases: Array<RetrievalFixture | MaintainerFixture>;
}

const manifest = JSON.parse(
  readFileSync(path.resolve('tests/fixtures/wiki-maintenance-cases.json'), 'utf8')
) as FixtureManifest;
const reviewGuide = readFileSync(path.resolve('docs/wiki-maintainer-pr-review.md'), 'utf8');

test('wiki-maintainer declarative review fixtures cover every task 4.3 outcome', () => {
  assert.equal(manifest.fixture_version, 1);
  assert.deepEqual(manifest.cases.map((fixture) => fixture.id).sort(), [
    'duplicate-source-concept',
    'existing-concept-update',
    'inaccessible-url',
    'useful-link-only-change',
  ]);
  assert.equal(new Set(manifest.cases.map((fixture) => fixture.id)).size, manifest.cases.length);
  for (const fixture of manifest.cases) {
    assert.ok(fixture.description.length > 0);
    assert.ok(fixture.review_checks.length >= 2);
    if (fixture.boundary === 'maintainer') {
      assert.match(fixture.detail, /wiki\/.+\.md/);
      const mentionedPaths = fixture.detail.match(/wiki\/[a-z0-9/-]+\.md/g) ?? [];
      assert.ok(mentionedPaths.length > 0);
      for (const mentionedPath of mentionedPaths) {
        assert.doesNotThrow(() => readFileSync(path.resolve(mentionedPath), 'utf8'));
      }
    }
  }
});

test('wiki-maintainer review guidance covers the fixture families without enabling auto-merge', () => {
  for (const heading of [
    '## Inaccessible URL',
    '## Duplicate Source Concept',
    '## Existing-Concept Update',
    '## Link-Only Change',
  ]) {
    assert.match(reviewGuide, new RegExp(heading));
  }
  assert.match(reviewGuide, /do not define an auto-merge\s+subset/);
});

for (const fixture of manifest.cases) {
  test(`wiki-maintainer result-recording fixture: ${fixture.id}`, () => {
    const attempt =
      fixture.boundary === 'retrieval'
        ? maintenanceAttemptsFromRetrieval({
            schema_version: 'commute-source-retrieval.v1',
            retrieved_at: '2026-07-26T12:00:00.000Z',
            sources: [
              {
                maintenance_key: fixture.maintenance_key,
                source_item_id: `source-${fixture.id}`,
                requested_url: fixture.requested_url,
                status: fixture.retrieval_status,
                retrieved_at: '2026-07-26T12:00:00.000Z',
                error: fixture.detail,
              },
            ],
          })[0]
        : maintenanceAttemptsFromAgentResult(
            {
              schema_version: 'commute-maintenance-result.v1',
              status: fixture.overall_status,
              branch: 'commute-maintenance-fixture',
              ...(fixture.overall_status === 'pr_created'
                ? { pr_url: 'https://github.com/Brad-Balfour/llm-wiki/pull/999' }
                : {}),
              results: [
                {
                  maintenance_key: fixture.maintenance_key,
                  status: fixture.candidate_status,
                  detail: fixture.detail,
                },
              ],
            },
            [fixture.maintenance_key],
            '2026-07-26T12:00:00.000Z'
          )[0];

    assert.ok(attempt);
    assert.equal(attempt.status, fixture.expected_attempt_status);
    assert.equal(attempt.detail, fixture.detail);
  });
}
