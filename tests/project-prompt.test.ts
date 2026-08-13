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

  assert.match(prompt, /Prompt Revision 3\.3/);
  assert.match(prompt, /one ordered headline sweep directly from the queue/);
  assert.match(prompt, /Do\s+not begin item 1's summary\s+before completing the sweep/);
  assert.match(prompt, /Immediately after headline `M`/);
  assert.match(prompt, /begin item 1\s+base playback without waiting for Brad to ask/);
  assert.doesNotMatch(prompt, /make `items\[0\]` current and wait/);
  assert.match(prompt, /Every valid queue item has a URL/);
  assert.match(prompt, /literal reading mode cannot be read/);
  assert.match(prompt, /`headline_only`: read exact\s+`item\.title`; omit `item\.summary`/);
  assert.match(
    prompt,
    /`in_depth`: read exact `item\.title`, then the\s+complete `item\.summary` exactly as written/
  );
  assert.match(prompt, /Never rewrite, shorten, expand,\s+combine, or select sentences/);
  assert.doesNotMatch(prompt, /one brisk queue-summary sentence/);
  assert.doesNotMatch(prompt, /one or two short queue-summary sentences/);
  assert.match(prompt, /Queue summary/);
  assert.match(prompt, /read literal `item\.summary` for any mode/);
  assert.match(prompt, /no search or\s+paraphrase/);
});

test('ChatGPT Project instructions treat natural language as intent rather than a CLI', async () => {
  const prompt = await readFile('chatgpt-project/CHATGPT_CAR_QUEUE_PROMPT.md', 'utf8');

  assert.match(prompt, /Interpret Brad's ordinary English by intent, not exact wording/);
  assert.match(prompt, /Examples are illustrative, not exhaustive/);
  assert.match(prompt, /Never require\s+him to speak command labels, schema fields/);
  assert.match(prompt, /returning one item is\s+`previous`/);
  assert.match(prompt, /going directly to any other named or numbered queue item is `jump`/);
  assert.match(prompt, /“item 6” or “6 of 14,” exact or unambiguous headline references/);
  assert.match(prompt, /does not announce or mark as heard the items\s+between/);
  assert.match(prompt, /do not\s+offer a list of allowed\s+commands/);
  assert.match(prompt, /question about what he wants to do/);
  assert.doesNotMatch(prompt, /question about which item he wants/);
  assert.match(prompt, /What would you like me to do\?/);
  assert.doesNotMatch(prompt, /Which item do you want\?/);
  assert.doesNotMatch(prompt, /Please say next, pause, or end commute/);
});
