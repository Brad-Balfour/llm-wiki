import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { errorMessage } from '../shared/errors.js';

import {
  bundleArtifactFilenameMatches,
  createQueueV4Snapshot,
  type CommuteSessionBundle,
  parseCommuteSessionBundleText,
  parseCommuteSessionBundleTextWithRelaxedArtifactFilename,
  queueMetadataRecord,
  queueSnapshotFingerprint,
  validateTldrCommuteQueueV2,
} from './session-bundle.js';
import {
  recoveryArtifactKey,
  recoveryArtifactFilenameWarnings,
  recoverSessionBundleWithSuppliedQueue,
  refersToPriorWikiCapture,
} from './recover-session-bundle.js';
import {
  parseMaintenanceCandidate,
  discussionContextKey,
  requireMaintenanceAttemptSource,
  requireMaintenanceAttemptStatus,
  requireDiscussionDisposition,
  requireMaintenanceHttpUrl,
} from './maintenance.js';
import { requireIsoTimestamp } from '../shared/time.js';
import { requireRecord, requireString } from '../shared/validate.js';

export type {
  MaintenanceAttempt,
  MaintenanceAttemptInput,
  MaintenanceAttemptStatus,
  MaintenanceCandidate,
  DiscussionDisposition,
  MaintenanceLatestResult,
} from './maintenance.js';

import type {
  MaintenanceAttempt,
  MaintenanceAttemptInput,
  MaintenanceCandidate,
  MaintenanceLatestResult,
} from './maintenance.js';

const IMPORT_SCHEMA_VERSION = 'commute-session-import.v1';

interface Options {
  inputs: Array<{ bundle: string; recoveryQueue?: string; recoveryReference?: string }>;
  output: string;
}

export interface SessionBundleInput {
  filename: string;
  text: string;
  recoveryQueue?: {
    filename: string;
    text: string;
    reference?: { filename: string; text: string };
  };
}

interface ImportedSession {
  input_filename: string;
  status: 'accepted' | 'rejected';
  session_id?: string;
  integrity_state?: CommuteSessionBundle['integrity']['state'];
  queue_filename?: string;
  queue_fingerprint?: string;
  declared_artifact_filename?: string;
  recovery_warnings?: string[];
  error?: string;
}

export interface ReconciledEvent {
  session_id: string;
  event_id: string;
  kind: string;
  event: CommuteSessionBundle['events'][number];
}

