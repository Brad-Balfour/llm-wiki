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

  assert.match(prompt, /Prompt Revision 3\.1/);
  assert.match(prompt, /one ordered headline sweep directly from the queue/);
  assert.match(prompt, /Do\s+not begin item 1's summary before completing the sweep/);
  assert.match(prompt, /Every valid queue item has a URL/);
  assert.match(prompt, /literal reading mode cannot be read/);
});
