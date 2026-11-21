import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('ChatGPT Project instructions fit the 8,000-character limit', async () => {
  const prompt = await readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8');
  const characterCount = Array.from(prompt).length;

  assert.ok(characterCount <= 8_000, `Project prompt has ${characterCount} characters`);
});

test('ChatGPT Project instructions route playback through the Python Project source', async () => {
  const prompt = await readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8');

  assert.match(prompt, /Prompt 5\.1 Candidate for Queue v4/);
  assert.match(prompt, /Project source `voice-playback\.py`/);
  assert.match(prompt, /Load the Project source `voice-playback\.py` into the code tool/);
  assert.match(prompt, /select_playback\(main, action, current_position, target_position\)/);
  assert.match(prompt, /begin, next, previous, repeat, or a numbered jump/);
  assert.match(prompt, /Speak the complete string\s+the function returns, unchanged/);
  assert.match(prompt, /After reading the final item, say\s+`Finished <filename>\.`/);
  assert.match(prompt, /do not require another `next`/);
  assert.match(prompt, /When Brad wants to discuss an article, answer normally/);
  assert.match(prompt, /Discussion does not change it/);
});

test('ChatGPT Project instructions reopen the exact file and defer reference access', async () => {
  const prompt = await readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8');

  assert.match(prompt, /YYYYMMDD-tldr-dev\.txt/);
  assert.match(prompt, /YYYYMMDD-tldr-ai\.txt/);
  assert.match(prompt, /YYYYMMDD-tldr-fintech\.txt/);
  assert.match(prompt, /reopen the same main file in the\s+Project Library/);
  assert.match(prompt, /including after discussing an article/);
  assert.match(prompt, /If the code\s+session resets, reload the Python source/);
  assert.match(prompt, /open the matching `-reference\.txt` file/);
  assert.match(prompt, /original-description request, read the complete literal\s+`description`/);
  assert.match(prompt, /Do not load the reference to start a queue or for ordinary\s+playback/);
  assert.doesNotMatch(prompt, /main_sha256|Verify that its/);
});

test('Voice routes end-of-commute export to the current bundle schema', async () => {
  const [prompt, sessionExport, schemaText] = await Promise.all([
    readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8'),
    readFile('chatgpt-project/session-export.md', 'utf8'),
    readFile('schema/commute-session-bundle-v2.schema.json', 'utf8'),
  ]);
  const schema = JSON.parse(schemaText);

  assert.match(prompt, /end-of-commute export, follow `session-export\.md`/);
  assert.ok(sessionExport.includes('commute-session-bundle-v2.schema.json'));
  assert.ok(sessionExport.includes(schema.properties.schema_version.const));
  for (const field of schema.required) assert.ok(sessionExport.includes(field), field);
  assert.doesNotMatch(sessionExport, /queue_snapshot|commute-session-bundle-v1/);
});

test('the Project install list identifies both compact-export sources and the Instructions', async () => {
  const readme = await readFile('chatgpt-project/README.md', 'utf8');
  for (const file of [
    'chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md',
    'chatgpt-project/session-export.md',
    'schema/commute-session-bundle-v2.schema.json',
  ]) {
    assert.ok(readme.includes(file), file);
  }
});

test('v4 candidate resolves and records attribution before classification', async () => {
  const [generation, task, classifier, schema] = await Promise.all([
    readFile('chatgpt-project/queue-generation-v4.md', 'utf8'),
    readFile('chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V4.md', 'utf8'),
    readFile('schema/classifier-instructions.md', 'utf8'),
    readFile('schema/tldr-commute-reference-v4.schema.json', 'utf8'),
  ]);

  assert.match(generation, /Playback\/Reference Pair v4\.1/);
  assert.match(task, /Task Prompt — v4\.1 Candidate/);
  assert.match(generation, /retry\s+once/);
  assert.match(
    generation,
    /one attribution result for every occurrence of the same\s+resolved URL/
  );
  assert.match(generation, /`No authors listed`/);
  assert.match(generation, /`Author lookup failed`/);
  assert.match(generation, /hostname\s+without leading `www\.`/);
  assert.match(generation, /resolved URL \{index\}/);
  assert.match(generation, /failed lookup attempts \{index\}/);
  assert.match(generation, /publication fallback \{index\}/);
  assert.match(task, /fill attribution before\s+classification/);
  assert.match(classifier, /status\/error text are not authors/);
  assert.match(schema, /"author_source"/);
  assert.match(schema, /"publication_source"/);
});