export interface EventConversion {
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
  maintenance_attempts: MaintenanceAttempt[];
  maintenance_results: MaintenanceLatestResult[];
  navigation_events: ReconciledEvent[];
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
    maintenance_attempts: [],
    maintenance_results: [],
    navigation_events: [],
    feedback_events: [],
    unresolved_captures: [],
    quality_incidents: [],
    general_captures: [],
    event_conversions: [],
  };
  const sessionIds = new Set<string>();
  const strictArtifactFilenames = collectStrictArtifactClaims(inputs);
  const acceptedStrictArtifactFilenames = new Map<string, string>();
  const recoveredArtifactFilenames = new Map<string, string>();
  const maintenanceKeys = new Set<string>();

  for (const input of inputs) {
    let bundle: CommuteSessionBundle | undefined;
    const strictRecoveryWarnings: string[] = [];
    let strictIdentityValidated = false;
    try {
      bundle = parseCommuteSessionBundleText(input.text);
      if (!bundleArtifactFilenameMatches(input.filename, bundle.session.artifact_filename)) {
        strictRecoveryWarnings.push(
          `Downloaded bundle filename ${input.filename} does not match declared artifact filename ${bundle.session.artifact_filename}.`
        );
      }
      strictIdentityValidated = true;
      if (sessionIds.has(bundle.session.session_id)) {
        throw new Error(`Duplicate session_id ${bundle.session.session_id}`);
      }
      claimArtifactFilename(
        acceptedStrictArtifactFilenames,
        bundle.session.artifact_filename,
        bundle.session.session_id
      );
      sessionIds.add(bundle.session.session_id);
    } catch (error) {
      if (strictIdentityValidated) {
        result.sessions.push({
          input_filename: input.filename,
          status: 'rejected',
          error: errorMessage(error),
        });
        continue;
      }
      let relaxedBundle: CommuteSessionBundle | undefined;
      let relaxedDeclaredArtifactFilename: string | undefined;
      if (input.recoveryQueue) {
        try {
          const relaxed = parseCommuteSessionBundleTextWithRelaxedArtifactFilename(
            input.text,
            input.filename
          );
          relaxedBundle = relaxed.bundle;
          relaxedDeclaredArtifactFilename = relaxed.declaredArtifactFilename;
        } catch {
          // Continue to bounded wiki-only recovery for other malformed bundles.
        }
      }
      if (relaxedBundle && input.recoveryQueue) {
        try {
          validateFullRecoveryQueue(relaxedBundle, input.recoveryQueue);
          bundle = relaxedBundle;
          if (relaxedDeclaredArtifactFilename === undefined) {
            strictRecoveryWarnings.push(
              'Malformed bundle does not declare a non-empty session.artifact_filename.'
            );
          } else {
            strictRecoveryWarnings.push(
              ...recoveryArtifactFilenameWarnings(
                relaxedDeclaredArtifactFilename,
                'Declared artifact filename',
                bundle.session.session_date
              )
            );
          }
          if (
            relaxedDeclaredArtifactFilename !== undefined &&
            !bundleArtifactFilenameMatches(input.filename, relaxedDeclaredArtifactFilename)
          ) {
            strictRecoveryWarnings.push(
              ...recoveryArtifactFilenameWarnings(
                input.filename,
                'Downloaded bundle filename',
                bundle.session.session_date
              ),
              `Downloaded bundle filename ${input.filename} does not match declared artifact filename ${relaxedDeclaredArtifactFilename}.`
            );
          }
          if (sessionIds.has(bundle.session.session_id)) {
            throw new Error(`Duplicate session_id ${bundle.session.session_id}`);
          }
          claimArtifactFilename(
            acceptedStrictArtifactFilenames,
            bundle.session.artifact_filename,
            bundle.session.session_id
          );
          sessionIds.add(bundle.session.session_id);
        } catch (fullRecoveryError) {
          result.sessions.push({
            input_filename: input.filename,
            status: 'rejected',
            error: `Bundle validation failed: ${errorMessage(error)}; full supplied-queue recovery failed: ${errorMessage(fullRecoveryError)}`,
          });
          continue;
        }
      } else if (input.recoveryQueue) {
        try {
          const recovered = recoverSessionBundleWithSuppliedQueue({
            bundleFilename: input.filename,
            bundleText: input.text,
            queueFilename: input.recoveryQueue.filename,
            queueText: input.recoveryQueue.text,
            ...(input.recoveryQueue.reference === undefined
              ? {}
              : {
                  referenceFilename: input.recoveryQueue.reference.filename,
                  referenceText: input.recoveryQueue.reference.text,
                }),
          });
          if (sessionIds.has(recovered.sessionId)) {
            throw new Error(`Duplicate session_id ${recovered.sessionId}`);
          }
          const recoveryWarnings = [...recovered.recoveryWarnings];
          const artifactKey = recoveryArtifactKey(
            recovered.declaredArtifactFilename ?? input.filename
          );
          const priorArtifactSession =
            strictArtifactFilenames.get(artifactKey) ?? recoveredArtifactFilenames.get(artifactKey);
          if (priorArtifactSession === undefined) {
            recoveredArtifactFilenames.set(artifactKey, recovered.sessionId);
          } else if (priorArtifactSession !== recovered.sessionId) {
            recoveryWarnings.push(
              `Artifact filename ${artifactKey} was also declared by session ${priorArtifactSession}.`
            );
          }
          sessionIds.add(recovered.sessionId);
          result.sessions.push({
            input_filename: input.filename,
            status: 'accepted',
            session_id: recovered.sessionId,
            integrity_state: 'recovered',
            queue_filename: recovered.queueFilename,
            queue_fingerprint: recovered.queueFingerprint,
            ...(recovered.declaredArtifactFilename === undefined
              ? {}
              : { declared_artifact_filename: recovered.declaredArtifactFilename }),
            ...(recoveryWarnings.length === 0 ? {} : { recovery_warnings: recoveryWarnings }),
          });
          for (const capture of recovered.wikiCaptures) {
            const maintenanceKey = maintenanceCandidateKey(
              recovered.sessionId,
              capture.eventId,
              capture.url
            );
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
              ...(capture.discussion === undefined
                ? {}
                : {
                    discussion: {
                      discussion_key: discussionContextKey(
                        recovered.sessionId,
                        capture.eventId,
                        capture.url
                      ),
                      summary: capture.discussion.summary,
                      important_questions: capture.discussion.importantQuestions,
                      conclusions: capture.discussion.conclusions,
                      requested_emphasis: capture.discussion.requestedEmphasis,
                      evidence: capture.discussion.evidence,
                    },
                  }),
            });
          }
          for (const capture of recovered.contradictoryWikiCaptures) {
            const originalEvent: CommuteSessionBundle['events'][number] = {
              event_id: capture.eventId,
              sequence: capture.sequence,
              kind: 'item_action',
              action: 'wiki_this',
              item: {
                source_item_id: capture.sourceItemId,
                title: capture.title,
                url: capture.url,
              },
              user_words: capture.userWords,
              evidence: [userWordsEvidence(capture.userWords, true)],
            };
            const convertedEvent: CommuteSessionBundle['events'][number] = {
              event_id: capture.eventId,
              sequence: capture.sequence,
              kind: 'quality_incident',
              observed_behavior:
                `A wiki_this action was recorded for "${capture.title}", ` +
                'but the captured user words referred to a prior wiki save.',
              boundary: 'bundle import semantic normalization',
              evidence: originalEvent.evidence,
            };
            result.event_conversions.push({
              session_id: recovered.sessionId,
              event_id: capture.eventId,
              reason:
                'A reference to an already completed wiki save is product-state evidence, not a new maintenance request.',
              original_event: originalEvent,
              converted_event: convertedEvent,
            });
            result.quality_incidents.push({
              session_id: recovered.sessionId,
              event_id: capture.eventId,
              kind: 'quality_incident',
              event: convertedEvent,
            });
          }
          for (const incident of recovered.qualityIncidents) {
            result.quality_incidents.push({
              session_id: recovered.sessionId,
              event_id: incident.eventId,
              kind: 'quality_incident',
              event: {
                event_id: incident.eventId,
                sequence: incident.sequence,
                kind: 'quality_incident',
                observed_behavior: incident.observedBehavior,
                boundary: incident.boundary,
                evidence: incident.evidence,
              },
            });
          }
          for (const capture of recovered.generalCaptures) {
            result.general_captures.push({
              session_id: recovered.sessionId,
              event_id: capture.eventId,
              kind: 'general_capture',
              event: {
                event_id: capture.eventId,
                sequence: capture.sequence,
                kind: 'general_capture',
                user_words: capture.userWords,
                evidence: capture.evidence,
              },
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
      if (!relaxedBundle) {
        result.sessions.push({
          input_filename: input.filename,
          status: 'rejected',
          error: errorMessage(error),
        });
        continue;
      }
    }

    if (!bundle) {
      result.sessions.push({
        input_filename: input.filename,
        status: 'rejected',
        error: 'Bundle import reached reconciliation without a validated bundle',
      });
      continue;
    }

    result.sessions.push({
      input_filename: input.filename,
      status: 'accepted',
      session_id: bundle.session.session_id,
      integrity_state: bundle.integrity.state,
      queue_filename: bundle.queue_snapshot.filename,
      queue_fingerprint: queueSnapshotFingerprint(bundle.queue_snapshot.queue),
      ...(strictRecoveryWarnings.length === 0 ? {} : { recovery_warnings: strictRecoveryWarnings }),
    });

    for (const event of bundle.events) {
      const reconciled: ReconciledEvent = {
        session_id: bundle.session.session_id,
        event_id: event.event_id,
        kind: event.kind,
        event,
      };

      if (event.kind === 'item_action') {
        if (event.discussion_warning !== undefined) {
          const warningEventId = uniqueDiscussionWarningEventId(
            event.event_id,
            new Set(bundle.events.map((candidate) => candidate.event_id))
          );
          result.quality_incidents.push({
            session_id: bundle.session.session_id,
            event_id: warningEventId,
            kind: 'quality_incident',
            event: {
              event_id: warningEventId,
              sequence: event.sequence,
              kind: 'quality_incident',
              observed_behavior: event.discussion_warning,
              boundary: 'optional discussion validation',
              evidence: event.evidence,
            },
          });
        }
        if (event.action === 'wiki_this') {
          if (refersToPriorWikiCapture(event.user_words)) {
            const convertedEvent: CommuteSessionBundle['events'][number] = {
              event_id: event.event_id,
              sequence: event.sequence,
              kind: 'quality_incident',
              observed_behavior:
                `A wiki_this action was recorded for "${event.item.title}", ` +
                'but the captured user words referred to a prior wiki save.',
              boundary: 'bundle import semantic normalization',
              evidence: [...event.evidence, userWordsEvidence(event.user_words, false)],
            };
            result.event_conversions.push({
              session_id: bundle.session.session_id,
              event_id: event.event_id,
              reason:
                'A reference to an already completed wiki save is product-state evidence, not a new maintenance request.',
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
            const maintenanceKey = maintenanceCandidateKey(
              bundle.session.session_id,
              event.event_id,
              event.item.url
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
                ...(event.discussion === undefined
                  ? {}
                  : {
                      discussion: {
                        discussion_key: discussionContextKey(
                          bundle.session.session_id,
                          event.event_id,
                          event.item.url
                        ),
                        ...event.discussion,
                      },
                    }),
              });
            }
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
        } else if (event.action === 'skip') {
          // Older prompts emitted skip as an item action. Keep that evidence intact
          // in navigation while newer prompts normalize the same intent to next.
          result.navigation_events.push(reconciled);
        } else {
          result.feedback_events.push(reconciled);
        }
      } else if (event.kind === 'playback_transition') {
        result.navigation_events.push(reconciled);
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

function uniqueDiscussionWarningEventId(eventId: string, existingEventIds: Set<string>): string {
  const base = `${eventId}-discussion-warning`;
  let candidate = base;
  let suffix = 1;
  while (existingEventIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function collectStrictArtifactClaims(inputs: SessionBundleInput[]): Map<string, string> {
  const claims = new Map<string, string>();
  for (const input of inputs) {
    let bundle: CommuteSessionBundle;
    try {
      bundle = parseCommuteSessionBundleText(input.text);
    } catch {
      if (!input.recoveryQueue) continue;
      try {
        bundle = parseCommuteSessionBundleTextWithRelaxedArtifactFilename(
          input.text,
          input.filename
        ).bundle;
        validateFullRecoveryQueue(bundle, input.recoveryQueue);
      } catch {
        continue;
      }
    }
    const artifactKey = recoveryArtifactKey(bundle.session.artifact_filename);
    if (!claims.has(artifactKey)) claims.set(artifactKey, bundle.session.session_id);
  }
  return claims;
}

function validateFullRecoveryQueue(
  bundle: CommuteSessionBundle,
  recoveryQueue: NonNullable<SessionBundleInput['recoveryQueue']>
): void {
  if (recoveryQueue.filename !== bundle.queue_snapshot.filename) {
    throw new Error(
      `Recovery queue filename ${recoveryQueue.filename} does not match bundle queue ${bundle.queue_snapshot.filename}`
    );
  }
  let queueCandidate: unknown;
  try {
    queueCandidate = JSON.parse(recoveryQueue.text) as unknown;
  } catch (error) {
    throw new Error(`Recovery queue is not valid JSON: ${errorMessage(error)}`);
  }
  const suppliedQueue = validateTldrCommuteQueueV2(
    recoveryQueue.reference === undefined
      ? queueCandidate
      : createQueueV4Snapshot(
          queueCandidate,
          JSON.parse(recoveryQueue.reference.text) as unknown,
          recoveryQueue.filename,
          recoveryQueue.reference.filename
        )
  );
  if (
    queueSnapshotFingerprint(suppliedQueue) !==
    queueSnapshotFingerprint(bundle.queue_snapshot.queue)
  ) {
    throw new Error('Recovery queue content does not match the bundle queue snapshot');
  }
}

function userWordsEvidence(
  userWords: string,
  recovered: boolean
): CommuteSessionBundle['events'][number]['evidence'][number] {
  return {
    source: 'explicit_user_capture',
    reference: `${recovered ? 'Recovered user words' : 'User words'}: ${userWords}`,
  };
}

export function maintenanceCandidateKey(
  bundleSessionId: string,
  eventId: string,
  sourceUrl: string
): string {
  const identity = JSON.stringify([bundleSessionId, eventId, sourceUrl]);
  return `sha256:${createHash('sha256').update(identity, 'utf8').digest('hex')}`;
}

function claimArtifactFilename(
  claimedFilenames: Map<string, string>,
  artifactFilename: string,
  sessionId: string
): void {
  const canonicalFilename = artifactFilename.replace(/ ?\([1-9][0-9]*\)\.txt$/, '.txt');
  const priorSessionId = claimedFilenames.get(canonicalFilename);
  if (priorSessionId !== undefined && priorSessionId !== sessionId) {
    throw new Error(
      `Canonical artifact filename ${canonicalFilename} is already declared by distinct session ${priorSessionId}`
    );
  }
  claimedFilenames.set(canonicalFilename, sessionId);
}

export function recordMaintenanceAttempts(
  record: CommuteSessionImport,
  inputs: MaintenanceAttemptInput[]
): CommuteSessionImport {
  const candidates = maintenanceCandidatesByKey(record.maintenance_candidates);
  const attempts = [...record.maintenance_attempts];
  const attemptIds = new Set(attempts.map((attempt) => attempt.attempt_id));

  for (const input of inputs) {
    const candidate = candidates.get(input.maintenance_key);
    if (!candidate) {
      throw new Error(`Maintenance attempt names unknown candidate ${input.maintenance_key}`);
    }
    requireMaintenanceAttemptStatus(input.status, 'Maintenance attempt status');
    requireMaintenanceAttemptSource(input.source, 'Maintenance attempt source');
    requireString(input.detail, 'Maintenance attempt detail');
    requireIsoTimestamp(input.attempted_at, 'Maintenance attempt attempted_at');

    const attempt: MaintenanceAttempt = {
      attempt_id: maintenanceAttemptId(input),
      maintenance_key: candidate.maintenance_key,
      bundle_session_id: candidate.session_id,
      event_id: candidate.event_id,
      source_url: candidate.url,
      source: input.source,
      status: input.status,
      detail: input.detail,
      attempted_at: input.attempted_at,
      ...(input.discussion_disposition === undefined
        ? {}
        : { discussion_disposition: input.discussion_disposition }),
    };
    if (attemptIds.has(attempt.attempt_id)) continue;
    attemptIds.add(attempt.attempt_id);
    attempts.push(attempt);
  }

  return {
    ...record,
    maintenance_attempts: attempts,
    maintenance_results: deriveMaintenanceResults(attempts),
  };
}

export function carryForwardMaintenanceHistory(
  record: CommuteSessionImport,
  previous: unknown
): CommuteSessionImport {
  if (typeof previous !== 'object' || previous === null || Array.isArray(previous)) {
    throw new Error('Prior commute import record must be an object');
  }
  const prior = previous as Record<string, unknown>;
  if (prior.schema_version !== IMPORT_SCHEMA_VERSION) {
    throw new Error('Prior commute import record has an unsupported schema_version');
  }
  if (!Array.isArray(prior.maintenance_candidates)) {
    throw new Error('Prior commute import record must contain maintenance_candidates');
  }

  const currentCandidates = maintenanceCandidatesByKey(record.maintenance_candidates);
  const priorCandidates = maintenanceCandidatesByKey(
    prior.maintenance_candidates.map((candidate, index) =>
      parsePriorMaintenanceCandidate(candidate, index)
    )
  );
  if (currentCandidates.size !== priorCandidates.size) {
    throw new Error('Prior commute import record names a different maintenance candidate set');
  }
  for (const [key, current] of currentCandidates) {
    const candidate = priorCandidates.get(key);
    if (
      !candidate ||
      candidate.session_id !== current.session_id ||
      candidate.event_id !== current.event_id ||
      candidate.url !== current.url
    ) {
      throw new Error(`Prior commute import record does not match maintenance candidate ${key}`);
    }
  }

  if (prior.maintenance_attempts === undefined) return record;
  if (!Array.isArray(prior.maintenance_attempts)) {
    throw new Error('Prior commute import record maintenance_attempts must be an array');
  }
  const attempts = prior.maintenance_attempts.map((attempt, index) =>
    parsePriorMaintenanceAttempt(attempt, index, currentCandidates)
  );
  if (new Set(attempts.map((attempt) => attempt.attempt_id)).size !== attempts.length) {
    throw new Error('Prior commute import record contains duplicate maintenance attempt ids');
  }
  return {
    ...record,
    maintenance_attempts: attempts,
    maintenance_results: deriveMaintenanceResults(attempts),
  };
}

function deriveMaintenanceResults(attempts: MaintenanceAttempt[]): MaintenanceLatestResult[] {
  const results = new Map<string, MaintenanceLatestResult>();
  for (const attempt of attempts) {
    const prior = results.get(attempt.maintenance_key);
    results.set(attempt.maintenance_key, {
      maintenance_key: attempt.maintenance_key,
      bundle_session_id: attempt.bundle_session_id,
      event_id: attempt.event_id,
      source_url: attempt.source_url,
      latest_status: attempt.status,
      latest_detail: attempt.detail,
      latest_attempted_at: attempt.attempted_at,
      attempt_count: (prior?.attempt_count ?? 0) + 1,
      retryable: attempt.status !== 'pr_created' && attempt.status !== 'review_required',
    });
  }
  return [...results.values()];
}

function maintenanceCandidatesByKey(
  candidates: MaintenanceCandidate[]
): Map<string, MaintenanceCandidate> {
  const byKey = new Map<string, MaintenanceCandidate>();
  for (const candidate of candidates) {
    if (byKey.has(candidate.maintenance_key)) {
      throw new Error(`Duplicate maintenance_key ${candidate.maintenance_key}`);
    }
    byKey.set(candidate.maintenance_key, candidate);
  }
  return byKey;
}

function parsePriorMaintenanceCandidate(candidate: unknown, index: number): MaintenanceCandidate {
  return parseMaintenanceCandidate(candidate, `Prior maintenance_candidates[${index}]`);
}

function parsePriorMaintenanceAttempt(
  attempt: unknown,
  index: number,
  candidates: Map<string, MaintenanceCandidate>
): MaintenanceAttempt {
  const field = `Prior maintenance_attempts[${index}]`;
  const record = requireRecord(attempt, field);
  const maintenanceKey = requireString(record.maintenance_key, `${field}.maintenance_key`);
  const candidate = candidates.get(maintenanceKey);
  if (!candidate) {
    throw new Error(`${field} names unknown candidate ${maintenanceKey}`);
  }
  const source = requireMaintenanceAttemptSource(record.source, `${field}.source`);
  const status = requireMaintenanceAttemptStatus(record.status, `${field}.status`);
  const input: MaintenanceAttemptInput = {
    maintenance_key: maintenanceKey,
    source,
    status,
    detail: requireString(record.detail, `${field}.detail`),
    attempted_at: requireIsoTimestamp(record.attempted_at, `${field}.attempted_at`),
    ...(record.discussion_disposition === undefined
      ? {}
      : {
          discussion_disposition: requireDiscussionDisposition(
            record.discussion_disposition,
            `${field}.discussion_disposition`
          ),
        }),
  };
  const parsed: MaintenanceAttempt = {
    ...input,
    attempt_id: requireString(record.attempt_id, `${field}.attempt_id`),
    bundle_session_id: requireString(record.bundle_session_id, `${field}.bundle_session_id`),
    event_id: requireString(record.event_id, `${field}.event_id`),
    source_url: requireMaintenanceHttpUrl(record.source_url, `${field}.source_url`),
  };
  if (
    parsed.bundle_session_id !== candidate.session_id ||
    parsed.event_id !== candidate.event_id ||
    parsed.source_url !== candidate.url
  ) {
    throw new Error(`${field} identity does not match maintenance candidate ${maintenanceKey}`);
  }
  if (parsed.attempt_id !== maintenanceAttemptId(input)) {
    throw new Error(`${field}.attempt_id does not match its attempt fields`);
  }
  return parsed;
}

function maintenanceAttemptId(input: MaintenanceAttemptInput): string {
  const identity = [
    input.maintenance_key,
    input.source,
    input.status,
    input.detail,
    input.attempted_at,
    input.discussion_disposition ?? '',
  ].join('\u0000');
  return `sha256:${createHash('sha256').update(identity, 'utf8').digest('hex')}`;
}

function queueItemConsumptionDepth(
  bundle: CommuteSessionBundle,
  sourceItemId: string
): string | undefined {
  const items = queueMetadataRecord(bundle.queue_snapshot.queue).items;
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
              ...(input.recoveryReference === undefined
                ? {}
                : {
                    reference: {
                      filename: path.basename(input.recoveryReference),
                      text: await readFile(input.recoveryReference, 'utf8'),
                    },
                  }),
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
      `${result.navigation_events.length} navigation event(s), ${result.feedback_events.length} feedback event(s), ${result.unresolved_captures.length} unresolved capture(s)`,
    ].join('\n') + '\n'
  );
}

function parseOptions(args: string[]): Options {
  const inputs: Array<{ bundle: string; recoveryQueue?: string; recoveryReference?: string }> = [];
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
    } else if (arg === '--reference') {
      const reference = args[index + 1];
      const prior = inputs.at(-1);
      if (!prior?.recoveryQueue || !reference) {
        throw new Error('--reference requires a preceding --input and --recover-with queue');
      }
      if (prior.recoveryReference)
        throw new Error('Each --input accepts at most one --reference file');
      prior.recoveryReference = reference;
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
      'Usage: import:commute-session-bundles -- --input <bundle.txt> [--recover-with <queue.txt> [--reference <reference.txt>]] [--input <bundle.txt> ...] --output <private-record.json>'
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

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  await main();
}
