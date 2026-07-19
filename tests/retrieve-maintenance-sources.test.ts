import assert from 'node:assert/strict';
import test from 'node:test';

import {
  retrieveMaintenanceSources,
  type MaintenanceCandidate,
} from '../src/wiki/retrieve-maintenance-sources.js';

const candidate: MaintenanceCandidate = {
  maintenance_key: 'session:event:https://example.com/article',
  session_id: 'session',
  event_id: 'event',
  source_item_id: 'item',
  title: 'Fallback title',
  url: 'https://example.com/article',
  status: 'pending',
};

test('retrieves and privately extracts readable source text', async () => {
  const result = await retrieveMaintenanceSources(
    [candidate],
    async () =>
      new Response(
        '<html><title>Example title</title><body>Hello <b>wiki</b><script>ignore()</script></body></html>',
        {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }
      ),
    '2026-07-20T12:00:00.000Z'
  );

  assert.deepEqual(result.sources[0], {
    maintenance_key: candidate.maintenance_key,
    source_item_id: 'item',
    requested_url: 'https://example.com/article',
    retrieved_at: '2026-07-20T12:00:00.000Z',
    status: 'retrieved',
    final_url: 'https://example.com/article',
    content_type: 'text/html; charset=utf-8',
    title: 'Example title',
    extracted_text: 'Example title Hello wiki',
  });
});

test('preserves inaccessible sources without inventing their content', async () => {
  const result = await retrieveMaintenanceSources(
    [candidate],
    async () => new Response('Not found', { status: 404 }),
    '2026-07-20T12:00:00.000Z'
  );

  assert.deepEqual(result.sources[0], {
    maintenance_key: candidate.maintenance_key,
    source_item_id: 'item',
    requested_url: 'https://example.com/article',
    retrieved_at: '2026-07-20T12:00:00.000Z',
    status: 'inaccessible',
    error: 'HTTP 404',
  });
});
