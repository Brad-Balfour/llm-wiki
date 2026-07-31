# Commute Experiment Log

This is the durable, evidence-based record for the ChatGPT Project commute
experiment. It records what was tried, what the available artifacts actually
showed, and the current unanswered questions. It is not a second set of Voice
instructions, and it does not treat a model's statement that it wrote a file or
found a queue as proof.

## Evidence Sources

- The six shared conversation transcripts supplied for July 22, including the
  General and Dev commute sessions, their restart/export attempts, and the
  earlier failed bundle-producing session.
- The two downloaded July 22 queues and two downloaded session bundles.
- The three July 24 shared commute transcripts and the three downloaded
  session bundles inspected during the July 25 post-mortem.
- The July 28 Task screenshot and scheduled output chat, the five downloaded
  session bundles, the four original queues, and the corresponding source
  newsletters read through Gmail for the queue-selection audit.
- The three downloaded July 29 queues, two downloaded session bundles, and four
  unique shared conversations covering the General and Dev sessions. The fifth
  supplied URL duplicated one of those conversations.
- The four downloaded July 30 queues, four downloaded session bundles, and five
  shared conversations covering General, Dev, AI, and Fintech. Dev was split
  across its initial queue-load chat and a resumed playback/export chat.
- The live `Weekday TLDR Queues` Task conversation/configuration, the July
  21-24 Task Update emails, the July 24 manual queue-generation control, and
  the live Project settings/sources inspected on July 26.
- The versioned project prompt, schemas, OpenSpec changes, source code, tests,
  commits, and merged pull requests in this repository.

The transcript evidence is useful for recovering Brad's explicit requests and
observed failures. It is not authoritative for a claimed queue position, URL,
or file write when an actual queue or downloaded artifact contradicts it.

## Product Objective

The intended loop is:

```text
scheduled queue -> focused Voice commute -> explicit save or feedback
-> self-contained download -> local source retrieval and wiki maintenance
```

The car interaction should not make Brad manage internal terms such as ledgers,
source IDs, approvals, or recovery modes. The local repository can validate,
retrieve sources, and preserve history after the drive.

## Historical Timeline

