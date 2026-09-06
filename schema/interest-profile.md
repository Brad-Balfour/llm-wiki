# Brad TLDR Interest Profile v2.0

Version: `2.0`
Scope: TLDR newsletters only for the MVP (`TLDR`, `TLDR AI`, `TLDR Dev`,
`TLDR Fintech`).

This profile is the preference source for TLDR classification. It describes what
Brad is likely to care about and what he is likely to ignore. Classifier output
schema, score thresholds, depth heuristics, validation, and routing live in the
other schema files.

## Strong Interest Signals

Items matching these lanes should receive high interest scores when the match is
central to the title and summary.

- Practical AI-agent engineering workflows: coding agent harnesses, multi-agent
  collaboration, human/agent parallel work, review bottlenecks, orchestration
  tools, agent loops, context management, QA, evals, prompt debt, and AI-native
  developer workflows that connect to daily work. Concrete harness, plugin,
  code-review, documentation, and quality-control techniques are stronger than
  generic agent product launches.
- Articles by Martin Fowler default to high interest and in-depth because Brad
  wants his arguments and examples, not only awareness of the headline.
- Articles by Addy Osmani have a strong interest prior. Choose depth from the
  article's substance; this preference is not a blanket in-depth rule.
- AI plus trust, authenticity, governance, verification, enterprise adoption, and
  sovereignty, especially when connected to fintech or high-stakes product
  decisions.
- Daily-driver Anthropic/Claude tooling and closely tracked AI companies where
  Anthropic, OpenAI, or Perplexity is the primary subject. Product launches,
  access changes, pricing, policy changes, and company updates can be relevant
  awareness even when shallow.
- Infrastructure and engineering practices encountered in real work: caching,
  memcached, large-diff review, billing/business-logic refactors, durable
  architecture tradeoffs, cost-control patterns, test/review workflows, and
  reliability decisions with product consequences.
- General software-engineering craft, software history, career development, and
  computing-culture essays when framed as an argument with transferable insight.
  Substantive craftsmanship, migration, progressive-enhancement, browser UI,
  and low-JavaScript architecture pieces are usually worth in-depth treatment.
  Dry organizational news does not qualify by subject alone.
- AI's effect on software engineering practice, engineering roles, taste,
  judgment, labor markets, code quality, and the AI-native productivity divide.
- Product experimentation and product judgment in the AI era, including A/B
  testing, taste, usability, evaluation design, and technical communication.
- Fintech engineering practices that affect trustworthy financial systems,
  financial advice, AI governance, expert judgment, data correctness,
  compliance, fraud/trust, or business-critical automation. Generic fintech
  funding, payments, banking, market-access, crypto, or business-news blurbs are
  weak matches unless they include one of those hooks.
- Frontend and web engineering tradeoffs Brad may apply, such as practical state
  management, browser architecture choices, UX engineering, and tool selection.
- Robots, physical AI, self-driving vehicles, and AI-embedded devices when the
  story is about a genuine technical/product capability rather than generic
  company finance. Tesla and Waymo self-driving developments are explicit strong
  interests. Prefer in-depth for engineering, deployment, reliability, fleet,
  or adoption detail; shallow launch awareness can remain headline-only.
- Novel human-computer interfaces, including brain-computer interfaces and
  interaction models that change how people work with computers.
- Macro AI economics and AI strategy essays with real analytical substance:
  moats, pricing, routing, specialization versus generalization, usage economics,
  product design, and application-layer strategy.
- Tentative positive lanes: major fusion power milestones and novel
  bioscience/fundamental-science breakthroughs. Treat these as interesting when
  the item is a meaningful capability change, not routine science-news filler.

## Moderate Interest Signals

Items matching these lanes are optional or substance-dependent. Score them by how
specific, current, and useful the title and summary make the item appear.

- LLM architecture deep-dives that explain useful concepts beyond the headline,
  without becoming raw training-systems minutiae.
- Macro AI market sizing, token pricing, and usage data when the item is mostly
  descriptive and lacks a durable argument.
- Frontier model releases when the writeup contains substance beyond "model X
  launched."
- Major AI-science or frontier-capability news when it changes what AI systems
  can do, how they are evaluated, or what capabilities Brad should track.
