import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSIGNMENTS = new Set(['development', 'final_check']);
const DISPOSITIONS = new Set(['label', 'excluded', 'failed']);
const INTEREST = new Set(['interested', 'maybe', 'uninterested']);
const DEPTH = new Set(['headline_only', 'in_depth']);

export function readInventory(candidate) {
  requireObject(candidate, 'inventory');
  requireString(candidate.dataset_id, 'inventory.dataset_id');
  if (candidate.inventory_version !== 'classifier-v2-review.v1') {
    throw new Error('inventory.inventory_version must be classifier-v2-review.v1');
  }
  const items = requireArray(candidate.items, 'inventory.items');
  const articleIds = new Set();
  const articleUrls = new Map();
  const occurrenceIds = new Set();
  const groupAssignments = new Map();
  for (const [index, item] of items.entries()) {
    const field = `inventory.items[${index}]`;
    requireObject(item, field);
    const articleId = requireString(item.article_id, `${field}.article_id`);
    if (articleIds.has(articleId)) throw new Error(`Duplicate article_id ${articleId}`);
    articleIds.add(articleId);
    const group = requireString(item.story_group_id, `${field}.story_group_id`);
    const assignment = requireEnum(item.assignment, ASSIGNMENTS, `${field}.assignment`);
    const priorAssignment = groupAssignments.get(group);
    if (priorAssignment !== undefined && priorAssignment !== assignment) {
      throw new Error(`Story group ${group} crosses development and final_check assignments`);
    }
    groupAssignments.set(group, assignment);
    const disposition = requireEnum(item.disposition, DISPOSITIONS, `${field}.disposition`);
    if (disposition === 'label' && item.disposition_reason !== null) {
      throw new Error(`${field}.disposition_reason must be null for label items`);
    }
    if (disposition !== 'label') {
      requireString(item.disposition_reason, `${field}.disposition_reason`);
    }
    requireEnum(
      item.review_bucket,
      new Set(['ordinary', 'reported_problem']),
      `${field}.review_bucket`
    );
    requireString(item.source_item_id, `${field}.source_item_id`);
    requireString(item.newsletter, `${field}.newsletter`);
    requireString(item.edition_date, `${field}.edition_date`);
    requireString(item.title, `${field}.title`);
    requireString(item.description, `${field}.description`);
    requireHttpUrl(item.url, `${field}.url`);
    const priorArticle = articleUrls.get(item.url);
    if (priorArticle !== undefined) {
      throw new Error(`Resolved URL ${item.url} appears as both ${priorArticle} and ${articleId}`);
    }
    articleUrls.set(item.url, articleId);
    if (item.author !== null) requireString(item.author, `${field}.author`);
    requireString(item.publication, `${field}.publication`);
    requireEnum(
      item.attribution_status,
      new Set(['verified', 'no_authors_listed', 'lookup_failed']),
      `${field}.attribution_status`
    );
    const occurrences = requireArray(item.source_occurrences, `${field}.source_occurrences`);
    if (occurrences.length === 0) throw new Error(`${field}.source_occurrences must not be empty`);
    for (const [occurrenceIndex, occurrence] of occurrences.entries()) {
      const occurrenceField = `${field}.source_occurrences[${occurrenceIndex}]`;
      requireObject(occurrence, occurrenceField);
      const occurrenceId = requireString(
        occurrence.occurrence_id,
        `${occurrenceField}.occurrence_id`
      );
      if (occurrenceIds.has(occurrenceId))
        throw new Error(`Duplicate occurrence_id ${occurrenceId}`);
      occurrenceIds.add(occurrenceId);
      requireString(occurrence.newsletter, `${occurrenceField}.newsletter`);
      requireString(occurrence.edition_date, `${occurrenceField}.edition_date`);
      requireString(occurrence.source_item_id, `${occurrenceField}.source_item_id`);
    }
  }
  return candidate;
}

export function buildPredictionInput(inventory, assignment) {
  validateAssignment(assignment);
  const checked = readInventory(inventory);
  return {
    dataset_id: checked.dataset_id,
    assignment,
    items: selectedItems(checked, assignment).map((item) => ({
      classifier_item_id: item.article_id,
      source_item_id: item.source_item_id,
      newsletter: item.newsletter,
      edition_date: item.edition_date,
      title: item.title,
      summary: item.description,
      url: item.url,
      author: item.author,
      publication: item.publication,
      attribution_status: item.attribution_status,
    })),
  };
}

