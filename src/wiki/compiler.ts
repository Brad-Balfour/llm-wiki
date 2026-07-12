import type { ApprovedWikiSource, CompileResult, WikiEntryType, WikiProvenance } from './types.js';

const TYPE_DIRECTORIES: Record<WikiEntryType, string> = {
  concept: 'concepts',
  tool: 'tools',
  person: 'people',
  event: 'events',
};

interface ExistingEntryMetadata {
  created: string;
  aliases: string[];
  tags: string[];
  provenance: WikiProvenance[];
  body: string;
}

export function compileApprovedWikiSource(
  source: ApprovedWikiSource,
  existingMarkdown: string | undefined,
  compileDate: string
): CompileResult {
  const outputPath = `wiki/${TYPE_DIRECTORIES[source.entry.type]}/${source.entry.slug}.md`;
  const provenance: WikiProvenance = {
    source_item_id: source.source.source_item_id,
    source_path: source.source.source_path,
    url: source.source.url,
  };

  if (existingMarkdown === undefined) {
    return {
      status: 'created',
      output_path: outputPath,
      markdown: renderEntry(
        source,
        compileDate,
        compileDate,
        [provenance],
        renderInitialBody(source)
      ),
      provenance_count: 1,
    };
  }

  const existing = parseExistingEntry(existingMarkdown);
  const matchingId = existing.provenance.find(
    (item) => item.source_item_id === provenance.source_item_id
  );
  if (matchingId) {
    if (matchingId.source_path === provenance.source_path && matchingId.url === provenance.url) {
      return {
        status: 'skipped',
        output_path: outputPath,
        markdown: existingMarkdown,
        provenance_count: existing.provenance.length,
      };
    }
    throw new Error(
      `Conflicting provenance for source_item_id ${provenance.source_item_id}. Use a new source item id for a distinct immutable record.`
    );
  }

  const mergedProvenance = [...existing.provenance, provenance];
  const mergedAliases = unique([...existing.aliases, ...source.entry.aliases]);
  const mergedTags = unique([...existing.tags, ...source.entry.tags]);
  const updatedBody = mergeRelatedLinks(
    appendSourceNote(existing.body, source),
    source.entry.related
  );

  return {
    status: 'updated',
    output_path: outputPath,
    markdown: renderEntry(
      { ...source, entry: { ...source.entry, aliases: mergedAliases, tags: mergedTags } },
      existing.created,
      compileDate,
      mergedProvenance,
      updatedBody
    ),
    provenance_count: mergedProvenance.length,
  };
}

function renderEntry(
  source: ApprovedWikiSource,
  created: string,
  updated: string,
  provenance: WikiProvenance[],
  body: string
): string {
  return [
    '---',
    `type: ${source.entry.type}`,
    `title: ${JSON.stringify(source.entry.title)}`,
    `aliases: ${JSON.stringify(source.entry.aliases)}`,
    `tags: ${JSON.stringify(source.entry.tags)}`,
    `created: ${created}`,
    `updated: ${updated}`,
    `confidence: ${source.entry.confidence}`,
    `provenance: ${JSON.stringify(provenance)}`,
    '---',
    '',
    body.trim(),
    '',
  ].join('\n');
}

function renderInitialBody(source: ApprovedWikiSource): string {
  const related =
    source.entry.related.length === 0
      ? ''
      : `\n\n## Related\n\n${source.entry.related.map((slug) => `- [[${slug}]]`).join('\n')}`;
  return [
    `# ${escapeMarkdownText(source.entry.title)}`,
    '',
    escapeMarkdownText(source.entry.summary),
    '',
    '## Key Ideas',
    '',
    ...source.entry.key_ideas.map((idea) => `- ${escapeMarkdownText(idea)}`),
    '',
    '## Source Notes',
    '',
    renderSourceNote(source),
    related,
  ].join('\n');
}

function renderSourceNote(source: ApprovedWikiSource): string {
  return [
    `### [${escapeMarkdownText(source.source.title)}](${source.source.url})`,
    `<!-- source-item-id: ${source.source.source_item_id} -->`,
    '',
    `${escapeMarkdownText(source.source.newsletter)}, ${source.source.edition_date}. ${escapeMarkdownText(source.entry.summary)}`,
    '',
    ...source.entry.key_ideas.map((idea) => `- ${escapeMarkdownText(idea)}`),
  ].join('\n');
}

function appendSourceNote(body: string, source: ApprovedWikiSource): string {
  const note = renderSourceNote(source);
  const relatedIndex = body.indexOf('\n## Related\n');
  if (relatedIndex === -1) {
    return `${body.trim()}\n\n${note}`;
  }
  return `${body.slice(0, relatedIndex).trim()}\n\n${note}\n\n${body.slice(relatedIndex + 1).trim()}`;
}

function mergeRelatedLinks(body: string, related: string[]): string {
  const missing = related.filter((slug) => !body.includes(`- [[${slug}]]`));
  if (missing.length === 0) {
    return body;
  }
  const links = missing.map((slug) => `- [[${slug}]]`).join('\n');
  if (!body.includes('\n## Related\n')) {
    return `${body.trim()}\n\n## Related\n\n${links}`;
  }
  return `${body.trim()}\n${links}`;
}

function parseExistingEntry(markdown: string): ExistingEntryMetadata {
  const match = /^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/.exec(markdown);
  if (!match) {
    throw new Error('Existing wiki entry has malformed frontmatter');
  }
  const frontmatter = match[1] ?? '';
  return {
    created: requireFrontmatterValue(frontmatter, 'created'),
    aliases: parseJsonStringArray(frontmatter, 'aliases'),
    tags: parseJsonStringArray(frontmatter, 'tags'),
    provenance: parseProvenance(frontmatter),
    body: match[2] ?? '',
  };
}

function requireFrontmatterValue(frontmatter: string, key: string): string {
  const line = frontmatter.split('\n').find((candidate) => candidate.startsWith(`${key}: `));
  if (!line) {
    throw new Error(`Existing wiki entry is missing ${key} frontmatter`);
  }
  return line.slice(key.length + 2).trim();
}

function parseJsonStringArray(frontmatter: string, key: string): string[] {
  const parsed = parseJsonFrontmatter(frontmatter, key);
  if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== 'string')) {
    throw new Error(`Existing wiki entry ${key} must be a JSON string array`);
  }
  return parsed as string[];
}

function parseProvenance(frontmatter: string): WikiProvenance[] {
  const parsed = parseJsonFrontmatter(frontmatter, 'provenance');
  if (!Array.isArray(parsed)) {
    throw new Error('Existing wiki entry provenance must be an array');
  }
  return parsed.map((candidate, index) => {
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
      throw new Error(`Existing provenance[${index}] must be an object`);
    }
    const record = candidate as Record<string, unknown>;
    if (
      typeof record.source_item_id !== 'string' ||
      typeof record.source_path !== 'string' ||
      typeof record.url !== 'string'
    ) {
      throw new Error(`Existing provenance[${index}] is malformed`);
    }
    return {
      source_item_id: record.source_item_id,
      source_path: record.source_path,
      url: record.url,
    };
  });
}

function parseJsonFrontmatter(frontmatter: string, key: string): unknown {
  const value = requireFrontmatterValue(frontmatter, key);
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Existing wiki entry ${key} frontmatter is not valid JSON`);
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function escapeMarkdownText(value: string): string {
  return value.replace(/([\\`*_{}[\]()#+!|>])/g, '\\$1');
}