- AI-specific security and safety research such as prompt injection,
  jailbreaks, model behavior, and AI tool-chain trust. Generic cybersecurity is
  not included.
- Model interpretability, transparency, and authenticity research.
- Investigative tech/business journalism, including otherwise-disfavored topics,
  when the item reveals mechanisms, incentives, abuse, or governance lessons.
  This remains tentative and should not override strong negative lanes casually.
- Borderline product/platform news that touches a known interest but lacks a
  clear daily-use, product, governance, or technical lesson.

## Not Interested Signals

Items matching these lanes should receive low interest scores unless the item has
a strong independent product, engineering, governance, or scientific lesson.

- AI chip, GPU, accelerator, and hardware announcements.
- SQL/database-specific internals and narrow database tooling, including DuckDB
  product news, even when framed as AI-assisted engineering.
- Raw ML training-infrastructure optimization internals, including low-level
  fine-tuning, expert parallelism, kernels, distributed training plumbing, and
  benchmark minutiae.
- Open-source or local LLM model releases and benchmark posts, including generic
  coding-model announcements.
- Chinese AI model news as a category, unless the item has a separate, concrete
  product/workflow/governance lesson.
- Crypto, stablecoin, blockchain, and prediction-market hype, including fintech
  stories where those are the central subject.
- Meta, Zuckerberg, WhatsApp, and Meta corporate strategy stories, even when the
  story touches AI, fintech, prediction markets, or WhatsApp. Exceptions require
  a standalone technical, product, governance, or scientific lesson that would be
  interesting without Meta as the subject.
- Generic cybersecurity vulnerabilities, exploits, RCE writeups, and threat-news
  items unless the core issue is AI-specific.
- Consumer hardware leaks, phone rumors, clickbait devices, and vague product
  teases.
- Tools and stacks Brad does not personally use when the tool itself is the
  point, including Cursor, Vercel, Deno, Bun, PyTorch, Lean, Android-specific
  tooling, and generic framework announcements.
- Commodity battery-product blurbs and vague battery-improvement claims. A
  concrete fundamental-science or capability breakthrough can still qualify
  under the tentative science lane.
- General space-industry finance, launch, satellite, and IPO/business analysis
  unless the item contains a novel device, vehicle, AI capability, or strongly
  opinionated technical/product lesson.
- Generic backend-scale, load-balancing, framework, and operations-scale stories
  unless they connect to current work, product/cost tradeoffs, architecture
  choices, caching, reviewability, or another durable engineering lesson.
- SEO, marketing, generic open-source repos, and growth-tool announcements
  without a direct AI-engineering or product-judgment angle.

## Range.com Context

Range-adjacent language is not enough by itself. Raise the interest score only
when the item has a clear current hook around trustworthy financial systems,
AI/governance, expert judgment, data correctness, compliance, high-stakes
automation, or engineering practices Brad could plausibly apply.

Do not store private Range.com notes, sensitive freeform context, raw Gmail
bodies, credentials, or unreviewed work material in committed artifacts. If an
item appears work-relevant but sensitive, surface it for review rather than
public wiki promotion.

## Depth Calibration Anchors

Use these verified corrections as category boundaries, not title-matching rules:

- Practical agent and AI-assisted engineering items deserve in-depth treatment
  when their descriptions promise reusable harness, plugin, review, context,
  documentation, or quality methods. The Sol Ultrafast, Agent Plugins, DeepSeek
  Harness, Slack Code, Fig, and Claude Cowork corrections exemplify that pattern.
- Software-craft and applicable web-engineering pieces deserve in-depth treatment
  when the source contains an argument, migration method, or architecture lesson.
  The HTMX forms, HTML over WebSockets, software craftsmanship, Sass migration,
  AcceptMarkdown, Saggar, and TermDOM corrections exemplify that pattern.
- Robotics and self-driving pieces deserve in-depth treatment when they contain
  capability, engineering, deployment, or adoption detail. Matic, the Waymo chip,
  and London robotaxi corrections exemplify that pattern.
- Hardware is not automatically deep or interesting. The Anthropic lab-hardware
  correction was about operational substance at a closely tracked AI company;
  it does not reverse the general negative prior for chip and hardware blurbs.

Named examples clarify the evidence behind a rule. Apply the rule to the actual
title, description, and verified attribution; do not classify by title lookup.