export function buildLabelPage(inventory, assignment) {
  validateAssignment(assignment);
  const checked = readInventory(inventory);
  const items = selectedItems(checked, assignment).map((item) => ({
    article_id: item.article_id,
    newsletter: item.newsletter,
    edition_date: item.edition_date,
    title: item.title,
    description: item.description,
    url: item.url,
    author: item.author,
    publication: item.publication,
    source_occurrences: item.source_occurrences,
  }));
  const payload = JSON.stringify({ dataset_id: checked.dataset_id, assignment, items }).replaceAll(
    '<',
    '\\u003c'
  );
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Classifier v2 blind review</title><style>
body{font:16px/1.45 system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;color:#17202a}button{font:inherit;margin:.25rem;padding:.55rem .8rem}fieldset{margin:1rem 0;padding:1rem}label{margin-right:1rem}textarea{width:100%;min-height:5rem}small{color:#566573}.meta{color:#566573}.actions{display:flex;justify-content:space-between;gap:1rem}a{overflow-wrap:anywhere}
</style></head><body><h1>Classifier v2 blind review</h1><p id="progress"></p><main id="item"></main><div class="actions"><button id="previous">Previous</button><button id="save">Save answer</button><button id="download">Download answers JSON</button></div>
<script>const data=${payload};let index=0;const answers=new Map();const el=document.querySelector('#item');
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function radios(name,values,selected){return values.map(v=>'<label><input type="radio" name="'+name+'" value="'+v+'" '+(selected===v?'checked':'')+'>'+v+'</label>').join('');}
function render(){const x=data.items[index];document.querySelector('#progress').textContent=data.items.length?(index+1)+' of '+data.items.length:'No articles assigned for labeling.';if(!x){el.innerHTML='';return;}const a=answers.get(x.article_id)||{};el.innerHTML='<h2>'+escapeHtml(x.title)+'</h2><p class="meta">'+escapeHtml(x.newsletter)+' · '+escapeHtml(x.edition_date)+' · '+escapeHtml(x.author||'No verified author')+' · '+escapeHtml(x.publication)+'</p><p>'+escapeHtml(x.description)+'</p><p><a href="'+escapeHtml(x.url)+'" target="_blank" rel="noreferrer">Open article</a></p><small>'+x.source_occurrences.length+' newsletter occurrence(s)</small><fieldset><legend>Interest</legend>'+radios('interest',['interested','maybe','uninterested','unsure'],a.interest_label)+'</fieldset><fieldset><legend>Depth</legend>'+radios('depth',['headline_only','in_depth','unsure'],a.depth_label)+'</fieldset><label>Optional reason<textarea id="reason">'+escapeHtml(a.reason||'')+'</textarea></label>';}
function capture(){const x=data.items[index];if(!x)return;const interest=document.querySelector('input[name=interest]:checked')?.value;const depth=document.querySelector('input[name=depth]:checked')?.value;if(!interest||!depth){alert('Choose interest and depth, using unsure when needed.');return false;}answers.set(x.article_id,{article_id:x.article_id,interest_label:interest,depth_label:depth,reason:document.querySelector('#reason').value.trim()});return true;}
document.querySelector('#save').onclick=()=>{if(capture()&&index<data.items.length-1){index++;render();}};document.querySelector('#previous').onclick=()=>{if(capture()&&index>0){index--;render();}};document.querySelector('#download').onclick=()=>{if(!capture())return;const body=JSON.stringify({dataset_id:data.dataset_id,assignment:data.assignment,labels:[...answers.values()]},null,2);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:'application/json'}));a.download=data.dataset_id+'-'+data.assignment+'-labels.json';a.click();URL.revokeObjectURL(a.href);};render();</script></body></html>`;
}

export function compareReview(inventory, labels, baseline, candidate, assignment) {
  validateAssignment(assignment);
  const checked = readInventory(inventory);
  const selected = selectedItems(checked, assignment);
  const labelMap = readLabels(labels, checked.dataset_id, assignment);
  const baselineSet = readPredictions(baseline, checked.dataset_id, assignment, 'baseline');
  const candidateSet = readPredictions(candidate, checked.dataset_id, assignment, 'candidate');
  const selectedIds = new Set(selected.map((item) => item.article_id));
  for (const [name, ids] of [
    ['label', labelMap.keys()],
    ['baseline prediction', baselineSet.items.keys()],
    ['candidate prediction', candidateSet.items.keys()],
  ]) {
    for (const id of ids) {
      if (!selectedIds.has(id)) throw new Error(`Unknown ${name} article_id ${id}`);
    }
  }
  const rows = selected.map((item) => ({
    item,
    label: labelMap.get(item.article_id),
    baseline: baselineSet.items.get(item.article_id),
    candidate: candidateSet.items.get(item.article_id),
  }));
  const baselineMetrics = metrics(rows, 'baseline');
  const candidateMetrics = metrics(rows, 'candidate');
  const missingLabels = rows.filter(({ label }) => !isKnownInterest(label?.interest_label));
  const missingDepthLabels = rows.filter(
    ({ label }) => label?.depth_label !== 'headline_only' && label?.depth_label !== 'in_depth'
  );
  const missingBaseline = rows.filter(({ baseline: prediction }) => !prediction);
  const missingCandidate = rows.filter(({ candidate: prediction }) => !prediction);
  const changes = rows.filter(
    ({ baseline: before, candidate: after }) =>
      before &&
      after &&
      (before.interest_level !== after.interest_level ||
        before.consumption_depth !== after.consumption_depth)
  );
  const inventoryCounts = Object.fromEntries(
    [...DISPOSITIONS].map((disposition) => [
      disposition,
      checked.items.filter(
        (item) => item.assignment === assignment && item.disposition === disposition
      ).length,
    ])
  );
  const lines = [
    '# Classifier v2 blind comparison',
    '',
    `Dataset: \`${checked.dataset_id}\`; assignment: \`${assignment}\`.`,
    '',
    '## Results',
    '',
    '| Measure | Baseline | Candidate |',
    '| --- | ---: | ---: |',
    metricRow('Labeled comparisons', baselineMetrics.compared, candidateMetrics.compared),
    metricRow('False skips', baselineMetrics.falseSkips.length, candidateMetrics.falseSkips.length),
    metricRow(
      'Missed depth',
      baselineMetrics.missedDepth.length,
      candidateMetrics.missedDepth.length
    ),
    metricRow(
      'Unwanted in-depth',
      baselineMetrics.unwantedInDepth.length,
      candidateMetrics.unwantedInDepth.length
    ),
    metricRow(
      'Lower-harm interest disagreements',
      baselineMetrics.lowerHarmInterest.length,
      candidateMetrics.lowerHarmInterest.length
    ),
    '',
    `Changed baseline/candidate labels: ${changes.length}.`,
    '',
    '## Accounting',
    '',
    `- Distinct articles assigned for labeling: ${selected.length}`,
    `- Newsletter occurrences represented: ${selected.reduce((sum, item) => sum + item.source_occurrences.length, 0)}`,
    `- Ordinary articles: ${selected.filter((item) => item.review_bucket === 'ordinary').length}`,
    `- Reported-problem checks: ${selected.filter((item) => item.review_bucket === 'reported_problem').length}`,
    `- Excluded editorial candidates: ${inventoryCounts.excluded}`,
    `- Failed at a named step: ${inventoryCounts.failed}`,
    `- Missing or unsure interest labels: ${missingLabels.length}`,
    `- Missing or unsure depth labels: ${missingDepthLabels.length}`,
    `- Missing baseline predictions: ${missingBaseline.length}`,
    `- Missing candidate predictions: ${missingCandidate.length}`,
    '',
    ...harmSection('Baseline product-harm misses', baselineMetrics),
    ...harmSection('Candidate product-harm misses', candidateMetrics),
    '## Changed classifications',
    '',
    '| Article | Baseline | Candidate | Brad |',
    '| --- | --- | --- | --- |',
    ...changes.map(
      ({ item, label, baseline: before, candidate: after }) =>
        `| ${escapeCell(item.title)} (\`${item.article_id}\`) | ${formatPrediction(before)} | ${formatPrediction(after)} | ${formatLabel(label)} |`
    ),
    ...(changes.length === 0 ? ['| None | — | — | — |'] : []),
    '',
    '## Pending data',
    '',
    ...pendingRows('Missing labels', missingLabels),
    ...pendingRows('Missing depth labels', missingDepthLabels),
    ...pendingRows('Missing baseline predictions', missingBaseline),
    ...pendingRows('Missing candidate predictions', missingCandidate),
    '',
    'No release-quality claim is implied by this report; Brad decides whether the candidate is no worse after reviewing the misses and the combined commute.',
    '',
  ];
  return lines.join('\n');
}

