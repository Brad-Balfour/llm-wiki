import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('commute publication policy keeps review proportional and updates brief', async () => {
  const [agents, skill] = await Promise.all([
    readFile('AGENTS.md', 'utf8'),
    readFile('.codex/skills/process-daily-commute/SKILL.md', 'utf8'),
  ]);

  for (const policy of [agents, skill]) {
    assert.match(policy, /Content- and\s+evidence-only daily publication/i);
    assert.match(policy, /one(?: required)? latest-head review/i);
    assert.match(policy, /materially changes behavior/i);
    assert.match(policy, /historical cleanup/i);
    assert.match(policy, /Do not (?:ask for|request an)\s+acknowledgment/i);
  }

  assert.match(agents, /After an authorized merge, pull `main`, verify the repository/i);
  assert.match(agents, /experiment ended after the September 15 Sol Medium run/i);
  assert.match(agents, /Use Sol Light\/Low for routine daily commutes/i);
  assert.match(agents, /Do not collect new experimental phase profiles/i);
  assert.match(agents, /Do not request a second\s+confirmation for the same exact deletion batch/i);
  assert.match(
    agents,
    /documentation-only or\s+mechanical review fix does not trigger another general-purpose review round/i
  );
  assert.match(skill, /After an authorized merge, pull `main` and verify the repository/i);
});
