import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('daily commute skill defines the SafariDriver authentication and reconnect boundary', async () => {
  const skill = await readFile('.codex/skills/process-daily-commute/SKILL.md', 'utf8');
  const normalized = skill.replace(/\s+/g, ' ');

  assert.match(normalized, /Always use SafariDriver MCP for Library acquisition/i);
  assert.match(normalized, /check its availability once more/i);
  assert.match(
    normalized,
    /ask Brad specifically to toggle the SafariDriver MCP off and on to restart it/i
  );
  assert.match(normalized, /Before any Library action, start with `list_tabs`/i);
  assert.match(
    normalized,
    /prove authentication by successfully opening Library or the named Project/i
  );
  assert.match(normalized, /a ChatGPT URL in the tab inventory is not enough/i);
  assert.match(normalized, /separate Safari process with isolated sign-in state/i);
  assert.match(normalized, /driver-created tab, and ask Brad to sign in/i);
  assert.match(normalized, /If its MCP transport closes.*repeat the signed-in-only page check/i);
  assert.match(normalized, /### SafariDriver MCP has no browser fallback/i);
  assert.match(
    normalized,
    /Do not silently switch to integrated browser, computer-use, or ChatGPT Work tooling/i
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

  assert.match(normalized, /compact private qualification ledger for #151 and #155/i);
  assert.match(normalized, /connection\/authentication; bundle inventory\/download/i);
  assert.match(normalized, /detailed, evidence-backed, sanitized findings/i);
  assert.match(normalized, /timing, errors, and available token or usage evidence/i);
  assert.match(
    normalized,
    /Sanitize by excluding raw chats, credentials, private intake, account identifiers, personal details/i
  );
  assert.match(normalized, /inventory each Library location independently in List View/i);
  assert.match(normalized, /Use each exact row's three-dot menu/i);
  assert.match(normalized, /Project Sources view as independent from the main Library/i);
  assert.match(normalized, /validated v4-reference, and session-bundle artifacts/i);
  assert.match(normalized, /do not ask Brad for additional per-run or per-artifact authorization/i);
  assert.match(normalized, /exact queue and validated v4 reference rows/i);
  assert.match(normalized, /exact queue, validated v4 reference, and bundle downloads/i);
  assert.match(normalized, /every targeted queue and validated v4 reference row is absent/i);
  assert.match(normalized, /every unrelated Project source remains/i);
});

test('daily commute workflow does not ask for repeat authorization', async () => {
  const skill = await readFile('.codex/skills/process-daily-commute/SKILL.md', 'utf8');
  const normalized = skill.replace(/\s+/g, ' ');

  assert.match(normalized, /workflow authorizes merging its qualifying PR/i);
  assert.match(
    normalized,
    /Do not ask for separate merge, deployment, Project-update, or cleanup permission/i
  );
  assert.match(normalized, /do not pause to ask Brad again/i);
  assert.match(normalized, /Do not pause for or request another confirmation/i);
  assert.doesNotMatch(normalized, /Merge only with explicit user authorization/i);
  assert.doesNotMatch(normalized, /until Brad confirms it was applied/i);
  assert.doesNotMatch(normalized, /obtain any deletion authorization/i);
  assert.doesNotMatch(normalized, /leave only the exact browser deletions pending/i);
});
