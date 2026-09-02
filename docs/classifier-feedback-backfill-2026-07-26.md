# Classifier Feedback Backfill — 2026-07-26

## Purpose

This is the committed, privacy-safe inventory for classifier corrections
recovered from Brad's July commute artifacts. The raw artifacts and labels are
private inputs to the next classifier-calibration review; they are not
disposable import output.

Do not start a classifier/profile upgrade by reconstructing this evidence from
chat history or by silently proceeding without it.

## Canonical Private Data

Paths are relative to the workspace that contains the implementation repository
at `repo/`:

| Artifact                  | Canonical private path                                                     | SHA-256                                                            |
| ------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Private recovery manifest | `private-data/classifier-feedback/backfills/2026-07-26/manifest.json`      | Recompute after recording an off-machine backup.                   |
| Supplied source archive   | `private-data/classifier-feedback/backfills/2026-07-26/source-bundles.zip` | `788391db0e734aa3b7bf44f8baa5deb7259ded2e45366885e4ca0e9073aa76ce` |
| Validated label snapshot  | `private-data/classifier-feedback/backfills/2026-07-26/labels.jsonl`       | `235dda7372ae90486c5c3414d7e2e002367f38e06af52679f444bdc28c39071d` |
| Append-only working store | `repo/.private/classifier-feedback/labels.jsonl`                           | Verify at review time; it may contain later labels.                |

The snapshot contains three `classifier-feedback-label.v1` records: two depth
corrections and one interest correction, from July 20, July 21, and July 24.
Each record passed exact queue/item/original-classification binding and retained
the verbatim correction privately.

The source archive yielded 67 non-metadata files and 27 session-bundle
candidates. Thirteen files validated, representing twelve unique bundles.
Fourteen malformed bundles remain in the source archive but did not contribute
automatic labels. Redundant commands, wiki and skip actions, general or
unresolved captures, and quality incidents were excluded from classifier data.

## Durability And Privacy

The canonical archive and immutable label snapshot live outside `.private/` so
normal checkout or worktree cleanup does not erase them. The working JSONL
remains under `.private/` because it is append-only runtime data.

The repository is public. Do not commit raw bundles, titles, URLs, verbatim
feedback, or the private JSONL without a separate content/privacy review.
Checksums, counts, schema versions, and aggregate correction categories are the
committed recovery record.

The workspace copy is not an off-machine backup. Before task 6.3 consumes these
labels, copy the canonical private directory to a user-controlled private
backup, verify both checksums, and record the backup verification date here.

## Required Classifier-Upgrade Sequence

1. Verify the canonical snapshot checksum and validate every JSONL record.
2. Combine the snapshot with later validated labels without changing the
   immutable snapshot or duplicating its label IDs.
3. Complete operating-loop task 5.3's measured report: repeated misses,
   high-harm false skips, score distance from thresholds, and model/profile
   version groupings.
4. Use that report, the working Project classifier evidence, and the scheduled
   Task diagnosis for bootstrap task 4.1's local-classifier decision.
5. Define task 6.3's explicit consumption policy. Recording a label alone must
   not change Prompt 3.0, the interest profile, routing, or queue generation.
6. Add task 6.5b's regression and comparative tests before any live cutover.

The working ChatGPT Project queue and Voice workflow remain the non-regression
baseline throughout this sequence.
