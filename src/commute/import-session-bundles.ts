import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bundleArtifactFilenameMatches,
  type CommuteSessionBundle,
  parseCommuteSessionBundleText,
} from './session-bundle.js';
import { recoverSessionBundleWithSuppliedQueue } from './recover-session-bundle.js';

const IMPORT_SCHEMA_VERSION = 'commute-session-import.v1';

interface Options {
  inputs: Array<{ bundle: string; recoveryQueue?: string }>;
  output: string;
}

export interface SessionBundleInput {
  filename: string;
  text: string;
  recoveryQueue?: { filename: string; text: string };
}

interface ImportedSession {
  input_filename: string;
  status: 'accepted' | 'rejected';
  session_id?: string;
  integrity_state?: CommuteSessionBundle['integrity']['state'];
  queue_filename?: string;
  error?: string;
}

interface MaintenanceCandidate {
  maintenance_key: string;
  session_id: string;
  event_id: string;
  source_item_id: string;
  title: string;
  url: string;
  status: 'pending';
}

interface ReconciledEvent {
  session_id: string;
  event_id: string;
  kind: string;
  event: CommuteSessionBundle['events'][number];
}

interface EventConversion {
  session_id: string;
  event_id: string;
  reason: string;
  original_event: CommuteSessionBundle['events'][number];
  converted_event: CommuteSessionBundle['events'][number];
}

export interface CommuteSessionImport {
  schema_version: typeof IMPORT_SCHEMA_VERSION;
  imported_at: string;
  sessions: ImportedSession[];
  maintenance_candidates: MaintenanceCandidate[];
  feedback_events: ReconciledEvent[];
  unresolved_captures: ReconciledEvent[];
  quality_incidents: ReconciledEvent[];
  general_captures: ReconciledEvent[];
  event_conversions: EventConversion[];
}

export function reconcileSessionBundles(
  inputs: SessionBundleInput[],
  importedAt = new Date().toISOString()
): CommuteSessionImport {
  const result: CommuteSessionImport = {
    schema_version: IMPORT_SCHEMA_VERSION,
    imported_at: importedAt,
    sessions: [],
    maintenance_candidates: [],
    feedback_events: [],
    unresolved_captures: [],
    quality_incidents: [],
    general_captures: [],
    event_conversions: [],
  };
  const sessionIds = new Set<string>();
  const maintenanceKeys = new Set<string>();

  for (const input of inputs) {
    let bundle: CommuteSessionBundle;
    try {
      bundle = parseCommuteSessionBundleText(input.text);
      if (!bundleArtifactFilenameMatches(input.filename, bundle.session.artifact_filename)) {
        throw new Error(
          'Bundle filename does not match session.artifact_filename (except a Library-added numeric suffix)'
        );
      }
      if (sessionIds.has(bundle.session.session_id)) {
        throw new Error(`Duplicate session_id ${bundle.session.session_id}`);
      }
      sessionIds.add(bundle.session.session_id);
    } catch (error) {
      if (input.recoveryQueue) {
        try {
          const recovered = recoverSessionBundleWithSuppliedQueue({
            bundleFilename: input.filename,
            bundleText: input.text,
            queueFilename: input.recoveryQueue.filename,
            queueText: input.recoveryQueue.text,
          });
          if (sessionIds.has(recovered.sessionId)) {
            throw new Error(`Duplicate session_id ${recovered.sessionId}`);
          }
          sessionIds.add(recovered.sessionId);
          result.sessions.push({
            input_filename: input.filename,
            status: 'accepted',
            session_id: recovered.sessionId,
            integrity_state: 'recovered',
            queue_filename: recovered.queueFilename,
          });
          for (const capture of recovered.wikiCaptures) {
            const maintenanceKey = [recovered.sessionId, capture.eventId, capture.url].join(':');
            if (maintenanceKeys.has(maintenanceKey)) continue;
            maintenanceKeys.add(maintenanceKey);
            result.maintenance_candidates.push({
              maintenance_key: maintenanceKey,
              session_id: recovered.sessionId,
              event_id: capture.eventId,
              source_item_id: capture.sourceItemId,
              title: capture.title,
              url: capture.url,
              status: 'pending',
            });
          }
          continue;
        } catch (recoveryError) {
          result.sessions.push({
            input_filename: input.filename,
            status: 'rejected',
            error: `Bundle validation failed: ${errorMessage(error)}; supplied-queue recovery failed: ${errorMessage(recoveryError)}`,
          });
          continue;
        }
      }
      result.sessions.push({
        input_filename: input.filename,
        status: 'rejected',
        error: errorMessage(error),
      });
      continue;
    }

    result.sessions.push({
      input_filename: input.filename,
      status: 'accepted',
      session_id: bundle.session.session_id,
      integrity_state: bundle.integrity.state,
      queue_filename: bundle.queue_snapshot.filename,
    });

    for (const event of bundle.events) {
      const reconciled: ReconciledEvent = {
        session_id: bundle.session.session_id,
        event_id: event.event_id,
        kind: event.kind,
        event,
      };

      if (event.kind === 'item_action') {
        if (event.action === 'wiki_this') {
          const maintenanceKey = [bundle.session.session_id, event.event_id, event.item.url].join(
            ':'
          );
          if (!maintenanceKeys.has(maintenanceKey)) {
            maintenanceKeys.add(maintenanceKey);
            result.maintenance_candidates.push({
              maintenance_key: maintenanceKey,
              session_id: bundle.session.session_id,
              event_id: event.event_id,
              source_item_id: event.item.source_item_id,
              title: event.item.title,
              url: event.item.url,
              status: 'pending',
            });
          }
        } else if (
          event.action === 'promote_to_in_depth' &&
          queueItemConsumptionDepth(bundle, event.item.source_item_id) === 'in_depth'
        ) {
          const convertedEvent: CommuteSessionBundle['events'][number] = {
            event_id: event.event_id,
            sequence: event.sequence,
            kind: 'quality_incident',
            observed_behavior:
              `A promote_to_in_depth action was recorded for "${event.item.title}", ` +
              'but the embedded canonical queue already classified that item as in_depth.',
            boundary: 'bundle import semantic normalization',
            evidence: event.evidence,
          };
          result.event_conversions.push({
            session_id: bundle.session.session_id,
            event_id: event.event_id,
            reason:
              'The requested promotion contradicts the canonical queue and is playback/process evidence, not classifier feedback.',
            original_event: event,
            converted_event: convertedEvent,
          });
          result.quality_incidents.push({
            session_id: bundle.session.session_id,
            event_id: convertedEvent.event_id,
            kind: convertedEvent.kind,
            event: convertedEvent,
          });
        } else {
          result.feedback_events.push(reconciled);
        }
      } else if (event.kind === 'unresolved_capture') {
        result.unresolved_captures.push(reconciled);
      } else if (event.kind === 'quality_incident') {
        result.quality_incidents.push(reconciled);
      } else if (event.kind === 'general_capture') {
        result.general_captures.push(reconciled);
      }
    }
  }

  return result;
}

