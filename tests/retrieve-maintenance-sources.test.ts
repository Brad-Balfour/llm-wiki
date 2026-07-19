import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isPrivateAddress,
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
    '2026-07-20T12:00:00.000Z',
    async () => '93.184.216.34'
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
    '2026-07-20T12:00:00.000Z',
    async () => '93.184.216.34'
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

test('does not fetch a source whose host resolves to a private address', async () => {
  let fetchCalled = false;
  const result = await retrieveMaintenanceSources(
    [candidate],
    async () => {
      fetchCalled = true;
      return new Response('unexpected', { status: 200 });
    },
    '2026-07-20T12:00:00.000Z',
    async () => {
      throw new Error('Private-network source retrieval is not allowed');
    }
  );

  assert.equal(fetchCalled, false);
  assert.equal(result.sources[0]?.status, 'inaccessible');
  assert.match(result.sources[0]?.error ?? '', /Private-network/);
});

test('stops reading a source that exceeds the byte limit while streaming', async () => {
  const oversizedBody = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('x'.repeat(1_500_000)));
      controller.enqueue(new TextEncoder().encode('x'.repeat(600_000)));
      controller.close();
    },
  });
  const result = await retrieveMaintenanceSources(
    [candidate],
    async () => new Response(oversizedBody, { headers: { 'content-type': 'text/plain' } }),
    '2026-07-20T12:00:00.000Z',
    async () => '93.184.216.34'
  );

  assert.equal(result.sources[0]?.status, 'unsupported_content');
  assert.match(result.sources[0]?.error ?? '', /2000000 byte retrieval limit/);
});

test('recognizes mapped, shared, and benchmarking addresses as non-public', () => {
  for (const address of [
    '::ffff:127.0.0.1',
    '::ffff:192.168.1.1',
    '100.64.0.1',
    '198.18.0.1',
    '198.19.255.255',
  ]) {
    assert.equal(isPrivateAddress(address), true, `${address} must be blocked`);
  }
  assert.equal(isPrivateAddress('93.184.216.34'), false);
});
