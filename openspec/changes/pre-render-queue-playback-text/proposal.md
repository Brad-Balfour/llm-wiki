# Change: Pre-render Queue Playback Text

## Why

Voice repeatedly paraphrases descriptions, invents text, projects the wrong mode, or stops while composing default playback from several queue fields. Queue generation can perform that composition once and local validation can prove the result before the queue reaches Voice.

## What Changes

- Introduce `tldr-commute-queue.v3` with `description` replacing the ambiguous queue-level `summary` name.
- Require deterministic `playback_text` for every item and top-level `sweep_playback`, rejecting either string when it differs from the canonical fields.
- Carry exact author and publication metadata on every item, using `null` when the source does not supply it.
- Make `playback_text` the only item-content field Voice reads for default playback.
- Continue accepting historical queue-v2 artifacts locally without rewriting them.
- Stage the Project prompt, source bundle, and managed Task prompt as one coupled trial update.

## Impact

This changes the queue schema, deterministic queue validation, session-bundle snapshots, Project instructions, queue-generation source, managed Task prompt, examples, and fixtures. Parser and classifier contracts retain `summary`; queue generation renames it only at the v3 boundary. Author and publication metadata remain available for explicit commute requests but are not added to default playback.
