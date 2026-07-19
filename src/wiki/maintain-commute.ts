import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { reconcileSessionBundles } from '../commute/import-session-bundles.js';
import { retrieveMaintenanceSources } from './retrieve-maintenance-sources.js';

const execFileAsync = promisify(execFile);
const CODEX_EXECUTABLE =
  process.env.COMMUTE_MAINTAINER_CODEX ?? '/Applications/ChatGPT.app/Contents/Resources/codex';

interface Options {
  inputs: string[];
  outputDir: string;
}

interface MaintainerOutcome {
  schema_version: 'commute-maintenance-outcome.v1';
  status: 'no_retrievable_sources' | 'agent_started' | 'agent_failed';
  intake_path: string;
  retrieval_path: string;
  agent_result_path?: string;
  branch?: string;
  worktree?: string;
  detail?: string;
}

export function buildMaintainerPrompt(options: {
  intakePath: string;
  retrievalPath: string;
  resultPath: string;
  branch: string;
}): string {
  return `You are the llm-wiki commute maintainer. You are already in an isolated Git worktree on branch ${options.branch}.

Read the private intake record at ${options.intakePath} and retrieved-source record at ${options.retrievalPath}. Work only from exact wiki_this maintenance candidates with a retrieved source. Do not use queue summaries as a substitute for retrieved source material.

For each viable source, inspect the existing wiki before deciding whether to create a page, update an existing page, or add useful links. Write concise original synthesis and link the source; do not copy long source passages. Do not include raw email text, credentials, private work information, or protected details.

There is no approval or intake-review gate. If useful changes result, run the relevant repository checks, commit the changes, push this branch to origin, and create one GitHub PR with gh. If no useful change is justified, do not create a filler page or PR.

Before finishing, write JSON to ${options.resultPath} with this shape:
{
  "schema_version": "commute-maintenance-result.v1",
  "status": "pr_created" | "no_change" | "insufficient_source" | "failed",
  "branch": "${options.branch}",
  "pr_url": "string when created",
  "results": [{ "maintenance_key": "...", "status": "...", "detail": "..." }]
}
Do not ask Brad for an intermediate approval. The resulting PR is the review point.`;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  ensurePrivateDirectory(options.outputDir);
  const outputDir = path.resolve(options.outputDir);
  await mkdir(outputDir, { recursive: true });

  const bundleInputs = await Promise.all(
    options.inputs.map(async (input) => ({
      filename: path.basename(input),
      text: await readFile(input, 'utf8'),
    }))
  );
  const intake = reconcileSessionBundles(bundleInputs);
  const intakePath = path.join(outputDir, 'intake.json');
  await writeJsonExclusive(intakePath, intake);
  const retrieval = await retrieveMaintenanceSources(intake.maintenance_candidates);
  const retrievalPath = path.join(outputDir, 'sources.json');
  await writeJsonExclusive(retrievalPath, retrieval);

  const viableSources = retrieval.sources.filter((source) => source.status === 'retrieved');
  if (viableSources.length === 0) {
    const outcome: MaintainerOutcome = {
      schema_version: 'commute-maintenance-outcome.v1',
      status: 'no_retrievable_sources',
      intake_path: intakePath,
      retrieval_path: retrievalPath,
      detail: 'No exact wiki_this capture had a retrievable text source.',
    };
    await writeJsonExclusive(path.join(outputDir, 'outcome.json'), outcome);
    process.stdout.write(`${outputDir}\nNo retrievable wiki sources; no PR created.\n`);
    return;
  }

  const repoRoot = await gitOutput(['rev-parse', '--show-toplevel']);
  const baseRef = await gitOutput(['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD']);
  const branch = `commute-maintenance-${timestamp()}`;
  const worktree = await mkdtemp(path.join(os.tmpdir(), 'llm-wiki-maintenance-'));
  const resultPath = path.join(outputDir, 'agent-result.json');
  await execFileAsync('git', ['worktree', 'add', '-b', branch, worktree, baseRef], { cwd: repoRoot });

  const outcome: MaintainerOutcome = {
    schema_version: 'commute-maintenance-outcome.v1',
    status: 'agent_started',
    intake_path: intakePath,
    retrieval_path: retrievalPath,
    agent_result_path: resultPath,
    branch,
    worktree,
  };
  await writeJsonExclusive(path.join(outputDir, 'outcome.json'), outcome);

  try {
    await execFileAsync(
      CODEX_EXECUTABLE,
      [
        'exec',
        '--sandbox',
        'workspace-write',
        '--cd',
        worktree,
        '--add-dir',
        outputDir,
        '--output-last-message',
        path.join(outputDir, 'agent-last-message.txt'),
        buildMaintainerPrompt({ intakePath, retrievalPath, resultPath, branch }),
      ],
      { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (error) {
    const failed: MaintainerOutcome = {
      ...outcome,
      status: 'agent_failed',
      detail: errorMessage(error),
    };
    await writeFile(path.join(outputDir, 'outcome.json'), `${JSON.stringify(failed, null, 2)}\n`);
    throw error;
  }

  process.stdout.write(`${outputDir}\nMaintainer completed on branch ${branch}.\n`);
}

function parseOptions(args: string[]): Options {
  const inputs: string[] = [];
  let outputDir: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') {
      const input = args[index + 1];
      if (!input) throw new Error('--input requires a bundle filename');
      inputs.push(input);
      index += 1;
    } else if (arg === '--output-dir') {
      const output = args[index + 1];
      if (!output) throw new Error('--output-dir requires a directory');
      outputDir = output;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg ?? ''}`);
    }
  }
  if (inputs.length === 0 || !outputDir) {
    throw new Error(
      'Usage: maintain:commute -- --input <bundle.txt> [--input <bundle.txt> ...] --output-dir <private-directory>'
    );
  }
  return { inputs, outputDir };
}

function ensurePrivateDirectory(directory: string): void {
  const privateRoot = path.resolve('.private');
  const resolved = path.resolve(directory);
  if (!resolved.startsWith(`${privateRoot}${path.sep}`)) {
    throw new Error('--output-dir must be inside the gitignored .private directory');
  }
}

async function gitOutput(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args);
  return stdout.trim();
}

async function writeJsonExclusive(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) {
  await main();
}
