import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('daily commute skill defines the SafariDriver authentication and reconnect boundary', async () => {
  const [skill, agents] = await Promise.all([
    readFile('.codex/skills/process-daily-commute/SKILL.md', 'utf8'),
    readFile('AGENTS.md', 'utf8'),
  ]);
  const normalized = skill.replace(/\s+/g, ' ');
  const normalizedAgents = agents.replace(/\s+/g, ' ');

  assert.match(
    normalized,
    /Use SafariDriver MCP for authenticated ChatGPT main-Library and Project Library\/Sources access/i
  );
  assert.match(
    normalized,
    /Use direct web retrieval for public articles and shared chats first/i
  );
  assert.match(normalized, /no direct Project file API has been established/i);
  assert.match(normalized, /use signed-in SafariDriver to apply the verified version/i);
  assert.match(normalized, /call the web retrieval tool directly with that URL/i);
  assert.match(normalized, /Shared-chat URLs are not part of routine intake auditing/i);
  assert.match(normalized, /inspect only the relevant passage plus enough surrounding context/i);
  assert.match(normalized, /direct HTTP fetch of the page once/i);
  assert.match(normalized, /use SafariDriver for that chat as a bounded fallback/i);
  assert.match(normalized, /Use Codex collaborator subagents for independent source reading/i);
  assert.match(
    normalized,
    /Do not launch a nested `codex exec` maintainer process and call it a subagent/i
  );
  assert.match(normalized, /check its availability once more/i);
  assert.match(
    normalized,
    /ask Brad specifically to toggle the SafariDriver MCP off and on to restart it/i
  );
  assert.match(normalized, /Before any main-Library action, start with `list_tabs`/i);
  assert.match(normalized, /prove authentication by successfully opening the main Library/i);
  assert.match(normalized, /a ChatGPT URL in the tab inventory is not enough/i);
  assert.match(normalized, /separate Safari process with isolated sign-in state/i);
  assert.match(normalized, /driver-created tab, and ask Brad to sign in/i);
  assert.match(normalized, /If its MCP transport closes.*repeat the signed-in-only page check/i);
  assert.match(normalized, /### Signed-in Library access/i);
  assert.match(
    normalized,
    /Do not silently switch to integrated browser, computer-use, or ChatGPT Work tooling/i
  );
  assert.match(
    normalizedAgents,
    /signed-in SafariDriver MCP for ChatGPT main-Library and Project Library\/Sources retrieval/i
  );
  assert.match(normalizedAgents, /Use direct web retrieval for public article URLs/i);
  assert.match(
    normalizedAgents,
    /Exclude nonpublic personal identifying information about any person/i
  );
  assert.match(normalizedAgents, /public article facts or newsletter content/i);
  assert.match(normalizedAgents, /Do not perform a routine full-chat audit/i);
  assert.match(
    normalizedAgents,
    /ask Brad specifically to toggle the SafariDriver MCP off and on/i
  );
  assert.match(
    normalizedAgents,
    /Do not substitute integrated browser, computer-use, or ChatGPT Work tooling/i
  );
});

test('daily commute skill uses List View row actions and bounded DOM recovery', async () => {
  const skill = await readFile('.codex/skills/process-daily-commute/SKILL.md', 'utf8');
  const normalized = skill.replace(/\s+/g, ' ');

  assert.match(normalized, /switch to \*\*List View\*\*/i);
  assert.match(normalized, /three-dot menu and choose \*\*Download\*\*/i);
  assert.match(normalized, /Retrieve bundles first/i);
  assert.match(normalized, /matching `-reference\.txt` row/i);
  assert.match(
    normalized,
    /DOM-rendered content.*schema, pair\/hash, and canonical-snapshot validation/i
  );
  assert.match(normalized, /do not claim that original-byte access is universally required/i);
});

test('daily commute skill preserves detailed diagnostics and exact Safari cleanup', async () => {
  const skill = await readFile('.codex/skills/process-daily-commute/SKILL.md', 'utf8');
  const normalized = skill.replace(/\s+/g, ' ');

  assert.match(normalized, /compact private timeline for #151 and #155/i);
  assert.match(normalized, /separate rows for authentication, each Library inventory\/download group/i);
  assert.match(normalized, /do not leave an unexplained residual/i);
  assert.match(normalized, /detailed, evidence-backed findings/i);
  assert.match(normalized, /timing, errors, and available token or usage evidence/i);
  assert.match(
    normalized,
    /Exclude nonpublic personal identifying information about any person/i
  );
  assert.match(normalized, /main ChatGPT Library independently in List View/i);
  assert.match(normalized, /Use each exact row's three-dot menu/i);
  assert.match(normalized, /Use signed-in SafariDriver for Project Library\/Sources cleanup/i);
  assert.match(normalized, /validated v4-reference, and session-bundle artifacts/i);
  assert.match(normalized, /do not ask Brad for additional per-run or per-artifact authorization/i);
  assert.match(
    normalized,
    /Delete each exact validated queue, v4 reference, and commute-session bundle consumed by the completed run from that Library/i
  );
  assert.match(normalized, /exact queue, validated v4 reference, and bundle downloads/i);
  assert.match(
    normalized,
    /every targeted queue, validated v4 reference, and bundle row is absent there/i
  );
  assert.match(normalized, /Preserve unrelated Project sources/i);
});

test('daily commute workflow does not ask for repeat authorization', async () => {
  const [skill, agents] = await Promise.all([
    readFile('.codex/skills/process-daily-commute/SKILL.md', 'utf8'),
    readFile('AGENTS.md', 'utf8'),
  ]);
  const normalized = skill.replace(/\s+/g, ' ');
  const normalizedAgents = agents.replace(/\s+/g, ' ');

  assert.match(normalized, /workflow authorizes merging its qualifying content PR/i);
  assert.match(normalized, /Changes to agent instructions or commute policy require Brad's review before merge/i);
  assert.match(normalized, /Do not pause for or request another confirmation/i);
  assert.doesNotMatch(normalized, /Merge only with explicit user authorization/i);
  assert.doesNotMatch(normalized, /until Brad confirms it was applied/i);
  assert.doesNotMatch(normalized, /obtain any deletion authorization/i);
  assert.doesNotMatch(normalized, /leave only the exact browser deletions pending/i);
  assert.match(
    normalizedAgents,
    /action-time confirmation for an exact target covered by the standing authorization, confirm it and proceed/i
  );
  assert.match(
    normalizedAgents,
    /Stop only for a platform-enforced user-only control or an ambiguous target/i
  );
  assert.match(normalizedAgents, /Immediately before any merge, refresh submitted reviews/i);
  assert.doesNotMatch(normalizedAgents, /leave only the exact browser deletions pending/i);
});
