import { createHash } from 'node:crypto';

import { errorMessage } from '../shared/errors.js';
import { optionalRecord, requireArray, requireRecord } from '../shared/validate.js';
import {
  canonicalBundleArtifactFilename,
  queueSnapshotFingerprint,
  validateTldrCommuteQueueV2,
} from './session-bundle.js';

export interface SuppliedQueueRecoveryInput {
  bundleFilename: string;
  bundleText: string;
  queueFilename: string;
  queueText: string;
}

export interface RecoveredWikiCapture {
  eventId: string;
  sourceItemId: string;
  title: string;
  url: string;
}

export interface RecoveredSessionBundle {
  sessionId: string;
  artifactFilename: string;
  queueFilename: string;
  queueFingerprint: string;
  wikiCaptures: RecoveredWikiCapture[];
}

/**
 * Recover only explicitly marked wiki captures from a malformed historical
 * bundle. This is intentionally separate from v1 validation: the supplied
 * queue supplies exact item identity; the malformed bundle supplies only its
 * named queue and legacy item reference.
 */
export function recoverSessionBundleWithSuppliedQueue(
  input: SuppliedQueueRecoveryInput
): RecoveredSessionBundle {
  const bundle = parseJsonObject(input.bundleText, 'Recovery bundle');
  const queue = validateTldrCommuteQueueV2(parseJsonObject(input.queueText, 'Recovery queue'));
  const declaredQueueFilename = declaredQueueName(bundle);
  if (declaredQueueFilename !== input.queueFilename) {
    throw new Error(
      `Recovery queue filename ${input.queueFilename} does not match malformed bundle queue ${declaredQueueFilename}`
    );
  }

  const items = queue.items;
  if (!Array.isArray(items)) {
    throw new Error('Recovery queue must contain an items array');
  }
  const exactItems = items.map((item, index) => parseQueueItem(item, index));
  const events = requireArray(bundle.events, 'Recovery bundle events');
  const artifactFilename = declaredArtifactFilename(bundle, input.bundleFilename);
  const sessionId = declaredSessionId(bundle, artifactFilename);
  const wikiCaptures: RecoveredWikiCapture[] = [];

  for (const [index, event] of events.entries()) {
    const record = requireRecord(event, `Recovery bundle events[${index}]`);
    if (!isWikiCapture(record)) continue;
    const item = resolveLegacyItem(
      record.item,
      exactItems,
      `Recovery bundle events[${index}].item`
    );
    wikiCaptures.push({
      eventId: lenientOptionalString(record.event_id) ?? `recovered-event-${index + 1}`,
      sourceItemId: item.sourceItemId,
      title: item.title,
      url: item.url,
    });
  }

  return {
    sessionId,
    artifactFilename,
    queueFilename: input.queueFilename,
    queueFingerprint: queueSnapshotFingerprint(queue),
    wikiCaptures,
  };
}

interface ExactQueueItem {
  position: number;
  sourceItemId: string;
  title: string;
  url: string;
}

function declaredQueueName(bundle: Record<string, unknown>): string {
  const snapshot = optionalRecord(bundle.queue_snapshot);
  const snapshotFilename = snapshot && lenientOptionalString(snapshot.filename);
  const session = optionalRecord(bundle.session);
  const sessionFilename = session && lenientOptionalString(session.queue_filename);
  const filename = snapshotFilename ?? sessionFilename;
  if (!filename) {
    throw new Error('Malformed bundle does not name the selected queue file');
  }
  return filename;
}

function declaredSessionId(bundle: Record<string, unknown>, bundleFilename: string): string {
  const session = optionalRecord(bundle.session);
  const declared = session && lenientOptionalString(session.session_id);
  if (declared) return declared;
  return `recovered-${createHash('sha256')
    .update(canonicalBundleArtifactFilename(bundleFilename))
    .digest('hex')
    .slice(0, 16)}`;
}

function declaredArtifactFilename(bundle: Record<string, unknown>, inputFilename: string): string {
  const session = optionalRecord(bundle.session);
  return canonicalBundleArtifactFilename(
    (session && lenientOptionalString(session.artifact_filename)) ?? inputFilename
  );
}

function parseQueueItem(candidate: unknown, index: number): ExactQueueItem {
  const item = requireRecord(candidate, `Recovery queue items[${index}]`);
  const sourceItemId = requiredString(
    item.source_item_id,
    `Recovery queue items[${index}].source_item_id`
  );
  const title = requiredString(item.title, `Recovery queue items[${index}].title`);
  const url = requiredString(item.url, `Recovery queue items[${index}].url`);
  return { position: index + 1, sourceItemId, title, url };
}

function isWikiCapture(event: Record<string, unknown>): boolean {
  return event.action === 'wiki' || (event.kind === 'item_action' && event.action === 'wiki_this');
}

function resolveLegacyItem(
  candidate: unknown,
  queueItems: ExactQueueItem[],
  field: string
): ExactQueueItem {
  if (typeof candidate === 'number' && Number.isInteger(candidate)) {
    return byPosition(candidate, queueItems, field);
  }
  const record = requireRecord(candidate, field);
  const sourceItemId = lenientOptionalString(record.source_item_id);
  if (sourceItemId) {
    const exact = queueItems.find((item) => item.sourceItemId === sourceItemId);
    if (exact) return exact;
    if (/^[1-9][0-9]*$/.test(sourceItemId)) {
      return byPosition(Number(sourceItemId), queueItems, field);
    }
  }
  throw new Error(`${field} does not identify an exact item or one-based queue position`);
}

function byPosition(position: number, queueItems: ExactQueueItem[], field: string): ExactQueueItem {
  const item = queueItems[position - 1];
  if (!item) throw new Error(`${field} position ${position} is outside the supplied queue`);
  return item;
}

function parseJsonObject(text: string, field: string): Record<string, unknown> {
  try {
    return requireRecord(JSON.parse(text) as unknown, field);
  } catch (error) {
    throw new Error(`${field} is not valid JSON: ${errorMessage(error)}`);
  }
}

function requiredString(candidate: unknown, field: string): string {
  const value = lenientOptionalString(candidate);
  if (!value) throw new Error(`${field} must be a non-empty string`);
  return value;
}

/** Legacy bundles are salvaged leniently: absent and blank are both "missing". */
function lenientOptionalString(candidate: unknown): string | undefined {
  return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : undefined;
}
