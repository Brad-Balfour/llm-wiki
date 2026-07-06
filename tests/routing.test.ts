import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

import type { ClassificationRecord } from '../src/classifier/types.js';
import {
  deriveClassifierValidationFailureRoute,
  deriveParserFailureRoute,
  deriveRouteFromClassification,
} from '../src/routing/derive.js';
import type { RouteDecision } from '../src/routing/derive.js';

interface RoutingFixtureCase {
  case: string;
  classification: Pick<
    ClassificationRecord,
    'interest_level' | 'interest_score' | 'consumption_depth' | 'depth_score'
  >;
  route: RouteDecision;
}

test('derives routing in application code from source-neutral classification', async () => {
  const cases = JSON.parse(
    await readFile(
      resolve(process.cwd(), 'tests/fixtures/expected/routing/default-routes.json'),
      'utf8'
    )
  ) as RoutingFixtureCase[];

  for (const fixture of cases) {
    const record: ClassificationRecord = {
      classifier_item_id: fixture.case,
      signals: ['fixture'],
      reason: 'Fixture route derivation.',
      ...fixture.classification,
    };

    assert.deepEqual(deriveRouteFromClassification(record), fixture.route, fixture.case);
  }
});

test('routes parser and classifier validation failures to review', () => {
  assert.deepEqual(deriveParserFailureRoute(), {
    route_version: 'routing-rules.v1',
    commute_behavior: 'none',
    wiki_behavior: 'none',
    stream_log: 'none',
    review: 'parse_error',
    discard: false,
  });

  assert.deepEqual(deriveClassifierValidationFailureRoute(), {
    route_version: 'routing-rules.v1',
    commute_behavior: 'none',
    wiki_behavior: 'none',
    stream_log: 'none',
    review: 'validation_error',
    discard: false,
  });
});
