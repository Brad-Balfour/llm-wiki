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

/** package name -> set of packages it imports from */
async function packageGraph(): Promise<Map<string, Set<string>>> {
  const graph = new Map<string, Set<string>>();
  for (const file of await sourceFiles('src')) {
    const parts = file.split(path.sep);
    const from = parts[1];
    if (from === undefined || parts.length < 3) continue;
    const text = await readFile(file, 'utf8');
    const edges = graph.get(from) ?? new Set<string>();
    for (const match of text.matchAll(/from '\.\.\/([a-z-]+)\//g)) {
      const to = match[1];
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
  // src/routing/. A classifier module importing routing inverts that.
  for (const file of await sourceFiles(path.join('src', 'classifier'))) {
    const text = await readFile(file, 'utf8');
    assert.equal(
      /from '\.\.\/routing\//.test(text),
      false,
      `${file} imports routing; derive routes in src/routing/ instead`
    );
  }
});
