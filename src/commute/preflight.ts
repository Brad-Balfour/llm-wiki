import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { reconcileSessionBundles } from './import-session-bundles.js';
import { validateTldrCommuteQueueV2 } from './session-bundle.js';

const SCHEMA_VERSION = 'commute-preflight.v1';

interface Input {
  bundle: string;
  recoveryQueue?: string;
}
interface Options {
  inputs: Input[];
  sharedChats: string[];
  output: string;
}

export async function runPreflight(options: Options, now = new Date().toISOString()) {
  const startedAt = new Date().toISOString();
  const inputs = await Promise.all(
    options.inputs.map(async (input) => {
      const bundleText = await readFile(input.bundle, 'utf8');
      const queueText =
        input.recoveryQueue === undefined ? undefined : await readFile(input.recoveryQueue, 'utf8');
      if (queueText !== undefined) validateTldrCommuteQueueV2(JSON.parse(queueText) as unknown);
      return {
        filename: path.basename(input.bundle),
        text: bundleText,
        ...(input.recoveryQueue === undefined
          ? {}
          : { recoveryQueue: { filename: path.basename(input.recoveryQueue), text: queueText! } }),
      };
    })
  );
  const intake = reconcileSessionBundles(inputs, now);
  const result = {
    schema_version: SCHEMA_VERSION,
    generated_at: now,
    phases: { intake_started_at: startedAt, validation_completed_at: new Date().toISOString() },
    inventory: {
      bundles: inputs.map((input) => ({ filename: input.filename, sha256: sha256(input.text) })),
      supplied_queues: inputs.flatMap((input) =>
        input.recoveryQueue === undefined
          ? []
          : [{ filename: input.recoveryQueue.filename, sha256: sha256(input.recoveryQueue.text) }]
      ),
      shared_chat_references: options.sharedChats,
    },
    intake: {
      sessions: intake.sessions.map(
        ({ input_filename, status, session_id, integrity_state, recovery_warnings, error }) => ({
          input_filename,
          status,
          ...(session_id === undefined ? {} : { session_id }),
          ...(integrity_state === undefined ? {} : { integrity_state }),
          ...(recovery_warnings === undefined ? {} : { recovery_warnings }),
          ...(error === undefined ? {} : { error }),
        })
      ),
      maintenance_candidates: intake.maintenance_candidates,
      unresolved_captures: intake.unresolved_captures.map(({ session_id, event_id }) => ({
        session_id,
        event_id,
      })),
      quality_incidents: intake.quality_incidents.map(({ session_id, event_id }) => ({
        session_id,
        event_id,
      })),
    },
    conversation_coverage: intake.maintenance_candidates.map((candidate) => ({
      maintenance_key: candidate.maintenance_key,
      discussion_bound: candidate.discussion !== undefined,
      shared_chat_recovery_required: false,
    })),
  };
  await mkdir(path.dirname(options.output), { recursive: true });
  await writeFile(options.output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  return result;
}

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function parseOptions(args: string[]): Options {
  const inputs: Input[] = [];
  const sharedChats: string[] = [];
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[index + 1];
    if (arg === '--input' && value) {
      inputs.push({ bundle: value });
      index += 1;
    } else if (arg === '--recover-with' && value && inputs.at(-1)) {
      inputs.at(-1)!.recoveryQueue = value;
      index += 1;
    } else if (arg === '--shared-chat' && value) {
      sharedChats.push(value);
      index += 1;
    } else if (arg === '--output' && value) {
      output = value;
      index += 1;
    } else throw new Error(`Unknown or incomplete argument: ${arg ?? ''}`);
  }
  if (inputs.length === 0 || !output)
    throw new Error(
      'Usage: commute:preflight -- --input <bundle> [--recover-with <queue>] [--shared-chat <url>] --output <private-result.json>'
    );
  if (!path.resolve(output).startsWith(`${path.resolve('.private')}${path.sep}`))
    throw new Error('--output must be inside .private');
  return { inputs, sharedChats, output };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  const result = await runPreflight(parseOptions(process.argv.slice(2)));
  process.stdout.write(`${result.intake.maintenance_candidates.length} maintenance candidate(s)\n`);
}
