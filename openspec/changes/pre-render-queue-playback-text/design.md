# Design: Deterministic Queue-v3 Playback

## Queue v4 extension

Queue v4 keeps the prepared speech introduced by v3 but moves it into a
strictly minimal main file. A position-matched reference file carries the
metadata and authenticates `JSON.stringify(parsedMain)` with SHA-256.

## Decisions

### Render one exact string

For item `N` of `M`, the validator reconstructs:

- `headline_only`: `<N of M>. Headline only. <title>`
- `in_depth`: `<N of M>. In depth. <title>\n<description>`

The newline separates an exact title from an exact description without inspecting or changing their punctuation. The template does not add a byline, source name, or URL, because those are not canonical item fields and Voice should not improvise missing values.

### Pre-render the complete sweep

Each sweep line uses `<N of M>. <Headline only|In depth>. <title>`, and the root `sweep_playback` joins those lines with newlines in canonical item order. Validation reconstructs the whole string. Voice reads that one field rather than traversing and projecting `items` during the sweep.

### Preserve optional source attribution explicitly

Every v3 item has `author` and `publication`. Each is either an exact non-empty value supplied by newsletter or source metadata, or JSON `null`. Queue generation does not infer values from domains, senders, titles, or general knowledge. These fields are available on request and remain outside both default playback templates.

### Rename only at the queue boundary

TLDR parsing and source-neutral classification continue to use `summary`. The queue-v3 generator writes the same literal newsletter text as `description`. A v3 item containing `summary` is invalid rather than silently normalized.

### Explicit historical compatibility

Local validation and session-bundle import accept either v2 or v3. A v2 queue keeps `summary` and has no `playback_text`; it is never converted in place. New generation and live Project sources target only v3.

### Coupled trial rather than immediate promotion

The schema, queue-generation instructions, Voice instructions, and scheduled Task prompt must be deployed together. Promotion requires a real long-session trial with no omitted literal text or generated additions.
