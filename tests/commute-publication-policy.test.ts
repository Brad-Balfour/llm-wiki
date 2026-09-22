import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('commute publication policy keeps review proportional and updates brief', async () => {
  const [agents, skill, experimentGuide] = await Promise.all([
    readFile('AGENTS.md', 'utf8'),
    readFile('.codex/skills/process-daily-commute/SKILL.md', 'utf8'),
    readFile('docs/commute-performance-experiment.md', 'utf8'),
  ]);

  for (const policy of [agents, skill]) {
    assert.match(policy, /Content- and\s+evidence-only\s+daily publication/i);
    assert.match(policy, /one(?: required)? latest-head review/i);
    assert.match(policy, /materially changes behavior/i);
    assert.match(policy, /historical cleanup/i);
    assert.match(policy, /Do not (?:ask for|request an)\s+acknowledgment/i);
  }

  assert.match(agents, /After the gated merge, pull `main`, verify the repository/i);
  assert.match(agents, /experiment ended after the September 15 Sol Medium run/i);
  assert.match(agents, /Use Sol Light\/Low for routine daily commutes/i);
  assert.match(agents, /Do not collect new experimental phase profiles/i);
  assert.match(
    agents,
    /Adjudicate bundle item actions against the full conversation before storing\s+classifier labels/i
  );
  assert.match(
    agents,
    /A negative assessment of an article alone does not\s+establish an interest or depth correction/i
  );
  assert.match(skill, /experiment ended after the September 15 Sol Medium run/i);
  assert.match(skill, /Do\s+not start a new phase profile or model-comparison run/i);
  assert.match(experimentGuide, /Historical operator guide/i);
  assert.match(experimentGuide, /resume profiling only if Brad explicitly reopens/i);
  assert.match(agents, /without another confirmation/i);
  assert.match(
    skill,
    /action-time confirmation for an exact authorized target, confirm it and proceed/i
  );
  assert.match(
    agents,
    /documentation-only or\s+mechanical review fix does not trigger another general-purpose review round/i
  );
  assert.match(skill, /After the gated merge, pull `main` and verify the repository/i);
});
