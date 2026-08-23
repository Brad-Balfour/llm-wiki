import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { reconcileSessionBundles } from './import-session-bundles.js';
import {
  parseCommuteSessionBundleText,
  parseCommuteSessionBundleTextWithRelaxedArtifactFilename,
  queueSnapshotFingerprint,
  validateTldrCommuteQueueV2,
} from './session-bundle.js';

const SCHEMA_VERSION = 'commute-preflight.v1';

export interface PreflightInput {
  bundle: string;
  recoveryQueue?: string;
}
export interface PreflightOptions {
  inputs: PreflightInput[];
  sharedChats: string[];
  output: string;
}

export async function runPreflight(
  options: PreflightOptions,
  now = new Date().toISOString(),
  writeResult = true
) {
  const startedAt = new Date().toISOString();
  const inputs = await Promise.all(
    options.inputs.map(async (input) => {
      const bundleText = await readFile(input.bundle, 'utf8');
      const queueText =
        input.recoveryQueue === undefined ? undefined : await readFile(input.recoveryQueue, 'utf8');
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
  const queueComparisons = inputs.flatMap((input) => {
    if (input.recoveryQueue === undefined) return [];
    return [compareRecoveryQueue({ ...input, recoveryQueue: input.recoveryQueue })];
  });
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
      feedback_events: intake.feedback_events,
      general_captures: intake.general_captures,
      navigation_events: intake.navigation_events,
      event_conversions: intake.event_conversions,
      unresolved_captures: intake.unresolved_captures,
      quality_incidents: intake.quality_incidents,
    },
    conversation_coverage: intake.maintenance_candidates.map((candidate) => ({
      maintenance_key: candidate.maintenance_key,
      discussion_bound: candidate.discussion !== undefined,
      shared_chat_recovery_required:
        options.sharedChats.length > 0 && candidate.discussion === undefined,
    })),
    queue_comparisons: queueComparisons,
  };
  if (writeResult) {
    await mkdir(path.dirname(options.output), { recursive: true });
    await writeFile(options.output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
  }
  return result;
}

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function compareRecoveryQueue(input: {
  filename: string;
  text: string;
  recoveryQueue: { filename: string; text: string };
}) {
  try {
    let bundle;
    try {
      bundle = parseCommuteSessionBundleText(input.text);
    } catch {
      bundle = parseCommuteSessionBundleTextWithRelaxedArtifactFilename(
        input.text,
        input.filename
      ).bundle;
    }
    const supplied = validateTldrCommuteQueueV2(JSON.parse(input.recoveryQueue.text) as unknown);
    const suppliedFingerprint = queueSnapshotFingerprint(supplied);
    const embeddedFingerprint = queueSnapshotFingerprint(bundle.queue_snapshot.queue);
    const matches =
      input.recoveryQueue.filename === bundle.queue_snapshot.filename &&
      suppliedFingerprint === embeddedFingerprint;
    return {
      bundle_filename: input.filename,
      queue_filename: input.recoveryQueue.filename,
      expected_queue_filename: bundle.queue_snapshot.filename,
      supplied_fingerprint: suppliedFingerprint,
      embedded_fingerprint: embeddedFingerprint,
      status: matches ? ('matched' as const) : ('mismatched' as const),
    };
  } catch (error) {
    return {
      bundle_filename: input.filename,
      queue_filename: input.recoveryQueue.filename,
      status: 'unverified' as const,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function parsePreflightOptions(args: string[]): PreflightOptions {
  const inputs: PreflightInput[] = [];
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
      'Usage: commute:run -- --input <bundle> [--recover-with <queue>] [--shared-chat <url>] --output <private-result.json>'
    );
  if (!path.resolve(output).startsWith(`${path.resolve('.private')}${path.sep}`))
    throw new Error('--output must be inside the gitignored .private directory');
  return { inputs, sharedChats, output };
}
