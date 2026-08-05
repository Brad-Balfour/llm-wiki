import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isPrivateAddress,
  parseImportRecord,
  parseMaintenanceCandidate,
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

// --- Characterization tests (issue #55 item 1) ---
// These pin current observable behavior of previously uncovered branches so
// items 2 and 11 can restructure this module against a real safety net.

test('classifies a non-text content type as unsupported without extracting it', async () => {
  const result = await retrieveMaintenanceSources(
    [candidate],
    async () =>
      new Response('%PDF-1.7', {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      }),
    '2026-07-20T12:00:00.000Z',
    async () => '93.184.216.34'
  );

  assert.equal(result.sources[0]?.status, 'unsupported_content');
  assert.equal(result.sources[0]?.content_type, 'application/pdf');
  assert.equal(result.sources[0]?.extracted_text, undefined);
});

test('reports an unknown content type rather than guessing one', async () => {
  // A streamed body carries no automatic content-type, unlike a string body,
  // which the Response constructor labels text/plain.
  const result = await retrieveMaintenanceSources(
    [candidate],
    async () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('body'));
            controller.close();
          },
        }),
        { status: 200 }
      ),
    '2026-07-20T12:00:00.000Z',
    async () => '93.184.216.34'
  );

  assert.equal(result.sources[0]?.status, 'unsupported_content');
  assert.equal(result.sources[0]?.content_type, 'unknown');
});

test('rejects a declared content-length over the limit before reading the body', async () => {
  let bodyRead = false;
  const result = await retrieveMaintenanceSources(
    [candidate],
    async () => {
      const response = new Response('short', {
        status: 200,
        headers: { 'content-type': 'text/plain', 'content-length': '2000001' },
      });
      Object.defineProperty(response, 'body', {
        get() {
          bodyRead = true;
          return null;
        },
      });
      return response;
    },
    '2026-07-20T12:00:00.000Z',
    async () => '93.184.216.34'
  );

  assert.equal(bodyRead, false);
  assert.equal(result.sources[0]?.status, 'unsupported_content');
  assert.match(result.sources[0]?.error ?? '', /2000000 byte retrieval limit/);
});