function metrics(rows, key) {
  const result = {
    compared: 0,
    falseSkips: [],
    missedDepth: [],
    unwantedInDepth: [],
    lowerHarmInterest: [],
  };
  for (const row of rows) {
    const prediction = row[key];
    const gold = row.label;
    if (!prediction || !isKnownInterest(gold?.interest_label)) continue;
    result.compared += 1;
    if (prediction.interest_level === 'uninterested' && gold.interest_label !== 'uninterested') {
      result.falseSkips.push(row);
    } else if (prediction.interest_level !== gold.interest_label) {
      result.lowerHarmInterest.push(row);
    }
    if (
      gold.interest_label !== 'uninterested' &&
      gold.depth_label === 'in_depth' &&
      prediction.interest_level !== 'uninterested' &&
      prediction.consumption_depth === 'headline_only'
    ) {
      result.missedDepth.push(row);
    }
    if (
      gold.interest_label !== 'uninterested' &&
      gold.depth_label === 'headline_only' &&
      prediction.interest_level !== 'uninterested' &&
      prediction.consumption_depth === 'in_depth'
    ) {
      result.unwantedInDepth.push(row);
    }
  }
  return result;
}

function harmSection(title, result) {
  const rows = [
    ...result.falseSkips.map((row) => ['false skip', row]),
    ...result.missedDepth.map((row) => ['missed depth', row]),
    ...result.unwantedInDepth.map((row) => ['unwanted in-depth', row]),
    ...result.lowerHarmInterest.map((row) => ['interest disagreement', row]),
  ];
  return [
    `## ${title}`,
    '',
    '| Harm | Article | Prediction | Brad | Threshold distance |',
    '| --- | --- | --- | --- | ---: |',
    ...rows.map(([harm, row]) => {
      const prediction = row[title.startsWith('Baseline') ? 'baseline' : 'candidate'];
      return `| ${harm} | ${escapeCell(row.item.title)} (\`${row.item.article_id}\`) | ${formatPrediction(prediction)} | ${formatLabel(row.label)} | ${thresholdDistance(prediction, harm).toFixed(2)} |`;
    }),
    ...(rows.length === 0 ? ['| None | — | — | — | — |'] : []),
    '',
  ];
}

