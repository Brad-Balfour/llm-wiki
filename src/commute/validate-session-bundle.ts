import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  bundleArtifactFilenameMatches,
  createQueueV4Snapshot,
  fileSha256,
  validateCommuteSessionBundle,
  queueSnapshotFingerprint,
} from './session-bundle.js';

import { parseJsonObject } from '../shared/json.js';
import {
  COMPACT_BUNDLE_VERSION,
  readCanonicalQueue,
  validateCompactSession,
} from './compact-session.js';

interface Options {
  input: string;
  queue: string;
  reference?: string;
  durableEventRecord?: string;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const text = await readFile(options.input, 'utf8');
  const record = parseJsonObject(text, 'Commute session bundle');
  const queue = {
    filename: path.basename(options.queue),
    text: await readFile(options.queue, 'utf8'),
  };
  const reference = options.reference
    ? {
        filename: path.basename(options.reference),
        text: await readFile(options.reference, 'utf8'),
      }
    : undefined;
  const bundle =
    record.schema_version === COMPACT_BUNDLE_VERSION
      ? validateCompactSession(
          record,
          readCanonicalQueue({ ...queue, ...(reference && { reference }) })
        )
      : validateCommuteSessionBundle(record);
  if (
    !bundleArtifactFilenameMatches(path.basename(options.input), bundle.session.artifact_filename)
  ) {
    throw new Error(
      'Bundle filename does not match session.artifact_filename (except a Library-added numeric suffix)'
    );
  }
  if (bundle.schema_version === COMPACT_BUNDLE_VERSION) {
    process.stdout.write(
      `Valid compact session bundle: ${bundle.session.session_id}\nQueue: ${bundle.queue_snapshot.filename}\n${bundle.events.length} capture(s)\n`
    );
    return;
  }
  const selectedQueue = JSON.parse(queue.text) as unknown;
  if (path.basename(options.queue) !== bundle.queue_snapshot.filename) {
    throw new Error('Embedded queue filename does not match --queue filename');
  }
  const selectedSnapshot =
    reference === undefined
      ? selectedQueue
      : createQueueV4Snapshot(
          selectedQueue,
          JSON.parse(reference.text) as unknown,
          path.basename(options.queue),
          reference.filename
        );
  if (
    queueSnapshotFingerprint(selectedSnapshot) !==
    queueSnapshotFingerprint(bundle.queue_snapshot.queue)
  ) {
    throw new Error('Embedded queue snapshot does not canonically match --queue JSON');
  }
  if (bundle.integrity.state === 'complete') {
    if (options.durableEventRecord === undefined) {
      throw new Error('Complete bundles require --durable-event-record for local validation');
    }
    const durableRecord = await readFile(options.durableEventRecord, 'utf8');
    const declaredRecord = bundle.integrity.durable_event_record;
    if (
      declaredRecord === undefined ||
      declaredRecord.filename !== path.basename(options.durableEventRecord) ||
      declaredRecord.sha256 !== fileSha256(durableRecord)
    ) {
      throw new Error('Durable event record does not match the complete bundle declaration');
    }
    if (!declaredRecord.covered_event_ids.every((eventId) => durableRecord.includes(eventId))) {
      throw new Error('Durable event record does not contain every declared covered event id');
    }
  }
  const actionCount = bundle.events.filter((event) => event.kind === 'item_action').length;
  const unresolvedCount = bundle.events.filter(
    (event) => event.kind === 'unresolved_capture'
  ).length;

  process.stdout.write(
    [
      `Valid session bundle: ${bundle.session.session_id}`,
      `Queue: ${bundle.queue_snapshot.filename}`,
      `Queue fingerprint: ${queueSnapshotFingerprint(bundle.queue_snapshot.queue)}`,
      'Queue comparison: canonical JSON matched',
      `Integrity: ${bundle.integrity.state}`,
      `${actionCount} item action(s), ${unresolvedCount} unresolved capture(s)`,
    ].join('\n') + '\n'
  );
}

function parseOptions(args: string[]): Options {
  let input: string | undefined;
  let queue: string | undefined;
  let durableEventRecord: string | undefined;
  let reference: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') {
      input = requireOptionValue(args, index, arg);
      index += 1;
    } else if (arg === '--queue') {
      queue = requireOptionValue(args, index, arg);
      index += 1;
    } else if (arg === '--durable-event-record') {
      durableEventRecord = requireOptionValue(args, index, arg);
      index += 1;
    } else if (arg === '--reference') {
      reference = requireOptionValue(args, index, arg);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg ?? ''}`);
    }
  }

  if (!input || !queue) {
    throw new Error(
      'Usage: validate:commute-session-bundle -- --input <bundle.txt> --queue <queue.txt> [--reference <reference.txt>] [--durable-event-record <record.txt>]'
    );
  }

  return {
    input,
    queue,
    ...(reference === undefined ? {} : { reference }),
    ...(durableEventRecord === undefined ? {} : { durableEventRecord }),
  };
}

function requireOptionValue(args: string[], index: number, option: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${option} requires a filename`);
  return value;
}

await main();
