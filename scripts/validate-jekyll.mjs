import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { JSON_SCHEMA, load } from 'js-yaml';

const markdownFiles = ['index.md', ...(await findMarkdownFiles('wiki'))];
const yamlFiles = [
  '_config.yml',
  ...(await findFiles('.github/workflows', isYaml)),
  ...(await findFiles('schema', isYaml)),
];

for (const path of yamlFiles) {
  const parsed = parseYaml(await readFile(path, 'utf8'), path);
  assert.ok(isMapping(parsed), `${path} must contain a YAML mapping`);
}

for (const path of markdownFiles) {
  const markdown = await readFile(path, 'utf8');
  const frontmatter = extractFrontmatter(markdown, path);
  const parsed = parseYaml(frontmatter, `${path} frontmatter`);
  assert.ok(isMapping(parsed), `${path} frontmatter must contain a YAML mapping`);
}

const template = await readFile('wiki/ENTRY_TEMPLATE.md', 'utf8');
const templateFrontmatter = extractFrontmatter(template, 'wiki/ENTRY_TEMPLATE.md');
const provenanceLine = templateFrontmatter
  .split('\n')
  .find((line) => line.startsWith('provenance: '));
assert.ok(provenanceLine, 'entry template must keep compiler-compatible provenance on one line');
const provenance = JSON.parse(provenanceLine.slice('provenance: '.length));
assert.ok(
  Array.isArray(provenance) && provenance.length > 0,
  'template provenance must be nonempty'
);
for (const [index, item] of provenance.entries()) {
  assert.ok(isMapping(item), `template provenance[${index}] must be an object`);
  for (const field of ['source_item_id', 'source_path', 'url']) {
    assert.equal(
      typeof item[field],
      'string',
      `template provenance[${index}].${field} must be a string`
    );
    assert.ok(item[field].length > 0, `template provenance[${index}].${field} must not be empty`);
  }
}

console.log(
  `Validated ${yamlFiles.length} YAML files and ${markdownFiles.length} Jekyll Markdown files.`
);

function parseYaml(source, label) {
  try {
    return load(source, { filename: label, schema: JSON_SCHEMA });
  } catch (error) {
    throw new Error(`${label} is not valid YAML`, { cause: error });
  }
}

function extractFrontmatter(markdown, path) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  assert.ok(match, `${path} must start with complete YAML frontmatter`);
  return match[1];
}

async function findFiles(directory, include) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      paths.push(...(await findFiles(path, include)));
    } else if (entry.isFile() && include(entry.name)) {
      paths.push(path);
    }
  }
  return paths.sort();
}

function findMarkdownFiles(directory) {
  return findFiles(directory, (name) => extname(name) === '.md');
}

function isYaml(name) {
  return ['.yml', '.yaml'].includes(extname(name));
}

function isMapping(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