| Date       | Revision / change                                                                              | What it attempted                                                                                                                                                                           | What the evidence taught                                                                                                                                                                                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jul. 12–14 | Legacy v1 prompt, live ledger, and `commute-handoff.v2`                                        | Keep one mutable ledger in the Project Library and reconstruct a handoff at the end.                                                                                                        | The resulting files were partial, late-created, or inconsistent with claimed live writes. The ledger is not a reliable Voice-state mechanism.                                                                                                                                                                                     |
| Jul. 16    | `commute-wiki-replan-2026-07-16.md`                                                            | Record the failures and separate queue, session, wiki, and calibration loops.                                                                                                               | The document correctly identified that prompt prose cannot turn missing runtime state into durable state. It also retained the known-good observable signals for scheduled queues.                                                                                                                                                |
| Jul. 19    | Queue v2 cutover and Prompt 2.2                                                                | Move to one selected queue and a self-contained `commute-session-bundle.v1`; retire legacy ledger and handoff sources from the live Project.                                                | A self-contained bundle is the right home-side artifact, but one selected queue did not by itself make Voice retain or rediscover it.                                                                                                                                                                                             |
| Jul. 19    | Prompt 2.3 and 2.7                                                                             | Tighten event lifecycle, one-cursor playback, bundle filenames, and end-of-session behavior.                                                                                                | These changes improved what a valid bundle should look like. They did not prove that Voice could remember the queue or record every action.                                                                                                                                                                                       |
| Jul. 20    | Prompt 2.8                                                                                     | Reintroduce recovery of the already requested canonical file during playback/export, instead of refusing a bundle merely because the event record was incomplete.                           | This was a useful correction to the earlier stop-on-loss behavior, but the exact-name lookup is still unreliable in some Voice sessions.                                                                                                                                                                                          |
| Jul. 20    | Scheduled queue-v2 run                                                                         | Generate that day's General, Dev, AI, and Fintech queues in the live Project.                                                                                                               | Four real artifacts were created. The conversation then anomalously said the recurring task had been disabled because the run succeeded.                                                                                                                                                                                          |
| Jul. 21    | Natural-language save support, explicit-end behavior, and supplied-queue recovery (PRs #30–31) | Accept genuine "save this" wording when a bundle binds it to the current item; repair older malformed bundles only when they contain an explicit wiki marker and a matching supplied queue. | The local path is safer and more useful, but it cannot recover a natural-language save that Voice never put in the bundle.                                                                                                                                                                                                        |
| Jul. 21-24 | Scheduled queue-v2 runs                                                                        | Continue the weekday Gmail-to-queue path with the same managed prompt.                                                                                                                      | Gmail discovery found the expected three or four editions on every run, but every scheduled artifact-writing path failed with the same generic `oai_http_clients.client.ClientError`.                                                                                                                                             |
| Jul. 22    | General and Dev sessions                                                                       | Use real queues, discuss high-value items, save two for later team sharing, and export bundles.                                                                                             | The sessions retained valuable discussion, but failed to preserve the two saves. Exact Library lookup failed despite the files being attachable by Brad. The available queues also conflict with some transcript item identities.                                                                                                 |
| Jul. 24    | General, Dev, and AI sessions                                                                  | Exercise queue-v2 playback, article discussion, wiki captures, exact-name recovery, and self-contained bundle export.                                                                       | All three bundles preserved exact canonical queue snapshots; Dev and AI exported on the first attempt. General recovered after an avoidable refusal. Several spoken modes and summaries diverged from the embedded queues, proving that correct queue identity does not guarantee per-item field projection.                      |
| Jul. 24    | Manual Gmail-to-queue control                                                                  | Run the same Project queue-generation behavior manually after the scheduled run failed.                                                                                                     | The manual chat created real General, Dev, and AI queue downloads. Same-day scheduled failure plus manual success isolates the defect to scheduled/background artifact generation rather than Gmail discovery or the v2 queue contract.                                                                                           |
| Jul. 25    | Prompt 3.0 and fail-soft local conversion                                                      | Project every initial announcement from the literal current queue item and preserve semantically contradictory feedback as a quality incident rather than classifier evidence.              | All three reattached bundles imported as accepted recovered sessions. Their embedded queues matched the three downloaded canonical queues exactly. The contradictory state-management promotion was preserved and converted into a quality incident without rejecting any session.                                                |
| Jul. 26    | Live configuration audit                                                                       | Compare repository prompts with the signed-in Task and Project, inspect sources, conversations, and failure emails, and reconcile OpenSpec.                                                 | Prompt 3.0 is live, all six sources are present, and the Task body exactly matches the committed v2 body. The deployment cutover is verified; only scheduled artifact reliability remains unproven.                                                                                                                               |
| Jul. 28    | Scheduled failure, manual control, and queue-selection audit                                   | Re-run the weekday Task, validate its manual outputs, process five commute bundles, and compare the queues with the source newsletters and profile.                                         | The 11:05 AM scheduled run found General, Dev, and AI but failed both file-writing paths with the same `ClientError`; the 12:43 PM manual control created three valid queues. All five sessions were locally recoverable, but the General and Dev queues each contained only one item and omitted several direct profile matches. |
| Jul. 29    | General and Dev sessions plus source-grounded wiki maintenance                                 | Validate three four-item queues, reconcile two downloaded bundles, recover explicit saves from the shared conversations, and preserve the commute discussion in the wiki.                   | The queue artifacts were valid, but both session bundles violated the contract. Supplied-queue recovery retained the two General saves; the empty Dev bundle lost its save entirely, so the user-provided chat was required to prove the exact item-specific action.                                                              |
| Jul. 30    | Four-queue commute and bundle-grounding audit                                                  | Validate General, Dev, AI, and Fintech queues; reconcile four bundles; and compare recovered saves with the five shared conversations.                                                      | The four queues were valid and most spoken playback was smooth, but only the Dev bundle was strictly valid. General and AI exported placeholder snapshots, Fintech used an unsupported pseudo-ID and UTC filename, and resumed Dev playback replaced its canonical queue with four unrelated items.                               |

### July 24 Bundle Acceptance Result

The July 25 deterministic acceptance run used the three downloaded bundle
artifacts and their corresponding downloaded queues, not reconstructed
transcript data:

- all three queue-v2 files validated: six General items, three Dev items, and
  three AI items;
- all three bundle snapshots matched their corresponding canonical queue as
  canonical JSON, with exact fingerprints;
- all three sessions imported as `recovered`, with zero rejected sessions and
  zero unresolved captures;
- the import produced three wiki-maintenance candidates, one genuine classifier
  feedback event, three quality incidents, and one semantic event conversion;
  and
- the conversion retained the original state-management promotion wording,
  interpreted it as a playback/process contradiction because the canonical
  item was already `in_depth`, and allowed the rest of the intake to complete.

The normalized intake is deliberately private and gitignored. The durable
public evidence is the aggregate result above plus the fixture-backed importer
behavior, not the raw commute transcript or private intake record.

### July 28 Acceptance And Selection Result

The deterministic intake accepted all five supplied session bundles. The Dev
and AI bundles strictly matched their canonical queue snapshots; the morning
Fintech bundle and two General bundles required supplied-queue recovery because
their embedded snapshots were placeholders. The import retained one exact wiki
candidate, three explicit quality incidents, and no exact classifier correction.
The classifier-related General conversation explicitly questioned whether the
classifier should have produced a one-item queue. It did not identify an omitted
article or corrected interest/depth value, so it is classification-QA evidence,
not a `classifier-feedback-label.v1` correction.

All four downloaded queues passed the local v2 validator: one General item, one
Dev item, two AI items, and two prior-day Fintech items. Those counts reflected
the artifacts but not the source newsletters. A Gmail comparison found obvious
omissions that map directly to the current profile, including:

- robotics data strategy, artifact authenticity, and software-testing methods
  from General;
- programming-language concepts, AI's effect on programming, provider-neutral
  model integration, developer-productivity measurement, and computing history
  from Dev; and
- task crossover, security evals, model distillation, and agent-delegation
  guidance from AI.

The omission pattern is too broad to explain as a genuinely sparse newsletter
day. Treat it as classifier/queue-selection evidence, distinct from both the
scheduled file-writing defect and cross-newsletter duplicate handling. The
manual queue files are schema-valid transport artifacts, but schema validity
does not establish selection quality.

The two General conversations also exposed filename regressions. A session shown
at 6:08 PM Eastern exported as `202607282209...`, using a UTC-derived prefix
despite the explicit New York wall-clock rule. A session shown at 5:50 PM
exported as `202607281700...`, which did not preserve the actual local minute.
Syntactic `HHmm` validation alone cannot detect either false timestamp.

### July 29 Acceptance And Maintenance Result

All three downloaded queues passed the local v2 validator with four items each:
General, Dev, and AI. Only General and Dev had supplied session bundles.

Neither bundle passed strict validation:

- the General bundle marked playback `completed` while also declaring
  `resume_source_item_id`, an explicitly forbidden state; and
- the Dev bundle embedded a placeholder note instead of a v2 queue snapshot and
  contained no events despite a completed four-item conversation.

The bounded `--recover-with` path accepted both sessions against their exact
named queues. It retained the two General `wiki_this` events with no classifier
feedback or unresolved captures. The Dev fallback could not retain the missing
save because the downloaded artifact contained no event to bind.

The shared conversations supplied independent user-observation evidence:

- General explicitly saved _The Orchestrator's Tax_ and the DoorDash,
  Instacart, and Uber Eats search comparison. The discussion required the first
  page to preserve the persistent-versus-dynamic subagent question and the
  second to treat all three underlying engineering sources as first-class
  references.
- Dev explicitly said "Save this for the wiki" while item four, _How Building
  Software Is Changing at Anthropic_, was current. The original source URL and
  queue identity agreed, so the save was processed as a recovered
  user-provided chat observation rather than attributed to the empty bundle.

The resulting maintenance created two concepts—one about orchestrator working
memory and one comparing LLM integration depth in production search—and
materially updated the existing AI-native software engineering concept. The
unrelated iOS audio-playback tail was intentionally excluded from workflow
analysis at Brad's direction.

### July 30 Acceptance And Maintenance Result

All four downloaded queues passed the local v2 validator: four General items,
five Dev items, four AI items, and four Fintech items.

Only the Dev bundle passed strict validation. It embedded the exact canonical
queue and honestly recorded two unresolved saves plus two quality incidents.
General and AI embedded placeholder notes instead of their queues; supplied
queue recovery accepted both. Fintech also embedded a placeholder, but its
`wiki_this` event used `item-3` and an invalid placeholder URL, so the bounded
importer rejected that session rather than interpreting the pseudo-ID.

The fail-soft combined intake therefore retained three accepted sessions, one
rejected session, one deterministic maintenance candidate, two unresolved
captures, two quality incidents, and no classifier correction. The evidence
supported two carefully separated maintenance decisions:

- General's numeric item-four marker recovered exactly to _Treat prompt changes
  like code deploys_. The shared conversation showed a grounding mismatch:
  Voice discussed a different Langfuse prompt-CI/CD article under the same
  title. The resulting wiki concept uses the canonical queue article as
  provenance and the public Langfuse page only as a supporting implementation
  reference.
- Fintech's rejected bundle still contained Brad's explicit "Save this," the
  exact canonical item-three title, and an unambiguous positional pseudo-ID.
  That evidence was processed as a manual recovery, not reported as importer
  acceptance. It materially expanded the existing AI-native software
  engineering page instead of creating a duplicate.

Dev exposed the day's largest product failure. The first chat could not discover
the current queue until Brad attached it, after which it read the correct five
headlines and item one. The resumed chat then announced four different articles
that do not exist in the canonical queue, accepted saves for two of them, and
declared that invented queue complete. Those saves remain unresolved because
neither title can be bound to a canonical item. AI and Fintech otherwise reached
their final items and exported without a conversational refusal.

The Fintech conversation also identified a repeated timestamp defect:
`202607302229...` used UTC instead of the required America/New_York wall clock;
the corresponding local time was about 18:29 EDT.

## What Worked

- The weekday Task has produced real dated, parseable queues, including four
  artifacts on July 20. A scheduler UI "last ran" value alone is not evidence,
  and July 21-24 plus July 28 failures mean the scheduled path is currently
  unreliable.
- Manual same-Project controls created the expected July 24 and July 28 queues
  after those days' scheduled failures. They remain the current operational
  control and fallback.
- A manually attached queue restores grounded playback after Voice claims it
  cannot find the same file in the Project Library.
- Long-form discussion can identify genuinely valuable material. On Jul. 22,
  the Kiro and Claude Code subagents conversations contained enough substantive
  reasoning to improve the resulting wiki pages beyond a newsletter summary.
- Public source retrieval and a local repository-backed wiki can turn an
  explicit commute save into durable, reviewable knowledge.
- The July 30 General, AI, and Fintech conversations progressed through their
  queues with little driver intervention once the queue was available.
- The current local importer has useful defenses: it validates embedded queue
  snapshots, rejects unsupported state, accepts evidence-backed natural-language
  captures, and can recover certain malformed historical bundles from a supplied
  matching queue.

## What Failed

### Mutable state and claimed writes

The live ledger experiment failed repeatedly. Artifacts did not substantiate
the claimed sequence of writes, and later reconstructions introduced incorrect
headlines, URLs, or item associations. Do not revive the ledger as a remedy.

### Scheduled artifact generation

The July 21-24 and July 28 scheduled runs completed Gmail discovery, then failed every
artifact-writing path with the same generic
`oai_http_clients.client.ClientError`. The same Project and v2 sources produced
real queues in manual July 24 and July 28 controls. Treat this as a
scheduled/background platform-boundary defect unless later evidence identifies
a repository input that differs. Do not rewrite classification or queue logic
as the first remedy.

### Queue-selection undercoverage

The July 28 General and Dev queues each contained one surfaced item even though
their newsletters contained several direct strong- or moderate-interest matches.
The AI queue also omitted high-signal agent delegation, eval, and work-pattern
items. Because routing requires both `interested` and `maybe` items to be
surfaced, this is not explained by a small optional-item budget. Preserve the
downloaded files as evidence, but audit classification coverage against the full
parsed candidate set before trusting a low `total_items` value.

The surviving queue records are not sufficient to locate the first failed
boundary. They omit rejected items and report profile, classifier-prompt, and
route versions that do not match the committed source identifiers. A useful
diagnostic run must retain a private sanitized sidecar containing every parsed
candidate, its classifier output, validation status, and derived route. The
July 28 omissions should then become a hand-annotated interest/depth coverage
set so parser recall, classifier recall, and routing can be measured separately.

### Library discovery in Voice

The General and Dev transcripts show the assistant failing an exact lookup for
today's queue, then failing again after Brad instructed it to inspect recent
Library files. Brad could attach the missing file manually, and that attachment
restored playback. This is a discovery or attachment-scope failure, not proof
that the queue was absent.

### Capture loss

The General session explicitly saved the Kiro discussion for later office
sharing. The Dev session explicitly saved the Claude Code subagents discussion
and marked it high priority for team sharing. Neither downloaded bundle retained
the capture. A later bundle must not manufacture their item IDs from a
conflicting queue merely to look complete.

The July 29 Dev bundle repeated the failure in a stronger form: it exported no
events at all after an explicit save on a queue item that the shared
conversation and original queue identify exactly. Supplied-queue fallback alone
correctly retained nothing, because the malformed artifact contained no marker
to recover. A user-provided chat observation can support a separate recovered
capture when it includes the literal save, current item, and matching queue
identity; the importer must not pretend that evidence came from the bundle.

The July 30 Dev bundle preserved both missing-identity saves as unresolved
instead of manufacturing queue IDs. That artifact behavior was correct, but the
underlying Voice session was not: resumed playback substituted an entirely
different four-item sequence after the exact five-item queue had already been
attached and read.

### False reconstruction and weak grounding

- A Dev recovery claimed an item about Claude for Financial Services that is
  absent from the supplied July 22 Dev queue.
- The General transcript identifies Kiro as item 7, while the supplied General
  queue identifies a different item at that position.
- A response about _Claude Is Not a Compiler_ was followed by an explicit
  judgment that it did not add much, yet an earlier partial bundle recorded it
  as a wiki save.
- The earlier failed session included unwanted classifier-rationale narration;
  Brad's correction to omit that rationale was not reliably retained in the
  final artifact.
- The July 30 General session discussed the Langfuse prompt-CI/CD article while
  its canonical queue item and recovered maintenance candidate pointed to a
  different article with the same title.
- The July 30 Fintech export used a UTC-derived filename and an `item-3`
  pseudo-ID with a placeholder URL, preventing deterministic supplied-queue
  recovery even though the bundle's title matched canonical queue position 3.

## July 22 Transcript Crosswalk

| Session                      | What the conversation adds                                                                                                                                                                                             | Lesson retained                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 07:09 failed commute export  | The prior six-item commute ended with feedback to stop narrating classification rationale. The session then refused to create a bundle because it claimed the queue snapshot was unavailable.                          | Brevity feedback is a product requirement, and missing event history is not grounds to discard a recoverable queue snapshot.       |
| 17:47 General commute        | The Kiro discussion compared spec-driven IDE workflows, repository-held artifacts, agent runtime ownership, model choice, and team use. Brad explicitly saved it for office sharing.                                   | A saved source should preserve the practical decision frame developed in discussion, not only the newsletter headline.             |
| 18:09 General bundle attempt | The discussion of _Claude Is Not a Compiler_ concluded that its conceptual reframing did not add enough beyond existing material. A later partial bundle nevertheless marked it as saved.                              | A generated bundle cannot override the user’s actual evaluation of an article.                                                     |
| 18:13 Dev commute            | The Claude Code subagents discussion covered isolated context, agent definitions, tool restrictions, shared directories, and team distribution. Brad explicitly saved it and marked it high priority for work sharing. | Extended questions can provide the operating-model synthesis that primary documentation alone does not state.                      |
| 18:35 repeat request         | "Do it again" was met with a clarification request instead of repeating the immediately preceding safe action.                                                                                                         | Voice needs an action-oriented repeat rule; do not make a driver restate routine commands.                                         |
| 18:35:30 restart and export  | The Dev session resumed only after another manual upload. The later bundle was delivered, but its recovered event history covered only the tail of the commute.                                                        | A visible download is valuable, but integrity scope must be explicit and local recovery cannot fill missing captures by inference. |

## Retired or Insufficient Remedies

| Remedy                                                  | Status       | Why it is not the next answer                                                                                   |
| ------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------- |
| Mutable Library ledger                                  | Retired      | The artifacts disproved the premise that Voice reliably appends to it.                                          |
| Refuse export or playback on lost context               | Insufficient | It made the commute fail even when the queue could later be attached or rediscovered.                           |
| Exact-name lookup only                                  | Insufficient | It avoids stale-queue substitution but misses files that a recent-file listing or manual attachment can reveal. |
| Broader fuzzy selection without content validation      | Rejected     | It risks reading an older date, the wrong newsletter, or a similarly named queue.                               |
| Reconstruct an item from topic memory or position alone | Rejected     | The Jul. 22 Kiro and Dev mismatches show that this creates false captures.                                      |
| Stronger wording alone                                  | Insufficient | Prompt revisions improved expectations and validation language but cannot guarantee Library tool availability.  |

## Current Queue-Discovery Rule: Prompt 3.0

Prompt 3.0 keeps Prompt 2.9's discovery ordering and adds direct per-item field
projection:

1. Search for the canonical filename first.
2. If that fails, list recent Project Library files and inspect plausible queue
   candidates.
3. Choose a fallback only when its validated v2 JSON uniquely matches the
   requested edition date and newsletter type.
4. Never choose an older date, another newsletter, or a topical look-alike.
5. Before every announcement, use the current queue object's literal playback
   phrase, reading mode, title, and summary rather than conversational memory or
   an article-level substitute.
6. Preserve semantic contradictions for home-side conversion; do not stop the
   commute or discard the rest of the bundle.

This is a bounded recovery strategy, not an explanation of root cause. It
addresses the observed difference between exact search and recent-file listing
without permitting silent stale-queue substitution.

## Next Diagnostic: Library Discovery Probe

Run this as a short text-chat experiment before a Voice commute, using one
known dated queue that is visible in the Project Library:

1. Ask for the exact canonical filename and record the returned result.
2. In the same chat, ask for the most recent plausible TLDR queue files and
   request only filename, edition date, and newsletter type from each candidate.
3. Attach that same known queue manually and confirm the assistant can read its
   `edition_date`, `newsletter`, and first item.
4. Save the three outputs and the visible attachment state together. Repeat once
   in Voice only if the text-chat results are clear.

The probe distinguishes these hypotheses without guessing:

- exact filename indexing is incomplete while recent-file listing is available;
- Voice sees a different attachment or Project scope from text chat;
- the file is discoverable but the model declines or fails to inspect it; or
- the file metadata/name differs from the expected canonical form.

No higher reasoning setting is required to run this probe. A stronger model can
help analyze the captured evidence afterward, but it cannot make an unavailable
Library result appear.

### July 22 Home Probe Result

Brad ran the probe at home over Wi-Fi in one text chat and two Voice-chat
segments. The evidence is encouraging, but it does not isolate network type:

| Surface            | What the transcript establishes                                                                                                                                                                       | What it does not establish                                                                                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text chat          | A recent-file listing returned current General and Dev queues plus older candidates. A later exact lookup returned `20260722-tldr-ai.txt` with the expected edition date, newsletter, and first item. | The chat began with an uploaded file, so its result is not a pure Project-Library-only control. The initial recent-file list also did not include that current AI queue.                                                      |
| Initial Voice chat | Before any manual upload, Voice found `20260722-tldr-dev.txt`, read its July 22 / TLDR Dev / eight-item metadata and first item, then listed recent queue candidates.                                 | The recent listing claimed that today's AI and Fintech queues were absent, even though the text probe later found today's AI queue. This is evidence of incomplete or variable discovery, not proof that the file was absent. |
| Resumed Voice chat | After the drop and manual attachment, Voice read the attached Dev queue's edition date, newsletter, and first item correctly.                                                                         | It does not test Project-Library discovery after a restart, because the attachment supplied the queue directly.                                                                                                               |

Wi-Fi is therefore a plausible factor in session continuity, latency, or Voice
transport, but this evidence weakens the stronger claim that cellular is what
makes Library discovery unavailable: exact discovery worked in the initial
Voice chat. The current confounds are fresh short home sessions, different
attachment state, different project/index visibility, and the lack of real-car
interruption or restart conditions.

The next controlled test should hold the Project, dated queue, device, model,
and spoken prompt constant, with no manual attachment before the lookup:

1. Run the exact-name lookup and recent-file listing once on Wi-Fi and once on
   cellular while parked.
2. Record the visible transcript, whether the exact queue is found, and the
   filename/date/newsletter metadata of every proposed fallback.
3. Only after a failure, attach the same queue manually and record whether its
   metadata becomes readable.
4. Repeat the same pair during a real commute only if the parked A/B result is
   clear; do not change network, queue, and restart state in one experiment.

## Deferred Cleanup Question

Assess whether the retired `v2-pilot` ChatGPT Project can now be deleted and
what related files or instructions can be cleaned up. Do this only after the
current Library-discovery probe establishes whether `LLM-Wiki-Car` is the sole
active commute surface; preserve any unique historical evidence before deletion.

## Conversation-Informed Wiki Enrichment

The queue is a triage input, not the final knowledge source. A routine wiki pass
should use the conversation without republishing it:

1. **Select deliberately.** An explicit save is a maintenance candidate. A long
   discussion is supporting evidence and a reason to invest in enrichment; it
   does not silently convert an unmarked article into a saved item.
2. **Retrieve the primary source.** Re-check product facts, architecture, and
   current policy from the original documentation or article. Do not elevate a
   conversational answer into a fact merely because it sounded plausible.
3. **Extract the durable questions.** Record the decision or distinction that
   mattered: for example, source-of-truth location, model-versus-agent-runtime
   ownership, context isolation, distribution, permissions, or governance.
4. **Write facts and synthesis separately.** Source Notes identify public
   material. A practical evaluation or operating-model section explains the
   useful implications derived from the conversation and labels them as
   synthesis where appropriate.
5. **Maintain, do not duplicate.** Inspect related wiki entries before writing.
   Update an existing concept, create a new page only when it has a distinct
   reusable idea, and add relationships that make the next retrieval easier.
6. **Keep the public boundary.** Do not include raw Voice transcripts, private
   work details, or long article passages. The page should preserve the insight,
   not the drive’s incidental context.

This produces a source-grounded page that answers the question Brad actually
investigated rather than a shallow newsletter summary. It is the intended
routine for future successful commute saves.

The July 22 Kiro and Claude Code subagents pages are the first recovery examples
of this approach. Future successful bundles should preserve the exact capture
so the same enrichment happens without transcript archaeology.
