import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface CliOptions {
  input?: string;
  output?: string;
  pretty: boolean;
  help: boolean;
}

export const WIKI_URL_IMPORT_SCHEMA_VERSION = 'wiki-url-import.v1';

export interface WikiUrlImportDraft {
  source_item_id: null;
  title: string;
  url: string;
  review_note: 'Imported from URL list.';
  suggested_slug: string;
  status: 'needs_enrichment_and_approval';
  missing_fields: string[];
}

export interface WikiUrlImportReviewRecord {
  input: string;
  reason: string;
}

export interface WikiUrlImportResult {
  schema_version: typeof WIKI_URL_IMPORT_SCHEMA_VERSION;
  imported_at: string;
  drafts: WikiUrlImportDraft[];
  review: WikiUrlImportReviewRecord[];
}

type FetchResult = { ok: boolean; status: number; url: string };
type FetchOptions = { method?: 'GET' | 'HEAD'; redirect?: 'follow' };
type FetchLike = (input: URL | string, init?: FetchOptions) => Promise<FetchResult>;

const USAGE = `Usage: import:url-list -- --input <urls.txt|-> [options]

Options:
  --input <path|->       Path to a text file containing one or more URLs, or - for stdin.
  --output <path>        JSON output path. Defaults to .private/wiki-drafts/url-import-<timestamp>.json.
  --compact              Write compact JSON instead of pretty JSON.
  --help                 Show this help text.
`;

export async function runWikiUrlListImportCommand(
  argv: string[],
  dependencies: { fetchImpl?: FetchLike; now?: Date } = {}
): Promise<number> {
  const options = parseArgs(argv);

  if (options.help) {
    process.stdout.write(USAGE);
    return 0;
  }

  if (options.input === undefined) {
    process.stderr.write(USAGE);
    return 1;
  }

  const now = dependencies.now ?? new Date();
  const outputPath =
    options.output ?? path.resolve('.private/wiki-drafts', `url-import-${timestamp(now)}.json`);
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const inputText =
    options.input === '-' ? await readStdin() : await readFile(path.resolve(options.input), 'utf8');
  const result = await importUrlListText(inputText, fetchImpl, now);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, options.pretty ? 2 : 0)}\n`, 'utf8');

  process.stdout.write(
    `${outputPath}\n${result.drafts.length} draft(s), ${result.review.length} review item(s)\n`
  );
  return result.review.length > 0 ? 2 : 0;
}

export async function importUrlListText(
  text: string,
  fetchImpl: FetchLike,
  importedAt: Date
): Promise<WikiUrlImportResult> {
  const seen = new Set<string>();
  const drafts: WikiUrlImportDraft[] = [];
  const review: WikiUrlImportReviewRecord[] = [];

  for (const input of extractUrls(text)) {
    try {
      const resolved = await normalizeImportedUrl(input, fetchImpl);
      const dedupeKey = resolved.toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      drafts.push(toDraft(resolved));
    } catch (error) {
      review.push({
        input,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (drafts.length === 0 && review.length === 0) {
    review.push({
      input: '',
      reason: 'No HTTP(S) URLs were found in the provided input.',
    });
  }

  return {
    schema_version: WIKI_URL_IMPORT_SCHEMA_VERSION,
    imported_at: importedAt.toISOString(),
    drafts,
    review,
  };
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    pretty: true,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--input':
        options.input = readValue(argv, index, arg);
        index += 1;
        break;
      case '--output':
        options.output = readValue(argv, index, arg);
        index += 1;
        break;
      case '--compact':
        options.pretty = false;
        break;
      case '--help':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function readValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];

  if (value === undefined || value.startsWith('--')) {
    throw new Error(`Missing value for ${arg}`);
  }

  return value;
}

function extractUrls(text: string): string[] {
  return text.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
}

async function normalizeImportedUrl(rawUrl: string, fetchImpl: FetchLike): Promise<string> {
  const unwrapped = unwrapTldrTrackingUrl(rawUrl);
  const parsed = parseHttpUrl(unwrapped);

  const redirected = await followRedirects(parsed.toString(), fetchImpl);
  return parseHttpUrl(redirected).toString();
}

async function followRedirects(url: string, fetchImpl: FetchLike): Promise<string> {
  try {
    const head = await fetchImpl(url, { method: 'HEAD', redirect: 'follow' });
    if (head.ok) return head.url;
    if (head.status !== 405 && head.status !== 501) {
      throw new Error(`Unable to resolve URL redirects (status ${head.status}).`);
    }
  } catch (error) {
    if (!isRequestFailure(error)) throw error;
  }

  const response = await fetchImpl(url, { method: 'GET', redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Unable to resolve URL redirects (status ${response.status}).`);
  }
  return response.url;
}

function isRequestFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return message.includes('fetch') || message.includes('network') || message.includes('socket');
}

function unwrapTldrTrackingUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.hostname !== 'tracking.tldrnewsletter.com') return rawUrl;

    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'CL0' || parts[1] === undefined) return rawUrl;

    return decodeURIComponent(parts[1]);
  } catch {
    return rawUrl;
  }
}

function parseHttpUrl(value: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('URL is not valid.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must use HTTP or HTTPS.');
  }

  return parsed;
}

function toDraft(url: string): WikiUrlImportDraft {
  const parsed = new URL(url);
  const title = parsed.pathname.split('/').filter(Boolean).at(-1) ?? parsed.hostname;

  return {
    source_item_id: null,
    title: unslugify(title),
    url,
    review_note: 'Imported from URL list.',
    suggested_slug: slugify(title),
    status: 'needs_enrichment_and_approval',
    missing_fields: [
      'source.source_item_id',
      'source.newsletter',
      'source.edition_date',
      'entry.type',
      'entry.summary',
      'entry.key_ideas',
      'approval.safety_review',
      'approval.explicit_public_confirmation',
    ],
  };
}

function unslugify(value: string): string {
  return value.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || value;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80)
      .replace(/-$/g, '') || 'wiki-review-item'
  );
}

function timestamp(value: Date): string {
  return value.toISOString().replace(/[:.]/g, '-');
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? '')) {
  runWikiUrlListImportCommand(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
