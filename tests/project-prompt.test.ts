import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('ChatGPT Project instructions fit the 8,000-character limit', async () => {
  const prompt = await readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8');
  const characterCount = Array.from(prompt).length;

  assert.ok(characterCount <= 8_000, `Project prompt has ${characterCount} characters`);
});

test('ChatGPT Project instructions say exactly how to read the queue JSON', async () => {
  const prompt = await readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8');

  assert.match(prompt, /Prompt 5\.0 Candidate for Queue v4/);
  assert.match(prompt, /The main file will contain/);
  assert.match(prompt, /a top-level `sweep_playback` string/);
  assert.match(prompt, /an `items` array whose objects each contain an `item_playback` string/);
  assert.match(prompt, /read the complete\s+value of `sweep_playback` exactly as written/);
  assert.match(
    prompt,
    /Find the requested object in the `items` array and read the value of\s+its `item_playback` field out loud exactly as written/
  );
  assert.match(prompt, /Do not add, remove, rewrite, explain, or summarize any of the text/);
  assert.match(prompt, /After reading an item, pause and wait/);
  assert.match(prompt, /After reading the final item, say\s+`Finished <filename>\.`/);
  assert.match(prompt, /open the matching `-reference\.txt` file/);
  assert.match(prompt, /original-description request reads the complete\s+literal `description`/);
});

test('ChatGPT Project instructions reopen the same queue before every item', async () => {
  const prompt = await readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8');

  assert.match(prompt, /When Brad asks you to read an item, reopen the same main queue file/);
  assert.match(prompt, /Do this every time Brad\s+asks for another item/);
  assert.match(prompt, /whenever he returns to the queue after discussing an\s+article/);
  assert.match(prompt, /Do\s+not switch to another queue file/);
});

test('session-export contains the note and bundle instructions removed from the main prompt', async () => {
  const [prompt, sessionExport, schema] = await Promise.all([
    readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8'),
    readFile('chatgpt-project/session-export.md', 'utf8'),
    readFile('schema/commute-session-bundle-v1.schema.json', 'utf8'),
  ]);

  assert.match(
    prompt,
    /For commute captures and end-of-commute export, follow `session-export\.md`/
  );

  assert.match(sessionExport, /commute-session-bundle-v1\.schema\.json/);
  assert.match(schema, /"const": "commute-session-bundle\.v1"/);
  assert.match(sessionExport, /The chat is the only record available until you create the bundle/);
  assert.match(sessionExport, /Do not claim that you maintain\s+a separate ledger/);
  assert.match(sessionExport, /`action` is `wiki_this`/);
  assert.match(sessionExport, /`mark_interested`, `mark_uninterested`, or\s+`promote_to_in_depth`/);
  assert.match(sessionExport, /Skipping an\s+article is not classifier feedback/);
  assert.match(sessionExport, /reports a playback or product problem, record a `quality_incident`/);
  assert.match(sessionExport, /copy `source_item_id`, `title`, and `url`/i);
  assert.match(sessionExport, /Copy Brad's exact words into `user_words`/);
  assert.match(sessionExport, /create an `unresolved_capture`/);
  assert.match(sessionExport, /Put both complete objects in `queue_snapshot\.queue`/);
  assert.match(sessionExport, /"playback_file": <main>/);
  assert.match(sessionExport, /"reference_file": <reference>/);
  assert.match(sessionExport, /Record only articles that were actually read/);
  assert.match(sessionExport, /Do not invent missing moves,\s+announcements, or articles/);
  assert.match(sessionExport, /Normally set `integrity\.state` to `partial`/);
  assert.match(sessionExport, /Use `recovered` if you had to find the queue again/);
  assert.match(sessionExport, /Use the actual time in America\/New_York/);
  assert.match(sessionExport, /YYYYMMDDHHmm-morning-commute-session-bundle\.txt/);
  assert.match(sessionExport, /Create a downloadable `\.txt` file containing the JSON/);
});

test('managed Task prompt identifies v3 as the active canonical body', async () => {
  const [readme, retiredV2, activeV3] = await Promise.all([
    readFile('chatgpt-project/README.md', 'utf8'),
    readFile('chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V2.md', 'utf8'),
    readFile('chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V3.md', 'utf8'),
  ]);

  assert.match(readme, /Queue v3 is the active contract/);
  assert.match(
    readme,
    /active scheduled \*\*Weekday TLDR Queues\*\* Task uses\s+`chatgpt-project\/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V3\.md`/
  );
  assert.doesNotMatch(readme, /candidate contract/i);
  assert.match(readme, /historical evidence, not the\s+current live configuration/);
  assert.match(retiredV2, /Weekday TLDR Queue Task Prompt — v2 Retired/);
  assert.match(retiredV2, /Do not use it for the\s+> active Task/);
  assert.match(retiredV2, /use `WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V3\.md` instead/);
  assert.doesNotMatch(retiredV2, /v2 Live/);
  assert.match(activeV3, /Weekday TLDR Queue Task Prompt — v3 Live/);
  assert.match(activeV3, /canonical prompt for the active \*\*Weekday TLDR\s+> Queues\*\* Task/);
  assert.match(activeV3, /deployed queue-v3 contract/);
  assert.match(activeV3, /v2 prompt is retained\s+> only for history and compatibility/);
  assert.doesNotMatch(activeV3, /candidate/i);
  assert.doesNotMatch(activeV3, /issue #106/i);
});

test('v4 candidate resolves and records attribution before classification', async () => {
  const [generation, task, classifier, schema] = await Promise.all([
    readFile('chatgpt-project/queue-generation-v4.md', 'utf8'),
    readFile('chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V4.md', 'utf8'),
    readFile('schema/classifier-instructions.md', 'utf8'),
    readFile('schema/tldr-commute-reference-v4.schema.json', 'utf8'),
  ]);

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

test('daily commute completion cannot omit a required Project update', async () => {
  const [skill, agents] = await Promise.all([
    readFile('.codex/skills/process-daily-commute/SKILL.md', 'utf8'),
    readFile('AGENTS.md', 'utf8'),
  ]);

  for (const instructions of [skill, agents]) {
    const normalized = instructions.replace(/\s+/g, ' ');
    assert.match(normalized, /say exactly which Project prompt or document needs to be updated/i);
    assert.match(normalized, /without waiting for Brad to (?:request|ask)/i);
    assert.match(normalized, /exact .*prompt in one copyable block/i);
    assert.match(normalized, /until Brad confirms/i);
    assert.match(normalized, /never call the .*complete|do not call the .*complete/i);
    assert.match(normalized, /do not change the PR's draft\/ready state/i);
    assert.match(normalized, /ready for review is compatible/i);
  }

  assert.doesNotMatch(skill, /If Brad requests the live Project prompt/);
});

test('daily commute cleanup covers both Library locations and Downloads', async () => {
  const skill = await readFile('.codex/skills/process-daily-commute/SKILL.md', 'utf8');
  const normalized = skill.replace(/\s+/g, ' ');

  assert.match(normalized, /main ChatGPT Library, delete only the exact queue rows/i);
  assert.match(
    normalized,
    /`LLM-Wiki-Car` Project Library folder, separately delete only the exact commute-session bundle rows/i
  );
  assert.match(
    normalized,
    /successful deletion in one location does not establish deletion of its matching copy in the other/i
  );
  assert.match(
    normalized,
    /Verify that every targeted queue row is absent from the main ChatGPT Library, every targeted bundle row is absent from the `LLM-Wiki-Car` Project Library folder, and every targeted Downloads file is absent/i
  );
});