test('v4 candidate reconciles repeated coverage across all daily editions', async () => {
  const [generation, task, schema] = await Promise.all([
    readFile('chatgpt-project/queue-generation-v4.md', 'utf8'),
    readFile('chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V4.md', 'utf8'),
    readFile('schema/tldr-commute-reference-v4.schema.json', 'utf8'),
  ]);

  assert.match(generation, /Retrieve all qualifying General, Dev,\s+AI, and Fintech editions/);
  assert.match(generation, /Sharing a topic or\s+company is not enough/);
  assert.match(generation, /most useful\s+literal title and description/);
  assert.match(generation, /fully removed edition still gets a valid empty pair/);
  assert.match(generation, /private review table/);
  assert.match(generation, /one retained item per URL/);
  assert.match(generation, /complete decision audit/);
  assert.match(task, /Retrieve and extract all editions before rendering/);
  assert.match(task, /classify each distinct URL\s+once/);
  assert.match(task, /retain and flag uncertain relationships/);
  assert.match(schema, /"coverage_decisions"/);
  assert.match(schema, /"selected_source_occurrence_id"/);
  assert.match(schema, /"kept_update"/);
  assert.match(schema, /"allOf"/);
  assert.match(schema, /"const": "useful_update"/);
});

test('v4 candidate prepares literal context for unclear headlines', async () => {
  const [generation, task, schema] = await Promise.all([
    readFile('chatgpt-project/queue-generation-v4.md', 'utf8'),
    readFile('chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V4.md', 'utf8'),
    readFile('schema/tldr-commute-reference-v4.schema.json', 'utf8'),
  ]);

  assert.match(generation, /shortest complete opening sentence\s+or sentences/);
  assert.match(generation, /Do not truncate a sentence, rewrite it, or manufacture/);
  assert.match(generation, /self-contained headline short with null context/);
  assert.match(generation, /Never add headline\s+context to an in-depth item/);
  assert.match(generation, /sweep_lines\.append\(prefix\)/);
  assert.match(generation, /update_prefix"\] == item\["coverage"\]\["update_note"\]/);
  assert.match(
    generation,
    /excerpt_source_occurrence_id"\] == item\["selected_source_occurrence_id"\]/
  );
  assert.match(generation, /complete excerpt sentence/);
  assert.match(task, /classification labels unchanged by this presentation step/);
  assert.match(schema, /"playback_context"/);
  assert.match(schema, /"unusually_long_excerpt"/);
  assert.ok(schema.includes('"pattern": "[.!?]'));
});

test('classifier v2 candidate records calibrated versions and blind-review boundaries', async () => {
  const [profile, classifier, generation, task, reviewTool, requirements, plan] = await Promise.all(
    [
      readFile('schema/interest-profile.md', 'utf8'),
      readFile('schema/classifier-instructions.md', 'utf8'),
      readFile('chatgpt-project/queue-generation-v4.md', 'utf8'),
      readFile('chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V4.md', 'utf8'),
      readFile('docs/classifier-v2/review-tool.md', 'utf8'),
      readFile('docs/classifier-v2/requirements.md', 'utf8'),
      readFile('docs/classifier-v2/implementation-plan.md', 'utf8'),
    ]
  );

  assert.match(profile, /Version: `2\.1`/);
  assert.match(profile, /Martin Fowler default to high interest and in-depth/);
  assert.match(profile, /Addy Osmani have a strong interest prior/);
  assert.match(profile, /Tesla and Waymo self-driving developments/);
  assert.match(profile, /Better Batteries|battery-product blurbs/);
  assert.match(profile, /Bun/);
  assert.match(profile, /DuckDB/);
  assert.match(profile, /Browser-native AI runtimes and client-side inference/);
  assert.match(profile, /Routine comparisons around a new model remain low/);
  assert.match(profile, /surprising measured fix and a\s+reusable diagnostic lesson/);
  assert.match(classifier, /corporate workforce or organization analysis/);
  assert.match(classifier, /Version: `classifier-instructions\.v2`/);
  assert.match(classifier, /explicit verified-author preference/);
  assert.match(classifier, /`development` or `final_check`/);
  assert.doesNotMatch(classifier, /July 3, 2026 and later/);
  assert.match(generation, /profile_version` and\s+`prompt_version`/);
  assert.match(task, /profile 2\.1 and classifier instructions v2/);
  assert.match(reviewTool, /makes no model calls/);
  assert.match(reviewTool, /no scores, predictions, or model reasons/);
  assert.match(requirements, /calibration of an LLM-based classifier/);
  assert.match(requirements, /final check/);
  assert.match(plan, /calibrated profile is\s+2\.1/);
});
