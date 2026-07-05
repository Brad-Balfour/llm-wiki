# Source Synthesis

This implementation repo was seeded from a local exploration archive that is not
part of the public repository. This file records the planning provenance for the
initial OpenSpec change; it is not required reading for public users of the repo.

## Primary Source Themes

- Codex best-of-three v3: primary go-forward
  implementation sequence and corrected classifier boundary.
- Claude synthesis roadmap v3: profile/runtime synthesis, single-model
  default scoring strategy, and car voice sequencing.
- Claude interest profile: canonical v1.4 profile base, starting from
  Claude v1.3 and applying the v3 fixes.
- Codex two-axis classifier: depth heuristics, car priority
  rules, and product-harm validation metrics, with `voice_behavior` moved out of
  classifier output.
- Codex TLDR session state: dataset counts,
  validation methodology, clean-holdout guidance, and Gmail/TLDR extraction
  history.
- Codex TLDR workflow: Gmail discovery, TLDR body
  confirmation, deduplication, and non-sponsor extraction constraints.

## Supporting Source Themes

- Claude spec: original OKF format, source format, GitHub Pages, voice
  routing, and nightly compile assumptions.
- Claude plan: original phased TLDR-only MVP and post-MVP source
  expansion.
- Claude architecture: three-layer wiki architecture and cross-device
  access.
- Claude decisions: original public repo, GitHub Pages, Gmail MCP, and
  Anthropic assumptions.
- Codex architecture: provider-neutral adapters, compile state,
  source immutability, repo skills, and future UI opportunities.
- Codex implementation plan: Codex-oriented repo guidance, skills, API
  pipeline, and fixture-first mechanics.
- Codex decision log: structured outputs,
  checkpoints, and custom realtime cost posture.
- Codex realtime voice cost notes: distinction between consumer app voice
  and separately billed custom Realtime voice.
- Gemini synthesis docs: separation-of-concerns critique only; final
  thresholds and classifier contract come from the Codex/Claude v3 synthesis.
- Local next-phase project plan: orientation memo created before the
  implementation repo existed.

## Superseded Guidance

Older docs that place `voice_behavior` in the classifier output are superseded.
The classifier emits interest/depth classification only; behavior is derived in
routing code.

Older docs that imply RSS, YouTube, Cloudflare Workers, or a custom realtime
voice agent are MVP work are superseded. Those are deferred until the TLDR loop
has been used for real.

Older docs that make Claude or OpenAI a hard-coded runtime dependency are
superseded. Provider choice is a configuration decision behind adapters.
