import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

/**
 * Package-level boundary guards.
 *
 * `classifier/feedback-label.ts` used to sit inside `src/classifier/` while
 * importing `src/routing/`, which made the two packages mutually dependent and
 * put the classifier in the position of importing the routing policy it is
 * meant to stay neutral about. These tests keep both from coming back.
 */

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

/**
 * Every module specifier a file imports, in any of the forms TypeScript
 * accepts: `from '...'`, a side-effect `import '...'`, and either quote style.
 * Matching only `from '../pkg/` would miss a real edge.
 */
function importedSpecifiers(text: string): string[] {
  const specifiers: string[] = [];
  for (const pattern of [/\bfrom\s+['"]([^'"]+)['"]/g, /\bimport\s+['"]([^'"]+)['"]/g]) {
    for (const match of text.matchAll(pattern)) {
      if (match[1] !== undefined) specifiers.push(match[1]);
    }
  }
  return specifiers;
}

/**
 * The `src` package a specifier resolves to, or undefined when it leaves `src`
 * or is external. Resolving against the importing file rather than assuming a
 * single `../` matters: a nested module imports its sibling package as
 * `../../routing/...`, and sourceFiles deliberately recurses.
 */
export function resolvedPackage(fromFile: string, specifier: string): string | undefined {
  if (!specifier.startsWith('.')) return undefined;
  const resolved = path.relative(
    process.cwd(),
    path.resolve(path.dirname(path.resolve(fromFile)), specifier)
  );
  const parts = resolved.split(path.sep);
  return parts[0] === 'src' && parts.length > 2 ? parts[1] : undefined;
}

/** package name -> set of packages it imports from */
async function packageGraph(): Promise<Map<string, Set<string>>> {
  const graph = new Map<string, Set<string>>();
  for (const file of await sourceFiles('src')) {
    const parts = file.split(path.sep);
    const from = parts[1];
    if (from === undefined || parts.length < 3) continue;
    const text = await readFile(file, 'utf8');
    const edges = graph.get(from) ?? new Set<string>();
    for (const specifier of importedSpecifiers(text)) {
      const to = resolvedPackage(file, specifier);
      if (to !== undefined && to !== from) edges.add(to);
    }
    graph.set(from, edges);
  }
  return graph;
}

test('no package imports itself back through another package', async () => {
  const graph = await packageGraph();
  const cycles: string[] = [];

  const visit = (node: string, trail: string[], seen: Set<string>): void => {
    for (const next of graph.get(node) ?? []) {
      if (next === trail[0]) {
        cycles.push([...trail, next].join(' -> '));
        continue;
      }
      if (seen.has(next)) continue;
      visit(next, [...trail, next], new Set([...seen, next]));
    }
  };

  for (const node of graph.keys()) visit(node, [node], new Set([node]));

  assert.deepEqual(cycles, [], `package cycles:\n${cycles.join('\n')}`);
});

test('the classifier package stays neutral about routing', async () => {
  // AGENTS.md: classifier output must be source-neutral, with routes derived in
  // src/routing/. A classifier module importing routing inverts that. Resolved
  // per specifier so a nested module cannot slip through on depth.
  for (const file of await sourceFiles(path.join('src', 'classifier'))) {
    const text = await readFile(file, 'utf8');
    for (const specifier of importedSpecifiers(text)) {
      assert.notEqual(
        resolvedPackage(file, specifier),
        'routing',
        `${file} imports routing via ${specifier}; derive routes in src/routing/ instead`
      );
    }
  }
});

test('package resolution follows nesting depth and import form', () => {
  // The cases the first version of these guards would have missed.
  assert.equal(resolvedPackage('src/classifier/types.ts', '../routing/derive.js'), 'routing');
  assert.equal(
    resolvedPackage('src/classifier/nested/deep.ts', '../../routing/derive.js'),
    'routing'
  );
  // A same-package import resolves to its own package; packageGraph drops
  // those, rather than resolvedPackage pretending they are external.
  assert.equal(resolvedPackage('src/classifier/types.ts', './validation.js'), 'classifier');
  assert.equal(resolvedPackage('src/classifier/types.ts', 'node:path'), undefined);
  assert.equal(resolvedPackage('src/classifier/types.ts', '../../tests/helper.js'), undefined);

  assert.deepEqual(importedSpecifiers("import { a } from '../routing/derive.js';"), [
    '../routing/derive.js',
  ]);
  assert.deepEqual(importedSpecifiers('import { a } from "../routing/derive.js";'), [
    '../routing/derive.js',
  ]);
  assert.deepEqual(importedSpecifiers("import '../routing/side-effect.js';"), [
    '../routing/side-effect.js',
  ]);
});
