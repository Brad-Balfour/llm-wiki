import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const retiredPaths = [
  '.github/workflows/wiki-compile.yml',
  'chatgpt-project/commute-session-handoff.md',
  'chatgpt-project/commute-session-ledger.md',
  'chatgpt-project/wiki-ingestion.md',
  'schema/approved-wiki-source-v1.schema.json',
  'schema/commute-handoff-v1.schema.json',
  'schema/commute-handoff-v2.schema.json',
  'schema/compile-state.json',
  'src/commute/import-handoff.ts',
  'src/wiki/compile-file.ts',
] as const;

test('legacy handoff and approved-source workflows stay retired', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8')) as {
    scripts: Record<string, string>;
  };

  for (const script of [
    'compile:wiki',
    'ingest:wiki',
    'prepare:wiki-drafts',
    'import:commute-handoff',
  ]) {
    assert.equal(packageJson.scripts[script], undefined, `${script} must remain retired`);
  }

  await Promise.all(
    retiredPaths.map(async (retiredPath) => {
      await assert.rejects(access(retiredPath), `${retiredPath} must remain absent`);
    })
  );

  const routingRules = await readFile('schema/routing-rules.md', 'utf8');
  assert.doesNotMatch(routingRules, /requires approved source records/);
  assert.doesNotMatch(routingRules, /public promotion review/);
  assert.match(routingRules, /exact, item-bound\s+`wiki this` capture authorizes/);
  assert.match(routingRules, /direct maintainer PR/);
});

test('wiki provenance uses stable source identity and URL without source records', async () => {
  const markdownFiles = await findMarkdownFiles('wiki');

  for (const markdownPath of markdownFiles) {
    const markdown = await readFile(markdownPath, 'utf8');
    assert.doesNotMatch(markdown, /"source_path"\s*:/, `${markdownPath} uses retired source_path`);
  }

  try {
    assert.deepEqual(
      await readdir('sources/tldr'),
      [],
      'the retired sources directory must remain empty'
    );
  } catch (error) {
    assert.equal(
      typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined,
      'ENOENT'
    );
  }
});

async function findMarkdownFiles(directory: string): Promise<string[]> {
  const paths: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      paths.push(...(await findMarkdownFiles(entryPath)));
    } else if (entry.isFile() && path.extname(entry.name) === '.md') {
      paths.push(entryPath);
    }
  }
  return paths.sort();
}
