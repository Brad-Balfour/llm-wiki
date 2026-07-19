import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { lookup } from 'node:dns/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RETRIEVAL_SCHEMA_VERSION = 'commute-source-retrieval.v1';
const MAX_EXTRACTED_TEXT_LENGTH = 60_000;
const MAX_SOURCE_BYTES = 2_000_000;
const MAX_REDIRECTS = 5;

export interface MaintenanceCandidate {
  maintenance_key: string;
  session_id: string;
  event_id: string;
  source_item_id: string;
  title: string;
  url: string;
  status: 'pending';
}

interface ImportRecord {
  maintenance_candidates: MaintenanceCandidate[];
}

export interface RetrievedSource {
  maintenance_key: string;
  source_item_id: string;
  requested_url: string;
  status: 'retrieved' | 'inaccessible' | 'unsupported_content';
  retrieved_at: string;
  final_url?: string;
  content_type?: string;
  title?: string;
  extracted_text?: string;
  error?: string;
}

export interface SourceRetrievalRecord {
  schema_version: typeof RETRIEVAL_SCHEMA_VERSION;
  retrieved_at: string;
  sources: RetrievedSource[];
}

export interface SourceFetchOptions {
  headers?: Record<string, string>;
  redirect?: 'manual';
}

export type FetchLike = (input: string, init?: SourceFetchOptions) => Promise<Response>;
export type ResolveHost = (hostname: string) => Promise<string>;

export async function retrieveMaintenanceSources(
  candidates: MaintenanceCandidate[],
  fetchLike: FetchLike = fetch,
  retrievedAt = new Date().toISOString(),
  resolveHost: ResolveHost = resolvePublicHost
): Promise<SourceRetrievalRecord> {
  const sources = await Promise.all(
    candidates.map((candidate) => retrieveOne(candidate, fetchLike, retrievedAt, resolveHost))
  );
  return { schema_version: RETRIEVAL_SCHEMA_VERSION, retrieved_at: retrievedAt, sources };
}

async function retrieveOne(
  candidate: MaintenanceCandidate,
  fetchLike: FetchLike,
  retrievedAt: string,
  resolveHost: ResolveHost
): Promise<RetrievedSource> {
  const base: Pick<
    RetrievedSource,
    'maintenance_key' | 'source_item_id' | 'requested_url' | 'retrieved_at'
  > = {
    maintenance_key: candidate.maintenance_key,
    source_item_id: candidate.source_item_id,
    requested_url: candidate.url,
    retrieved_at: retrievedAt,
  };

  try {
    const { response, finalUrl } = await fetchPublicUrl(candidate.url, fetchLike, resolveHost);
    if (!response.ok) {
      return { ...base, status: 'inaccessible', error: `HTTP ${response.status}` };
    }
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.startsWith('text/html') && !contentType.startsWith('text/plain')) {
      return {
        ...base,
        status: 'unsupported_content',
        final_url: finalUrl,
        content_type: contentType || 'unknown',
      };
    }
    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_SOURCE_BYTES) {
      return {
        ...base,
        status: 'unsupported_content',
        final_url: finalUrl,
        content_type: contentType,
        error: `Source exceeds ${MAX_SOURCE_BYTES} byte retrieval limit`,
      };
    }
    const sourceText = await readResponseTextWithinLimit(response);
    if (sourceText === undefined) {
      return {
        ...base,
        status: 'unsupported_content',
        final_url: finalUrl,
        content_type: contentType,
        error: `Source exceeds ${MAX_SOURCE_BYTES} byte retrieval limit`,
      };
    }
    const extractedText = extractReadableText(sourceText, contentType);
    if (extractedText.length === 0) {
      return {
        ...base,
        status: 'inaccessible',
        final_url: finalUrl,
        content_type: contentType,
        error: 'No readable text was extracted',
      };
    }
    return {
      ...base,
      status: 'retrieved',
      final_url: finalUrl,
      content_type: contentType,
      title: extractTitle(sourceText, contentType) ?? candidate.title,
      extracted_text: extractedText,
    };
  } catch (error) {
    return { ...base, status: 'inaccessible', error: errorMessage(error) };
  }
}

async function fetchPublicUrl(
  requestedUrl: string,
  fetchLike: FetchLike,
  resolveHost: ResolveHost
): Promise<{ response: Response; finalUrl: string }> {
  let currentUrl = new URL(requestedUrl);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    if (currentUrl.protocol !== 'http:' && currentUrl.protocol !== 'https:') {
      throw new Error('Redirect resolved to a non-HTTP(S) URL');
    }
    await resolveHost(currentUrl.hostname);
    const response = await fetchLike(currentUrl.href, {
      headers: { Accept: 'text/html, text/plain;q=0.9, application/xhtml+xml;q=0.8' },
      redirect: 'manual',
    });
    if (response.status < 300 || response.status > 399) {
      return { response, finalUrl: currentUrl.href };
    }
    const location = response.headers.get('location');
    if (!location) throw new Error(`HTTP ${response.status} response has no Location header`);
    currentUrl = new URL(location, currentUrl);
  }
  throw new Error(`Source exceeded ${MAX_REDIRECTS} redirects`);
}