test('treats a page with no readable text as inaccessible instead of retrieved', async () => {
  const result = await retrieveMaintenanceSources(
    [candidate],
    async () =>
      new Response('<html><body><script>only()</script></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    '2026-07-20T12:00:00.000Z',
    async () => '93.184.216.34'
  );

  assert.equal(result.sources[0]?.status, 'inaccessible');
  assert.equal(result.sources[0]?.error, 'No readable text was extracted');
});

test('falls back to the candidate title when the source carries none', async () => {
  const result = await retrieveMaintenanceSources(
    [candidate],
    async () =>
      new Response('plain body text', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    '2026-07-20T12:00:00.000Z',
    async () => '93.184.216.34'
  );

  assert.equal(result.sources[0]?.status, 'retrieved');
  assert.equal(result.sources[0]?.title, 'Fallback title');
});

test('follows redirects and records the final URL it actually read', async () => {
  const requested: string[] = [];
  const result = await retrieveMaintenanceSources(
    [candidate],
    async (url) => {
      requested.push(url);
      if (requested.length === 1) {
        return new Response('', { status: 301, headers: { location: '/moved' } });
      }
      return new Response('destination text', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      });
    },
    '2026-07-20T12:00:00.000Z',
    async () => '93.184.216.34'
  );

  assert.deepEqual(requested, ['https://example.com/article', 'https://example.com/moved']);
  assert.equal(result.sources[0]?.status, 'retrieved');
  assert.equal(result.sources[0]?.final_url, 'https://example.com/moved');
});

test('refuses a redirect chain that leaves HTTP(S)', async () => {
  const result = await retrieveMaintenanceSources(
    [candidate],
    async () => new Response('', { status: 302, headers: { location: 'file:///etc/passwd' } }),
    '2026-07-20T12:00:00.000Z',
    async () => '93.184.216.34'
  );

  assert.equal(result.sources[0]?.status, 'inaccessible');
  assert.match(result.sources[0]?.error ?? '', /non-HTTP\(S\) URL/);
});

test('refuses a redirect that omits its Location header', async () => {
  const result = await retrieveMaintenanceSources(
    [candidate],
    async () => new Response('', { status: 302 }),
    '2026-07-20T12:00:00.000Z',
    async () => '93.184.216.34'
  );

  assert.equal(result.sources[0]?.status, 'inaccessible');
  assert.match(result.sources[0]?.error ?? '', /no Location header/);
});

test('stops following a redirect loop at the configured limit', async () => {
  let hops = 0;
  const result = await retrieveMaintenanceSources(
    [candidate],
    async () => {
      hops += 1;
      return new Response('', { status: 302, headers: { location: `/hop-${hops}` } });
    },
    '2026-07-20T12:00:00.000Z',
    async () => '93.184.216.34'
  );

  assert.equal(hops, 6);
  assert.equal(result.sources[0]?.status, 'inaccessible');
  assert.match(result.sources[0]?.error ?? '', /exceeded 5 redirects/);
});

test('re-resolves the host on every redirect hop', async () => {
  const resolved: string[] = [];
  await retrieveMaintenanceSources(
    [candidate],
    async () =>
      resolved.length === 1
        ? new Response('', { status: 302, headers: { location: 'https://elsewhere.test/x' } })
        : new Response('text', { status: 200, headers: { 'content-type': 'text/plain' } }),
    '2026-07-20T12:00:00.000Z',
    async (hostname) => {
      resolved.push(hostname);
      return '93.184.216.34';
    }
  );

  assert.deepEqual(resolved, ['example.com', 'elsewhere.test']);
});

test('blocks localhost retrieval without performing a DNS lookup or a fetch', async () => {
  let fetchCalled = false;
  const result = await retrieveMaintenanceSources(
    [{ ...candidate, url: 'http://localhost:8080/private' }],
    async () => {
      fetchCalled = true;
      return new Response('unexpected', { status: 200 });
    },
    '2026-07-20T12:00:00.000Z'
  );

  assert.equal(fetchCalled, false);
  assert.equal(result.sources[0]?.status, 'inaccessible');
  assert.equal(result.sources[0]?.error, 'Localhost source retrieval is not allowed');
});

test('parses a prior import record into pending maintenance candidates', () => {
  const record = parseImportRecord({
    maintenance_candidates: [
      {
        maintenance_key: 'key',
        session_id: 'session',
        event_id: 'event',
        source_item_id: 'item',
        title: 'Title',
        url: 'https://example.com/a',
        status: 'pending',
      },
    ],
  });

  assert.equal(record.maintenance_candidates.length, 1);
  assert.equal(record.maintenance_candidates[0]?.status, 'pending');
});

test('rejects import records that are not an object with maintenance candidates', () => {
  assert.throws(() => parseImportRecord([]), /must be an object/);
  assert.throws(() => parseImportRecord(null), /must be an object/);
  assert.throws(() => parseImportRecord({}), /must contain maintenance_candidates/);
});

test('rejects a maintenance candidate with a non-HTTP or missing identity', () => {
  const valid = {
    maintenance_key: 'key',
    session_id: 'session',
    event_id: 'event',
    source_item_id: 'item',
    title: 'Title',
    url: 'https://example.com/a',
  };

  assert.throws(() => parseMaintenanceCandidate([], 'field'), /field must be an object/);
  assert.throws(
    () => parseMaintenanceCandidate({ ...valid, url: 'ftp://example.com/a' }, 'field'),
    /field\.url must be an HTTP\(S\) URL/
  );
  assert.throws(
    () => parseMaintenanceCandidate({ ...valid, url: 'not a url' }, 'field'),
    /field\.url must be an HTTP\(S\) URL/
  );
  assert.throws(
    () => parseMaintenanceCandidate({ ...valid, title: '  ' }, 'field'),
    /field\.title must be a non-empty string/
  );
});
