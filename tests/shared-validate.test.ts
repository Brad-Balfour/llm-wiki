import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { errorCode, errorMessage, isExistingFile, isMissingFile } from '../src/shared/errors.js';
import { parseJsonObject, stripMarkdownFence } from '../src/shared/json.js';
import { requireDate, requireDateTime, requireIsoTimestamp } from '../src/shared/time.js';
import { requireHttpUrl } from '../src/shared/url.js';
import {
  optionalString,
  rejectUnknownKeys,
  requireArray,
  requireEnum,
  requirePositiveInteger,
  requireRecord,
  requireScore,
  requireString,
  requireStringArray,
  requireUniqueStrings,
} from '../src/shared/validate.js';

test('structural rules name the offending field in one wording each', () => {
  assert.throws(() => requireRecord([], 'f'), /^Error: f must be an object$/);
  assert.throws(() => requireRecord(null, 'f'), /f must be an object/);
  assert.throws(() => requireArray({}, 'f'), /f must be an array/);
  assert.throws(() => requireString('  ', 'f'), /f must be a non-empty string/);
  assert.throws(() => requireString(7, 'f'), /f must be a non-empty string/);
  assert.throws(() => requireStringArray([''], 'f'), /f\[0\] must be a non-empty string/);
  assert.throws(() => requirePositiveInteger(0, 'f'), /f must be a positive integer/);
  assert.throws(() => requireScore(1.5, 'f'), /f must be a number from 0 through 1/);
  assert.throws(() => requireEnum('x', ['a', 'b'] as const, 'f'), /f must be one of: a, b/);
  assert.throws(() => requireUniqueStrings(['a', 'a'], 'f'), /f must contain unique values/);
  assert.throws(
    () => rejectUnknownKeys({ a: 1, b: 2 }, ['a'], 'f'),
    /f contains unsupported fields: b/
  );

  assert.equal(optionalString(undefined, 'f'), undefined);
  assert.equal(optionalString('v', 'f'), 'v');
  assert.equal(requireScore(0, 'f'), 0);
  assert.equal(requireScore(1, 'f'), 1);
});

test('a calendar date must be real, not merely well-shaped', () => {
  // The drift this consolidation closes: Date.parse alone accepts 2026-02-31
  // and rolls it forward to 3 March, so one validator used to accept a date
  // another rejected.
  assert.equal(Number.isNaN(Date.parse('2026-02-31T00:00:00Z')), false);

  assert.throws(() => requireDate('2026-02-31', 'f'), /f must be a real calendar date/);
  assert.throws(() => requireDate('2026-04-31', 'f'), /f must be a real calendar date/);
  assert.throws(() => requireDate('2026-13-01', 'f'), /f must be a real calendar date/);
  assert.throws(() => requireDate('20260101', 'f'), /f must use YYYY-MM-DD/);
  assert.equal(requireDate('2026-02-28', 'f'), '2026-02-28');
  assert.equal(requireDate('2024-02-29', 'f'), '2024-02-29');
});

test('an RFC 3339 timestamp needs a timezone and a real date', () => {
  assert.equal(requireDateTime('2026-07-20T12:00:00Z', 'f'), '2026-07-20T12:00:00Z');
  assert.equal(
    requireDateTime('2026-07-20T12:00:00.500+01:00', 'f'),
    '2026-07-20T12:00:00.500+01:00'
  );
  assert.throws(
    () => requireDateTime('2026-07-20T12:00:00', 'f'),
    /f must be an RFC 3339 timestamp with a timezone/
  );
  assert.throws(
    () => requireDateTime('2026-02-31T12:00:00Z', 'f'),
    /f date must be a real calendar date/
  );
  assert.equal(requireIsoTimestamp('2026-07-20T12:00:00.000Z', 'f'), '2026-07-20T12:00:00.000Z');
  assert.throws(() => requireIsoTimestamp('not a time', 'f'), /f must be an ISO timestamp/);
});

