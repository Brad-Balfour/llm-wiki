import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { importUrlListText, runWikiUrlListImportCommand } from '../src/wiki/import-url-list.js';

test('imports URL lists and resolves TLDR tracking links to final article URLs', async () => {
  const result = await importUrlListText(
    `https://tracking.tldrnewsletter.com/CL0/https:%2F%2Flinks.tldrnewsletter.com%2FsFNfjC/1/example
https://example.com/final-article
`,
    async (input, init) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (method === 'HEAD' && url === 'https://links.tldrnewsletter.com/sFNfjC') {
        return {
          ok: true,
          status: 200,
          url: 'https://example.com/final-article',
        } as Response;
      }
      if (method === 'HEAD' && url === 'https://example.com/final-article') {
        return {
          ok: true,
          status: 200,
          url: 'https://example.com/final-article',
        } as Response;
      }
      throw new Error(`unexpected ${method} request to ${url}`);
    },
    new Date('2026-07-14T00:00:00.000Z')
  );

  assert.equal(result.drafts.length, 1);
  assert.equal(result.review.length, 0);
  assert.equal(result.drafts[0]?.url, 'https://example.com/final-article');
  assert.equal(result.drafts[0]?.suggested_slug, 'final-article');
});

test('CLI writes imported draft output and review records for failed URL resolution', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'llm-wiki-url-import-'));
  const inputPath = path.join(root, 'urls.txt');
  const outputPath = path.join(root, 'url-import.json');
  await writeFile(
    inputPath,
    `https://tracking.tldrnewsletter.com/CL0/https:%2F%2Flinks.tldrnewsletter.com%2Fok/1/example
https://example.com/fail
`
  );

  const exitCode = await runWikiUrlListImportCommand(
    ['--input', inputPath, '--output', outputPath],
    {
      fetchImpl: async (input, init) => {
        const url = String(input);
        const method = init?.method ?? 'GET';
        if (method === 'HEAD' && url === 'https://links.tldrnewsletter.com/ok') {
          return {
            ok: true,
            status: 200,
            url: 'https://example.com/success',
          } as Response;
        }
        if (method === 'HEAD' && url === 'https://example.com/fail') {
          return {
            ok: false,
            status: 404,
            url,
          } as Response;
        }
        if (method === 'GET' && url === 'https://example.com/fail') {
          return {
            ok: false,
            status: 404,
            url,
          } as Response;
        }
        throw new Error(`unexpected ${method} request to ${url}`);
      },
      now: new Date('2026-07-14T00:00:00.000Z'),
    }
  );

  assert.equal(exitCode, 2);
  const written = JSON.parse(await readFile(outputPath, 'utf8')) as {
    drafts: Array<{ url: string }>;
    review: Array<{ input: string; reason: string }>;
  };
  assert.equal(written.drafts.length, 1);
  assert.equal(written.drafts[0]?.url, 'https://example.com/success');
  assert.equal(written.review.length, 1);
  assert.equal(written.review[0]?.input, 'https://example.com/fail');
  assert.match(written.review[0]?.reason ?? '', /status 404/);
});