function queueItemConsumptionDepth(
  bundle: CommuteSessionBundle,
  sourceItemId: string
): string | undefined {
  const items = bundle.queue_snapshot.queue.items;
  if (!Array.isArray(items)) return undefined;
  for (const candidate of items) {
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) continue;
    const item = candidate as Record<string, unknown>;
    if (item.source_item_id === sourceItemId) {
      return typeof item.consumption_depth === 'string' ? item.consumption_depth : undefined;
    }
  }
  return undefined;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const inputs = await Promise.all(
    options.inputs.map(async (input) => ({
      filename: path.basename(input.bundle),
      text: await readFile(input.bundle, 'utf8'),
      ...(input.recoveryQueue === undefined
        ? {}
        : {
            recoveryQueue: {
              filename: path.basename(input.recoveryQueue),
              text: await readFile(input.recoveryQueue, 'utf8'),
            },
          }),
    }))
  );
  const result = reconcileSessionBundles(inputs);
  ensurePrivateOutput(options.output);
  await mkdir(path.dirname(options.output), { recursive: true });
  await writeFile(options.output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });

  const accepted = result.sessions.filter((session) => session.status === 'accepted').length;
  const rejected = result.sessions.length - accepted;
  process.stdout.write(
    [
      options.output,
      `${accepted} accepted session(s), ${rejected} rejected session(s)`,
      `${result.maintenance_candidates.length} wiki maintenance candidate(s)`,
      `${result.feedback_events.length} feedback event(s), ${result.unresolved_captures.length} unresolved capture(s)`,
    ].join('\n') + '\n'
  );
}

function parseOptions(args: string[]): Options {
  const inputs: Array<{ bundle: string; recoveryQueue?: string }> = [];
  let output: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') {
      const input = args[index + 1];
      if (!input) throw new Error('--input requires a filename');
      inputs.push({ bundle: input });
      index += 1;
    } else if (arg === '--recover-with') {
      const queue = args[index + 1];
      const prior = inputs.at(-1);
      if (!queue || !prior) {
        throw new Error('--recover-with requires a preceding --input and a queue filename');
      }
      if (prior.recoveryQueue)
        throw new Error('Each --input accepts at most one --recover-with queue');
      prior.recoveryQueue = queue;
      index += 1;
    } else if (arg === '--output') {
      const value = args[index + 1];
      if (!value) throw new Error('--output requires a filename');
      output = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg ?? ''}`);
    }
  }

  if (inputs.length === 0 || !output) {
    throw new Error(
      'Usage: import:commute-session-bundles -- --input <bundle.txt> [--recover-with <queue.txt>] [--input <bundle.txt> ...] --output <private-record.json>'
    );
  }

  return { inputs, output };
}

function ensurePrivateOutput(output: string): void {
  const privateRoot = path.resolve('.private');
  const resolvedOutput = path.resolve(output);
  if (!resolvedOutput.startsWith(`${privateRoot}${path.sep}`)) {
    throw new Error('--output must be inside the gitignored .private directory');
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  await main();
}
