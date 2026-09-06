import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

interface ReviewItem {
  article_id: string;
  story_group_id: string;
  assignment: 'development' | 'final_check';
  review_bucket: 'ordinary' | 'reported_problem';
  disposition: 'label' | 'excluded' | 'failed';
  disposition_reason: string | null;
  source_item_id: string;
  newsletter: string;
  edition_date: string;
  title: string;
  description: string;
  url: string;
  author: string | null;
  publication: string;
  attribution_status: 'verified' | 'no_authors_listed' | 'lookup_failed';
  source_occurrences: Array<{
    occurrence_id: string;
    newsletter: string;
    edition_date: string;
    source_item_id: string;
  }>;
}

const inventory = {
  inventory_version: 'classifier-v2-review.v1',
  dataset_id: 'weekend-review',
  items: [
    item('article-a', 'development', {
      title: 'Agent review patterns',
      review_bucket: 'reported_problem',
      source_occurrences: [
        {
          occurrence_id: 'general-a',
          newsletter: 'TLDR',
          edition_date: '2026-09-03',
          source_item_id: 'general-a',
        },
        {
          occurrence_id: 'dev-a',
          newsletter: 'TLDR Dev',
          edition_date: '2026-09-04',
          source_item_id: 'dev-a',
        },
      ],
    }),
    item('article-b', 'development', { title: 'Ordinary product update' }),
    item('article-c', 'development', {
      disposition: 'excluded',
      disposition_reason: 'Sponsor placement.',
    }),
    item('article-d', 'development', {
      disposition: 'failed',
      disposition_reason: 'URL resolution failed.',
    }),
    item('article-e', 'final_check', { story_group_id: 'group-e' }),
  ],
};

test('prediction input contains article evidence but no labels or review-only fields', async () => {
  const fixture = await setup({ inventory });
  const result = run([
    'prediction-input',
    '--inventory',
    fixture.inventory,
    '--assignment',
    'development',
    '--out',
    fixture.output,
  ]);
  assert.equal(result.status, 0, result.stderr);
  const serialized = await readFile(fixture.output, 'utf8');
  assert.doesNotMatch(serialized, /interest_label|depth_label|review_bucket|disposition/);
  assert.match(serialized, /Agent review patterns/);
  assert.equal(JSON.parse(serialized).items.length, 2);
});

test('blind page contains no predictions and exports local JSON answers', async () => {
  const fixture = await setup({ inventory });
  const result = run([
    'label-page',
    '--inventory',
    fixture.inventory,
    '--assignment',
    'development',
    '--out',
    fixture.output,
  ]);
  assert.equal(result.status, 0, result.stderr);
  const html = await readFile(fixture.output, 'utf8');
  assert.match(html, /Agent review patterns/);
  assert.match(html, /Download answers JSON/);
  assert.match(html, /new Blob/);
  assert.doesNotMatch(html, /SECRET_BASELINE_REASON|interest_score|depth_score/);
});

test('blind page escapes JavaScript line separators in embedded article text', async () => {
  const special = structuredClone(inventory);
  special.items[0]!.description = 'First\u2028second\u2029third';
  const fixture = await setup({ inventory: special });
  const result = run([
    'label-page',
    '--inventory',
    fixture.inventory,
    '--assignment',
    'development',
    '--out',
    fixture.output,
  ]);
  assert.equal(result.status, 0, result.stderr);
  const html = await readFile(fixture.output, 'utf8');
  assert.match(html, /First\\u2028second\\u2029third/);
  assert.doesNotMatch(html, /First\u2028second\u2029third/);
});

test('comparison counts distinct articles once and leaves missing answers pending', async () => {
  const labels = {
    dataset_id: 'weekend-review',
    assignment: 'development',
    labels: [
      {
        article_id: 'article-a',
        interest_label: 'interested',
        depth_label: 'in_depth',
        reason: 'Useful agent workflow.',
      },
    ],
  };
  const baseline = predictions([
    prediction('article-a', 'interested', 0.85, 'headline_only', 0.45),
    prediction('article-b', 'uninterested', 0.3, 'headline_only', 0.2),
  ]);
  const candidate = predictions(
    [
      prediction('article-a', 'uninterested', 0.4, 'in_depth', 0.7),
      prediction('article-b', 'maybe', 0.65, 'headline_only', 0.3),
    ],
    'candidate'
  );
  const fixture = await setup({ inventory, labels, baseline, candidate });
  const result = run([
    'compare',
    '--inventory',
    fixture.inventory,
    '--assignment',
    'development',
    '--labels',
    fixture.labels,
    '--baseline',
    fixture.baseline,
    '--candidate',
    fixture.candidate,
    '--out',
    fixture.output,
  ]);
  assert.equal(result.status, 0, result.stderr);
  const report = await readFile(fixture.output, 'utf8');
  assert.match(report, /Distinct articles assigned for labeling: 2/);
  assert.match(report, /Newsletter occurrences represented: 3/);
  assert.match(report, /Excluded editorial candidates: 1/);
  assert.match(report, /Failed at a named step: 1/);
  assert.match(report, /Missing or unsure interest labels: 1/);
  assert.match(report, /\| False skips \| 0 \| 1 \|/);
  assert.match(report, /\| Missed depth \| 1 \| 0 \|/);
  assert.match(report, /Baseline: profile `1\.4`/);
  assert.match(report, /`article-b` — Ordinary product update/);
});

