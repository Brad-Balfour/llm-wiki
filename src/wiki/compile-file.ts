import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { formatJsonRecord, readOptionalFile, writeFileAtomic } from '../shared/fs.js';
import { sha256Fingerprint } from '../shared/hash.js';

import { parseApprovedWikiSource } from './approved-source.js';
import { compileApprovedWikiSource, normalizeGeneratedWikiMarkdown } from './compiler.js';

interface CompileState {
  manifest_version: number;
  schema_version: string;
  created: string;
  updated: string | null;
  processed_sources: Record<
    string,
    { hash: string; output_path: string; source_item_id: string; processed_at: string }
  >;
  wiki_outputs: Record<string, { hash: string; updated: string; provenance_count: number }>;
  runs: Array<{
    timestamp: string;
    source_path: string;
    output_path: string;
    status: string;
  }>;
}

interface Options {
  input: string;
  repoRoot: string;
  statePath: string;
  confirmPublic: boolean;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (!options.confirmPublic) {
    throw new Error(
      'Public compilation requires --confirm-public after local privacy, publication-rights, and dual-use review.'
    );
  }
  const inputPath = path.resolve(options.repoRoot, options.input);
  const inputText = await readFile(inputPath, 'utf8');
  const source = parseApprovedWikiSource(inputText);
  const actualSourcePath = toPosixPath(path.relative(options.repoRoot, inputPath));
  if (actualSourcePath !== source.source.source_path) {
    throw new Error(
      `source.source_path must match the input path: expected ${actualSourcePath}, received ${source.source.source_path}`
    );
  }

  const state = await readCompileState(path.resolve(options.repoRoot, options.statePath));
  const inputHash = sha256Fingerprint(inputText);
  const prior = state.processed_sources[source.source.source_path];
  const now = new Date().toISOString();
  const conflictingSourceId = Object.entries(state.processed_sources).find(
    ([sourcePath, record]) =>
      record.source_item_id === source.source.source_item_id &&
      sourcePath !== source.source.source_path
  );
  if (conflictingSourceId) {
    throw new Error(
      `source_item_id ${source.source.source_item_id} is already processed from ${conflictingSourceId[0]}. Use a new source item id for a distinct immutable record.`
    );
  }

  let normalizedPriorOutput: string | undefined;
  if (prior) {
    if (prior.hash !== inputHash) {
      throw new Error(
        `Immutable source changed after compilation: ${source.source.source_path}. Create a new source record instead.`
      );
    }
    const priorOutput = await readOptionalFile(path.resolve(options.repoRoot, prior.output_path));
    if (priorOutput !== undefined) {
      const recordedOutput = state.wiki_outputs[prior.output_path];
      if (recordedOutput?.hash !== sha256Fingerprint(priorOutput)) {
        throw new Error(
          `Wiki output drift detected for ${prior.output_path}. Review the file before compiling again.`
        );
      }
      const normalized = normalizeGeneratedWikiMarkdown(priorOutput);
      if (normalized === priorOutput) {
        process.stdout.write(`skipped ${prior.output_path}\n`);
        return;
      }
      normalizedPriorOutput = normalized;
    }
  }

  const outputPath = wikiOutputPath(source.entry.type, source.entry.slug);
  const absoluteOutputPath = path.resolve(options.repoRoot, outputPath);
  const existingMarkdown = await readOptionalFile(absoluteOutputPath);
  if (existingMarkdown !== undefined) {
    const recordedOutput = state.wiki_outputs[outputPath];
    if (!recordedOutput || recordedOutput.hash !== sha256Fingerprint(existingMarkdown)) {
      throw new Error(
        `Wiki output drift detected for ${outputPath}. Review the file before compiling again.`
      );
    }
  }
  const result =
    normalizedPriorOutput === undefined
      ? compileApprovedWikiSource(source, existingMarkdown, now.slice(0, 10))
      : {
          status: 'updated' as const,
          output_path: prior?.output_path ?? outputPath,
          markdown: normalizedPriorOutput,
          provenance_count:
            state.wiki_outputs[prior?.output_path ?? outputPath]?.provenance_count ?? 1,
        };

  if (result.status !== 'skipped') {
    await mkdir(path.dirname(absoluteOutputPath), { recursive: true });
    await writeFile(absoluteOutputPath, result.markdown, 'utf8');
  }

  state.updated = now;
  state.processed_sources[source.source.source_path] = {
    hash: inputHash,
    output_path: result.output_path,
    source_item_id: source.source.source_item_id,
    processed_at: normalizedPriorOutput === undefined ? now : (prior?.processed_at ?? now),
  };
  state.wiki_outputs[result.output_path] = {
    hash: sha256Fingerprint(result.markdown),
    updated: now,
    provenance_count: result.provenance_count,
  };
  state.runs.push({
    timestamp: now,
    source_path: source.source.source_path,
    output_path: result.output_path,
    status: result.status,
  });
  await writeCompileState(path.resolve(options.repoRoot, options.statePath), state);

  process.stdout.write(`${result.status} ${result.output_path}\n`);
}

function parseOptions(args: string[]): Options {
  let input: string | undefined;
  let repoRoot = process.cwd();
  let statePath = 'schema/compile-state.json';
  let confirmPublic = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') {
      input = args[index + 1];
      index += 1;
    } else if (arg === '--repo-root') {
      repoRoot = path.resolve(args[index + 1] ?? repoRoot);
      index += 1;
    } else if (arg === '--state') {
      statePath = args[index + 1] ?? statePath;
      index += 1;
    } else if (arg === '--confirm-public') {
      confirmPublic = true;
    } else {
      throw new Error(`Unknown argument: ${arg ?? ''}`);
    }
  }

  if (!input) {
    throw new Error(
      'Usage: compile:wiki -- --input sources/tldr/<approved-source>.txt --confirm-public'
    );
  }
  return { input, repoRoot, statePath, confirmPublic };
}

async function readCompileState(statePath: string): Promise<CompileState> {
  const text = await readFile(statePath, 'utf8');
  return JSON.parse(text) as CompileState;
}

async function writeCompileState(statePath: string, state: CompileState): Promise<void> {
  await writeFileAtomic(statePath, formatJsonRecord(state));
}

function wikiOutputPath(type: string, slug: string): string {
  const directory = type === 'person' ? 'people' : `${type}s`;
  return `wiki/${directory}/${slug}.md`;
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join('/');
}

await main();