function readLabels(candidate, datasetId, assignment) {
  requireObject(candidate, 'labels');
  if (candidate.dataset_id !== datasetId || candidate.assignment !== assignment) {
    throw new Error('Label dataset_id and assignment must match the inventory selection');
  }
  const map = new Map();
  for (const [index, label] of requireArray(candidate.labels, 'labels.labels').entries()) {
    requireObject(label, `labels.labels[${index}]`);
    const id = requireString(label.article_id, `labels.labels[${index}].article_id`);
    if (map.has(id)) throw new Error(`Duplicate label ${id}`);
    requireEnum(
      label.interest_label,
      new Set([...INTEREST, 'unsure']),
      `labels.labels[${index}].interest_label`
    );
    requireEnum(
      label.depth_label,
      new Set([...DEPTH, 'unsure']),
      `labels.labels[${index}].depth_label`
    );
    map.set(id, label);
  }
  return map;
}

function readPredictions(candidate, datasetId, assignment, name) {
  requireObject(candidate, name);
  if (candidate.dataset_id !== datasetId || candidate.assignment !== assignment) {
    throw new Error(`${name} dataset_id and assignment must match the inventory selection`);
  }
  requireString(candidate.profile_version, `${name}.profile_version`);
  requireString(candidate.prompt_version, `${name}.prompt_version`);
  const items = new Map();
  for (const [index, prediction] of requireArray(candidate.items, `${name}.items`).entries()) {
    const field = `${name}.items[${index}]`;
    requireObject(prediction, field);
    const id = requireString(prediction.classifier_item_id, `${field}.classifier_item_id`);
    if (items.has(id)) throw new Error(`Duplicate ${name} prediction ${id}`);
    requireEnum(prediction.interest_level, INTEREST, `${field}.interest_level`);
    requireScore(prediction.interest_score, `${field}.interest_score`);
    requireEnum(prediction.consumption_depth, DEPTH, `${field}.consumption_depth`);
    requireScore(prediction.depth_score, `${field}.depth_score`);
    const expectedInterest =
      prediction.interest_score >= 0.8
        ? 'interested'
        : prediction.interest_score >= 0.6
          ? 'maybe'
          : 'uninterested';
    const expectedDepth = prediction.depth_score >= 0.6 ? 'in_depth' : 'headline_only';
    if (
      prediction.interest_level !== expectedInterest ||
      prediction.consumption_depth !== expectedDepth
    ) {
      throw new Error(`${field} labels must match the configured score thresholds`);
    }
    items.set(id, prediction);
  }
  return { items };
}