test('comparison treats interest and depth answers independently', async () => {
  const labels = {
    dataset_id: 'weekend-review',
    assignment: 'development',
    labels: [
      {
        article_id: 'article-a',
        interest_label: 'unsure',
        depth_label: 'in_depth',
      },
    ],
  };
  const baseline = predictions([prediction('article-a', 'maybe', 0.65, 'headline_only', 0.4)]);
  const candidate = predictions(
    [prediction('article-a', 'interested', 0.85, 'in_depth', 0.75)],
    'candidate'
  );
  const fixture = await setup({ inventory, labels, baseline, candidate });
  const result = run([
    'compare',
    '--inventory',
    fixture.inventory,
    '--assignment',
    'development',
    '--labels',
    fixture.labels,
    '--baseline',
    fixture.baseline,
    '--candidate',
    fixture.candidate,
    '--out',
    fixture.output,
  ]);
  assert.equal(result.status, 0, result.stderr);
  const report = await readFile(fixture.output, 'utf8');
  assert.match(report, /\| Interest comparisons \| 0 \| 0 \|/);
  assert.match(report, /\| Depth comparisons \| 1 \| 1 \|/);
  assert.match(report, /\| Missed depth \| 1 \| 0 \|/);
});

test('comparison rejects incorrect baseline or candidate version identities', async () => {
  const labels = { dataset_id: 'weekend-review', assignment: 'development', labels: [] };
  const baseline = predictions([]);
  const candidate = predictions([]);
  const fixture = await setup({ inventory, labels, baseline, candidate });
  const result = run([
    'compare',
    '--inventory',
    fixture.inventory,
    '--assignment',
    'development',
    '--labels',
    fixture.labels,
    '--baseline',
    fixture.baseline,
    '--candidate',
    fixture.candidate,
    '--out',
    fixture.output,
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /candidate must use profile 2\.0/);
});

test('inventory enforces author and attribution-status consistency', async () => {
  const invalid = structuredClone(inventory);
  invalid.items[0]!.author = null;
  const fixture = await setup({ inventory: invalid });
  const result = run([
    'prediction-input',
    '--inventory',
    fixture.inventory,
    '--assignment',
    'development',
    '--out',
    fixture.output,
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /author must be a string when attribution_status is verified/);

  invalid.items[0]!.author = 'Unverified Author';
  invalid.items[0]!.attribution_status = 'lookup_failed';
  await writeFile(fixture.inventory, JSON.stringify(invalid));
  const retry = run([
    'prediction-input',
    '--inventory',
    fixture.inventory,
    '--assignment',
    'development',
    '--out',
    fixture.output,
  ]);
  assert.notEqual(retry.status, 0);
  assert.match(retry.stderr, /author must be null when attribution_status is lookup_failed/);
});

test('inventory prevents related stories from crossing review assignments', async () => {
  const invalid = structuredClone(inventory);
  invalid.items[4]!.story_group_id = invalid.items[0]!.story_group_id;
  const fixture = await setup({ inventory: invalid });
  const result = run([
    'prediction-input',
    '--inventory',
    fixture.inventory,
    '--assignment',
    'development',
    '--out',
    fixture.output,
  ]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /crosses development and final_check assignments/);
});

function item(
  id: string,
  assignment: 'development' | 'final_check',
  overrides: Partial<ReviewItem> = {}
): ReviewItem {
  return {
    article_id: id,
    story_group_id: `group-${id}`,
    assignment,
    review_bucket: 'ordinary',
    disposition: 'label',
    disposition_reason: null,
    source_item_id: id,
    newsletter: 'TLDR',
    edition_date: '2026-09-04',
    title: `Title ${id}`,
    description: `Description ${id}`,
    url: `https://example.com/${id}`,
    author: 'Example Author',
    publication: 'Example Publication',
    attribution_status: 'verified',
    source_occurrences: [
      {
        occurrence_id: `occurrence-${id}`,
        newsletter: 'TLDR',
        edition_date: '2026-09-04',
        source_item_id: id,
      },
    ],
    ...overrides,
  };
}

function prediction(
  classifier_item_id: string,
  interest_level: 'interested' | 'maybe' | 'uninterested',
  interest_score: number,
  consumption_depth: 'headline_only' | 'in_depth',
  depth_score: number
) {
  return { classifier_item_id, interest_level, interest_score, consumption_depth, depth_score };
}

function predictions(
  items: ReturnType<typeof prediction>[],
  kind: 'baseline' | 'candidate' = 'baseline'
) {
  return {
    dataset_id: 'weekend-review',
    assignment: 'development',
    profile_version: kind === 'baseline' ? '1.4' : '2.0',
    prompt_version:
      kind === 'baseline' ? 'classifier-instructions.v1' : 'classifier-instructions.v2',
    items,
  };
}

async function setup<T extends Record<string, unknown>>(
  files: T
): Promise<{ [K in keyof T | 'output']: string }> {
  const directory = await mkdtemp(path.join(tmpdir(), 'llm-wiki-classifier-review-'));
  const paths = { output: path.join(directory, 'output.txt') } as {
    [K in keyof T | 'output']: string;
  };
  await Promise.all(
    Object.entries(files).map(async ([name, value]) => {
      const file = path.join(directory, `${name}.json`);
      Object.assign(paths, { [name]: file });
      await writeFile(file, JSON.stringify(value));
    })
  );
  return paths;
}

function run(args: string[]) {
  return spawnSync(process.execPath, ['scripts/classifier-v2-review.mjs', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}
