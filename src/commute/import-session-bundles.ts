import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bundleArtifactFilenameMatches,
  type CommuteSessionBundle,
  parseCommuteSessionBundleText,
} from './session-bundle.js';

const IMPORT_SCHEMA_VERSION = 'commute-session-import.v1';

interface Options {
  inputs: string[];
  output: string;
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

export interface CommuteSessionImport {
  schema_version: typeof IMPORT_SCHEMA_VERSION;
  imported_at: string;
  sessions: ImportedSession[];
  maintenance_candidates: MaintenanceCandidate[];
  feedback_events: ReconciledEvent[];
  unresolved_captures: ReconciledEvent[];
  quality_incidents: ReconciledEvent[];
  general_captures: ReconciledEvent[];
}

export function reconcileSessionBundles(
  inputs: Array<{ filename: string; text: string }>,
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

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const inputs = await Promise.all(
    options.inputs.map(async (input) => ({
      filename: path.basename(input),
      text: await readFile(input, 'utf8'),
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
  const inputs: string[] = [];
  let output: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') {
      const input = args[index + 1];
      if (!input) throw new Error('--input requires a filename');
      inputs.push(input);
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
      'Usage: import:commute-session-bundles -- --input <bundle.txt> [--input <bundle.txt> ...] --output <private-record.json>'
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