test('URL strictness is declared by the caller, not duplicated per module', () => {
  assert.equal(requireHttpUrl('https://example.com/a', 'f'), 'https://example.com/a');
  assert.throws(() => requireHttpUrl('ftp://example.com', 'f'), /f must be an HTTP\(S\) URL/);
  assert.throws(() => requireHttpUrl('not a url', 'f'), /f must be an HTTP\(S\) URL/);

  assert.throws(
    () => requireHttpUrl('https://user:pw@example.com/a', 'f', { rejectCredentials: true }),
    /f must be a credential-free HTTP\(S\) URL/
  );
  assert.throws(
    () => requireHttpUrl('http://example.com/a', 'f', { httpsOnly: true }),
    /f must be an HTTPS URL/
  );
  assert.throws(
    () => requireHttpUrl('https://example.com/a b', 'f', { markdownSafe: true }),
    /unsafe in a Markdown link/
  );
  assert.throws(
    () =>
      requireHttpUrl('https://example.com/a?access-token=s', 'f', {
        rejectCredentialParams: true,
      }),
    /credential-like URL parameter/
  );

  // exactSpelling guards records that must match a stored URL byte-for-byte:
  // the URL constructor would otherwise normalize both of these to valid.
  assert.throws(
    () => requireHttpUrl('HTTPS://example.com/a', 'f', { exactSpelling: true }),
    /f must be an HTTP\(S\) URL/
  );
  assert.throws(
    () => requireHttpUrl(' https://example.com/a ', 'f', { exactSpelling: true }),
    /f must be an HTTP\(S\) URL/
  );
});

test('JSON helpers strip a single fence and name the artifact on failure', () => {
  assert.equal(stripMarkdownFence('```json\n{"a":1}\n```'), '{"a":1}');
  assert.equal(stripMarkdownFence('```\n{"a":1}\n```'), '{"a":1}');
  assert.equal(stripMarkdownFence('{"a":1}'), '{"a":1}');
  assert.deepEqual(parseJsonObject('```json\n{"a":1}\n```', 'bundle'), { a: 1 });
  assert.throws(() => parseJsonObject('{oops', 'bundle'), /bundle is not valid JSON/);
  assert.throws(() => parseJsonObject('[]', 'bundle'), /bundle must be an object/);
});

test('error helpers read codes and messages off unknown throwables', () => {
  assert.equal(errorMessage(new Error('boom')), 'boom');
  assert.equal(errorMessage('boom'), 'boom');
  assert.equal(errorCode(Object.assign(new Error('x'), { code: 'ENOENT' })), 'ENOENT');
  assert.equal(errorCode({}), undefined);
  assert.equal(isMissingFile(Object.assign(new Error('x'), { code: 'ENOENT' })), true);
  assert.equal(isExistingFile(Object.assign(new Error('x'), { code: 'EEXIST' })), true);
  assert.equal(isMissingFile(new Error('x')), false);
});

test('no module outside src/shared redeclares a shared primitive', async () => {
  // The guard the plan requires: without it the duplication re-accumulates.
  // Nine modules previously carried their own copy of these.
  const shared = new Set([
    'errorMessage',
    'errorCode',
    'isMissingFile',
    'isExistingFile',
    'stripMarkdownFence',
    'requireRecord',
    'requireArray',
    'requireString',
    'requireStringArray',
    'requireEnum',
    'requireUniqueStrings',
    'rejectUnknownKeys',
    'requirePositiveInteger',
    'requireScore',
    'requireHttpUrl',
    'requireDate',
    'requireDateTime',
    'requireIsoTimestamp',
  ]);

  // Match every binding form, not just `function name(`. A guard that only
  // catches one spelling invites the duplication back under another.
  const declarations = [
    /^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*[(<]/gm,
    /^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*[:=]/gm,
    /\bas\s+(\w+)\s*[,}]/g, // `export { x as requireString }` re-export aliases
  ];

  const offenders: string[] = [];
  for (const file of await sourceFiles('src')) {
    if (file.startsWith(`src${path.sep}shared${path.sep}`)) continue;
    const text = await readFile(file, 'utf8');
    for (const pattern of declarations) {
      for (const match of text.matchAll(pattern)) {
        const name = match[1];
        if (name !== undefined && shared.has(name)) {
          offenders.push(`${file}: ${name}`);
        }
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `These belong in src/shared/ instead of being redeclared:\n${offenders.join('\n')}`
  );
});

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return entry.isFile() && full.endsWith('.ts') ? [full] : [];
    })
  );
  return files.flat();
}
