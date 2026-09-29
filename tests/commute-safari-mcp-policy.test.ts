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
    /Use SafariDriver MCP for fallback authenticated ChatGPT main-Library and Project Library\/Sources access/i
  );
  assert.match(normalized, /Use direct web retrieval for public articles and shared chats first/i);
  assert.match(normalized, /no direct Project file API has been established/i);
  assert.match(normalized, /use signed-in SafariDriver to apply the verified version/i);
  assert.match(
    normalized,
    /start with the exact URL and use readable page content as source evidence/i
  );
  assert.match(normalized, /search the exact title with the author or publisher/i);
  assert.match(normalized, /Use partial evidence when it can support a useful update/i);
  assert.match(normalized, /Do not present a summary or discussion as the article's own claims/i);
  assert.match(
    normalized,
    /use `insufficient_source` only when the evidence at hand cannot support a useful, accurate update/i
  );
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
  assert.match(normalized, /### SafariDriver fallback for signed-in Library access/i);
  assert.match(normalized, /Do not silently switch to integrated browser or computer-use tooling/i);
  assert.match(
    normalized,
    /Use an existing ChatGPT Work chat inside `LLM-Wiki-Car` as the first discovery and read path/i
  );
  assert.match(normalized, /keep three dates distinct: the requested processing date/i);
  assert.match(normalized, /Include intervening calendar days, including weekends and holidays/i);
  assert.match(normalized, /Do not use a fixed day-count lookback/i);
  assert.match(
    normalized,
    /For a complete bundle inventory, start with a recursive listing from the Library root/i
  );
  assert.match(
    normalized,
    /A folder-level or nonrecursive listing may supplement discovery, but it cannot establish that all in-scope bundles were found/i
  );
  assert.match(normalized, /inventory actual queue and reference rows/i);
  assert.match(normalized, /Use `send_message_to_thread`, then `read_thread`/i);
  assert.match(normalized, /Brad authorizes transferring the full raw contents/i);
  assert.match(normalized, /Parse and validate the entire reassembled response/i);
  assert.match(normalized, /interpret offsets as Unicode character positions/i);
  assert.match(normalized, /Use SafariDriver only for the specific row/i);
  assert.match(normalizedAgents, /process-daily-commute skill/i);
  assert.match(normalized, /Exclude nonpublic personal identifying information about any person/i);
  assert.match(normalized, /public article facts and public newsletter content/i);
  assert.match(normalized, /Do not perform a routine full-chat audit/i);
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

test('daily commute skill preserves detailed diagnostics and exact Library cleanup', async () => {
  const skill = await readFile('.codex/skills/process-daily-commute/SKILL.md', 'utf8');
  const normalized = skill.replace(/\s+/g, ' ');

  assert.match(normalized, /compact private timeline for #151 and #155/i);
  assert.match(
    normalized,
    /separate rows for authentication, each Library inventory\/download group/i
  );
  assert.match(normalized, /do not leave an unexplained residual/i);
  assert.match(normalized, /detailed, evidence-backed findings/i);
  assert.match(normalized, /timing, errors, and available token or usage evidence/i);
  assert.match(normalized, /Exclude nonpublic personal identifying information about any person/i);
  assert.match(normalized, /native `files__list` or `files__search`/i);
  assert.match(normalized, /`files__manage_library` with `operation: "delete"`/i);
  assert.match(
    normalized,
    /Use signed-in SafariDriver for exact authorized Project Library\/Sources cleanup/i
  );
  assert.match(normalized, /validated v4-reference, and session-bundle artifacts/i);
  assert.match(normalized, /do not ask Brad for additional per-run or per-artifact authorization/i);
  assert.match(normalized, /exact queue, validated v4 reference, and bundle downloads/i);
  assert.match(
    normalized,
    /every targeted queue, validated v4 reference, and bundle ID is absent/i
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
  assert.match(
    normalized,
    /Changes to agent instructions or commute policy require Brad's review before merge/i
  );
  assert.match(normalized, /Do not pause for or request another confirmation/i);
  assert.doesNotMatch(normalized, /Merge only with explicit user authorization/i);
  assert.doesNotMatch(normalized, /until Brad confirms it was applied/i);
  assert.doesNotMatch(normalized, /obtain any deletion authorization/i);
  assert.doesNotMatch(normalized, /leave only the exact browser deletions pending/i);
  assert.match(
    normalized,
    /action-time confirmation for an exact authorized target, confirm it and proceed/i
  );
  assert.match(
    normalized,
    /Stop only for a platform-enforced user-only control or ambiguous target/i
  );
  assert.match(normalizedAgents, /standing authorization to delete the exact queue/i);
  assert.match(normalizedAgents, /Immediately before any merge, refresh submitted reviews/i);
  assert.doesNotMatch(normalizedAgents, /leave only the exact browser deletions pending/i);
});