function selectedItems(inventory, assignment) {
  return inventory.items.filter(
    (item) => item.assignment === assignment && item.disposition === 'label'
  );
}

function metricRow(label, baseline, candidate) {
  return `| ${label} | ${baseline} | ${candidate} |`;
}

function pendingRows(label, rows) {
  return [
    `### ${label}`,
    '',
    ...(rows.length
      ? rows.map(({ item }) => `- \`${item.article_id}\` — ${item.title}`)
      : ['- None']),
    '',
  ];
}

function thresholdDistance(prediction, harm) {
  if (harm === 'missed depth' || harm === 'unwanted in-depth') {
    return Math.abs(prediction.depth_score - 0.6);
  }
  return Math.min(
    Math.abs(prediction.interest_score - 0.6),
    Math.abs(prediction.interest_score - 0.8)
  );
}

function isKnownInterest(value) {
  return INTEREST.has(value);
}

function formatPrediction(prediction) {
  return `${prediction.interest_level}/${prediction.consumption_depth} (${prediction.interest_score.toFixed(2)}, ${prediction.depth_score.toFixed(2)})`;
}

function formatLabel(label) {
  if (!label) return 'missing';
  return `${label.interest_label}/${label.depth_label}`;
}

function escapeCell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function validateAssignment(value) {
  requireEnum(value, ASSIGNMENTS, 'assignment');
}

function requireObject(value, field) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
}

function requireArray(value, field) {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error(`${field} must be a string`);
  return value;
}

function requireHttpUrl(value, field) {
  requireString(value, field);
  const parsed = new URL(value);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${field} must be an HTTP(S) URL`);
  }
}

function requireEnum(value, allowed, field) {
  if (!allowed.has(value)) throw new Error(`${field} has an unsupported value`);
  return value;
}

function requireScore(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${field} must be a score from 0 to 1`);
  }
}

function parseArgs(args) {
  const [command, ...rest] = args;
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (!flag?.startsWith('--') || value === undefined) throw new Error(usage());
    options[flag.slice(2)] = value;
  }
  return { command, options };
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

function requireOption(options, name) {
  return requireString(options[name], `--${name}`);
}

function usage() {
  return 'Usage: classifier-v2-review.mjs <prediction-input|label-page|compare> --inventory <file> --assignment <development|final_check> --out <file> [--labels <file> --baseline <file> --candidate <file>]';
}

export function main(args) {
  const { command, options } = parseArgs(args);
  const inventory = readJson(requireOption(options, 'inventory'));
  const assignment = requireOption(options, 'assignment');
  const output = resolve(requireOption(options, 'out'));
  if (command === 'prediction-input') {
    writeFileSync(
      output,
      `${JSON.stringify(buildPredictionInput(inventory, assignment), null, 2)}\n`
    );
  } else if (command === 'label-page') {
    writeFileSync(output, buildLabelPage(inventory, assignment));
  } else if (command === 'compare') {
    writeFileSync(
      output,
      compareReview(
        inventory,
        readJson(requireOption(options, 'labels')),
        readJson(requireOption(options, 'baseline')),
        readJson(requireOption(options, 'candidate')),
        assignment
      )
    );
  } else {
    throw new Error(usage());
  }
  process.stdout.write(`${output}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
