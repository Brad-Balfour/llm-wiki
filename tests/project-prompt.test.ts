import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('ChatGPT Project instructions fit the 8,000-character limit', async () => {
  const prompt = await readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8');
  const characterCount = Array.from(prompt).length;

  assert.ok(characterCount <= 8_000, `Project prompt has ${characterCount} characters`);
});

test('ChatGPT Project instructions require a grounded headline sweep and URL handling', async () => {
  const prompt = await readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8');

  assert.match(prompt, /Queue Contract v3 · Prompt Revision 4\.1/);
  assert.match(prompt, /read the complete literal top-level `sweep_playback` string exactly/);
  assert.match(prompt, /only content field used for the headline sweep/);
  assert.match(prompt, /do not independently assemble\s+positions, modes, or titles/);
  assert.match(prompt, /After headline `M`, pause without making an item current/);
  assert.match(prompt, /may begin\s+detailed playback at any verified queue item/);
  assert.match(prompt, /if he says only to proceed or\s+continue, begin at item 1/);
  assert.match(prompt, /Do not begin any item's base playback before completing\s+the sweep/);
  assert.match(prompt, /Every valid queue item has a URL/);
  assert.match(prompt, /literal reading mode cannot be read/);
  assert.match(prompt, /read the one literal `item\.playback_text`\s+string exactly/);
  assert.match(prompt, /only item content field used for default playback/);
  assert.match(
    prompt,
    /Never independently assemble position, mode, title, description, byline, source/
  );
  assert.match(prompt, /Never rewrite, shorten, expand, combine, or select sentences from it/);
  assert.doesNotMatch(prompt, /one brisk queue-summary sentence/);
  assert.doesNotMatch(prompt, /one or two short queue-summary sentences/);
  assert.match(prompt, /Queue metadata/);
  assert.match(
    prompt,
    /read literal `item\.description`, `item\.author`,\s+or `item\.publication`/
  );
  assert.match(prompt, /report a `null` author or publication as unavailable/);
  assert.match(prompt, /no\s+search or paraphrase/i);
});

test('ChatGPT Project instructions preserve arbitrary navigation and incomplete evidence', async () => {
  const prompt = await readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8');

  assert.match(prompt, /first\s+post-sweep\s+`item_announced` may name any verified queue item/);
  assert.match(prompt, /`items` is canonical\s+identity\/order, not required visit order/);
  assert.match(prompt, /later exact announcement when visible\s+evidence lacks its transition/);
  assert.match(prompt, /use `partial` or `recovered`/);
  assert.match(prompt, /`completed` means the commute ended, not every item was visited/);
  assert.match(prompt, /relative destinations, and final\s+cursor/);
});

test('ChatGPT Project instructions treat natural language as intent rather than a CLI', async () => {
  const prompt = await readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8');

  assert.match(prompt, /Interpret Brad's ordinary English by intent, not exact wording/);
  assert.match(prompt, /examples are illustrative,\s+not exhaustive/i);
  assert.match(prompt, /Never require\s+command labels, schema terms/);
  assert.match(prompt, /Normalize forward\/skip as `next`, back one as `previous`/);
  assert.match(prompt, /any other exact named\/numbered item as `jump`/);
  assert.match(prompt, /“item\s+6,” “6 of 14,” or an unambiguous headline/);
  assert.match(prompt, /A jump neither announces nor marks\s+intervening items heard/);
  assert.match(prompt, /do not list allowed commands/);
  assert.match(prompt, /ask a short plain-English question/);
  assert.doesNotMatch(prompt, /question about which item he wants/);
  assert.match(prompt, /What would you like me to do\?/);
  assert.doesNotMatch(prompt, /Which item do you want\?/);
  assert.doesNotMatch(prompt, /Please say next, pause, or end commute/);
});

test('ChatGPT Project instructions require explicit classifier feedback', async () => {
  const prompt = await readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8');

  assert.match(prompt, /Only record classifier feedback when Brad explicitly asks/);
  assert.match(prompt, /A summary request or\s+interrupted playback is not feedback/);
});

test('managed Task prompts distinguish the active v2 body from the v3 candidate', async () => {
  const [readme, activeV2, candidateV3] = await Promise.all([
    readFile('chatgpt-project/README.md', 'utf8'),
    readFile('chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V2.md', 'utf8'),
    readFile('chatgpt-project/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V3.md', 'utf8'),
  ]);

  assert.match(
    readme,
    /active scheduled \*\*Weekday TLDR Queues\*\* Task uses\s+`chatgpt-project\/WEEKDAY_TLDR_QUEUE_TASK_PROMPT_V2\.md`/
  );
  assert.match(activeV2, /managed body below exactly/);
  assert.match(activeV2, /matches the active \*\*Weekday TLDR Queues\*\* Task/);
  assert.match(candidateV3, /Candidate body for issue #106/);
  assert.match(candidateV3, /It does not/);
  assert.match(candidateV3, /match the active \*\*Weekday TLDR Queues\*\* Task/);
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
