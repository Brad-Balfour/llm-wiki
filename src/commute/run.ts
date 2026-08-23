import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { githubState, watchGithubState } from './github-state.js';
import { parsePreflightOptions, runPreflight, type PreflightOptions } from './preflight.js';

interface RunOptions extends PreflightOptions {
  githubPr?: { repository: string; number: number };
  watchSeconds?: number;
}

interface RunDependencies {
  githubState: typeof githubState;
  watchGithubState: typeof watchGithubState;
}

const defaultDependencies: RunDependencies = { githubState, watchGithubState };

export async function runCommute(options: RunOptions, dependencies = defaultDependencies) {
  const startedAt = new Date().toISOString();
  const preflight = await runPreflight(options, startedAt, false);
  let github:
    | { outcome: 'not_requested' }
    | { outcome: 'snapshot'; state: unknown }
    | { outcome: 'state_changed' | 'timeout'; state: unknown; observations: number }
    | { outcome: 'error'; error: string };
  if (options.githubPr === undefined) github = { outcome: 'not_requested' };
  else {
    try {
      github =
        options.watchSeconds === undefined
          ? {
              outcome: 'snapshot',
              state: await dependencies.githubState(
                options.githubPr.repository,
                options.githubPr.number
              ),
            }
          : await dependencies.watchGithubState(
              options.githubPr.repository,
              options.githubPr.number,
              options.watchSeconds * 1_000
            );
    } catch (error) {
      github = { outcome: 'error', error: error instanceof Error ? error.message : String(error) };
    }
  }
  const completedAt = new Date().toISOString();
  const result = {
    schema_version: 'commute-run.v1',
    result: 'completed',
    phases: {
      intake_started_at: startedAt,
      preflight_completed_at: preflight.phases.validation_completed_at,
      github_state_completed_at: completedAt,
      command_completed_at: completedAt,
    },
    preflight,
    github,
    unresolved_items: [
      ...preflight.intake.sessions
        .filter((session) => session.status === 'rejected')
        .map((session) => ({ type: 'rejected_session', ...session })),
      ...preflight.intake.unresolved_captures.map((capture) => ({
        type: 'unresolved_capture',
        ...capture,
      })),
      ...preflight.queue_comparisons
        .filter((comparison) => comparison.status !== 'matched')
        .map((comparison) => ({ type: 'queue_comparison', ...comparison })),
      ...preflight.conversation_coverage
        .filter((coverage) => coverage.shared_chat_recovery_required)
        .map((coverage) => ({ type: 'shared_chat_recovery', ...coverage })),
      ...(github.outcome === 'error' ? [{ type: 'github_state', ...github }] : []),
    ],
  };
  await mkdir(path.dirname(options.output), { recursive: true });
  await writeFile(options.output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  return { ...result, output: options.output };
}

function parseRunOptions(args: string[]): RunOptions {
  const preflightArgs: string[] = [];
  let githubPr: RunOptions['githubPr'];
  let watchSeconds: number | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[index + 1];
    if (arg === '--github-pr' && value) {
      const [repository, number] = value.split('#');
      if (!repository || !number || !Number.isInteger(Number(number)) || Number(number) < 1)
        throw new Error('--github-pr must be OWNER/REPO#NUMBER');
      githubPr = { repository, number: Number(number) };
      index += 1;
    } else if (arg === '--watch-seconds' && value) {
      watchSeconds = Number(value);
      if (!Number.isInteger(watchSeconds) || watchSeconds < 1 || watchSeconds > 900)
        throw new Error('--watch-seconds must be an integer from 1 to 900');
      index += 1;
    } else preflightArgs.push(arg!);
  }
  if (watchSeconds !== undefined && githubPr === undefined)
    throw new Error('--watch-seconds requires --github-pr');
  return {
    ...parsePreflightOptions(preflightArgs),
    ...(githubPr === undefined ? {} : { githubPr }),
    ...(watchSeconds === undefined ? {} : { watchSeconds }),
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  const result = await runCommute(parseRunOptions(process.argv.slice(2)));
  process.stdout.write(
    `${result.preflight.intake.maintenance_candidates.length} maintenance candidate(s); ${result.unresolved_items.length} unresolved item(s)\n`
  );
}
