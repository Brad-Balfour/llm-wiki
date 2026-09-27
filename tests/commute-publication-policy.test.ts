import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('commute publication policy keeps review proportional and updates brief', async () => {
  const [agents, skill, experimentGuide] = await Promise.all([
    readFile('AGENTS.md', 'utf8'),
    readFile('.codex/skills/process-daily-commute/SKILL.md', 'utf8'),
    readFile('docs/commute-performance-experiment.md', 'utf8'),
  ]);

  assert.match(agents, /process-daily-commute skill/);
  assert.match(agents, /standing authorization to delete the exact queue/i);
  assert.match(skill, /Content- and\s+evidence-only\s+daily publication/i);
  assert.match(skill, /one(?: required)? latest-head review/i);
  assert.match(skill, /materially changes behavior/i);
  assert.match(skill, /historical cleanup/i);
  assert.match(skill, /Do not (?:ask for|request an)\s+acknowledgment/i);
  assert.match(skill, /After the gated merge, pull `main` and verify the repository/i);
  assert.match(skill, /experiment ended after the September 15 Sol Medium run/i);
  assert.match(skill, /Use Sol\s+Light\/Low for routine commutes/i);
  assert.match(skill, /Do\s+not start a new phase profile or model-comparison run/i);
  assert.match(skill, /Adjudicate bundle item actions against the canonical queue/i);
  assert.match(
    skill,
    /A\s+negative assessment of an article alone does not establish an interest or\s+depth correction/i
  );
  assert.match(skill, /Evidence\s+Sources/);
  assert.match(experimentGuide, /Historical operator guide/i);
  assert.match(experimentGuide, /resume profiling only if Brad explicitly reopens/i);
  assert.match(agents, /without another confirmation/i);
  assert.match(
    skill,
    /action-time confirmation for an exact authorized target, confirm it and proceed/i
  );
  assert.match(skill, /After the gated merge, pull `main` and verify the repository/i);
});