async function resolvePublicHost(hostname: string): Promise<string> {
  if (hostname.toLowerCase() === 'localhost') {
    throw new Error('Localhost source retrieval is not allowed');
  }
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Private-network source retrieval is not allowed');
  }
  return addresses[0]!.address;
}

export function isPrivateAddress(address: string): boolean {
  if (address.includes(':')) {
    const normalized = address.toLowerCase();
    const ipv4Mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(normalized);
    if (ipv4Mapped) return isPrivateAddress(ipv4Mapped[1]!);
    return (
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:')
    );
  }
  const parts = address.split('.').map(Number);
  const [first = Number.NaN, second] = parts;
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true;
  }
  return (
    first === 0 ||
    first === 10 ||
    (first === 100 && second !== undefined && second >= 64 && second <= 127) ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second !== undefined && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && second !== undefined && second >= 18 && second <= 19) ||
    first >= 224
  );
}

async function readResponseTextWithinLimit(response: Response): Promise<string | undefined> {
  if (response.body === null) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_SOURCE_BYTES) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return chunks.map((chunk) => decoder.decode(chunk, { stream: true })).join('') + decoder.decode();
}

function extractTitle(sourceText: string, contentType: string): string | undefined {
  if (!contentType.startsWith('text/html')) return undefined;
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(sourceText);
  return match === null ? undefined : normalizeText(match[1]!);
}

function extractReadableText(sourceText: string, contentType: string): string {
  const withoutMarkup = contentType.startsWith('text/html')
    ? sourceText
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
    : sourceText;
  return normalizeText(decodeBasicEntities(withoutMarkup)).slice(0, MAX_EXTRACTED_TEXT_LENGTH);
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  ensurePrivatePath(options.input, '--input');
  ensurePrivatePath(options.output, '--output');
  const record = parseImportRecord(JSON.parse(await readFile(options.input, 'utf8')) as unknown);
  const result = await retrieveMaintenanceSources(record.maintenance_candidates);
  await mkdir(path.dirname(options.output), { recursive: true });
  await writeFile(options.output, `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });

  const retrieved = result.sources.filter((source) => source.status === 'retrieved').length;
  process.stdout.write(
    `${options.output}\n${retrieved} retrieved source(s), ${result.sources.length - retrieved} unavailable or unsupported source(s)\n`
  );
}

function parseOptions(args: string[]): { input: string; output: string } {
  let input: string | undefined;
  let output: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') {
      input = args[index + 1];
      index += 1;
    } else if (arg === '--output') {
      output = args[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg ?? ''}`);
    }
  }
  if (!input || !output) {
    throw new Error(
      'Usage: retrieve:commute-sources -- --input <private-import.json> --output <private-sources.json>'
    );
  }
  return { input, output };
}

function parseImportRecord(candidate: unknown): ImportRecord {
  if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
    throw new Error('Commute import record must be an object');
  }
  const record = candidate as Record<string, unknown>;
  if (!Array.isArray(record.maintenance_candidates)) {
    throw new Error('Commute import record must contain maintenance_candidates');
  }
  return {
    maintenance_candidates: record.maintenance_candidates.map((candidate, index) =>
      parseMaintenanceCandidate(candidate, `maintenance_candidates[${index}]`)
    ),
  };
}

function parseMaintenanceCandidate(candidate: unknown, field: string): MaintenanceCandidate {
  if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
    throw new Error(`${field} must be an object`);
  }
  const record = candidate as Record<string, unknown>;
  const url = requireString(record.url, `${field}.url`);
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
  } catch {
    throw new Error(`${field}.url must be an HTTP(S) URL`);
  }
  return {
    maintenance_key: requireString(record.maintenance_key, `${field}.maintenance_key`),
    session_id: requireString(record.session_id, `${field}.session_id`),
    event_id: requireString(record.event_id, `${field}.event_id`),
    source_item_id: requireString(record.source_item_id, `${field}.source_item_id`),
    title: requireString(record.title, `${field}.title`),
    url,
    status: 'pending',
  };
}

function ensurePrivatePath(filePath: string, option: string): void {
  const privateRoot = path.resolve('.private');
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(`${privateRoot}${path.sep}`)) {
    throw new Error(`${option} must be inside the gitignored .private directory`);
  }
}

function requireString(candidate: unknown, field: string): string {
  if (typeof candidate !== 'string' || candidate.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return candidate;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  await main();
}
