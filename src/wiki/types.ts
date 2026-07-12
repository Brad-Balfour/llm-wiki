export const APPROVED_WIKI_SOURCE_SCHEMA_VERSION = 'approved-wiki-source.v1';

export const WIKI_ENTRY_TYPES = ['concept', 'tool', 'person', 'event'] as const;
export type WikiEntryType = (typeof WIKI_ENTRY_TYPES)[number];

export const WIKI_CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const;
export type WikiConfidence = (typeof WIKI_CONFIDENCE_LEVELS)[number];

export interface ApprovedWikiSource {
  schema_version: typeof APPROVED_WIKI_SOURCE_SCHEMA_VERSION;
  approval: {
    status: 'approved';
    public: true;
    approved_at: string;
  };
  source: {
    source_item_id: string;
    source_path: string;
    source_type: 'tldr';
    title: string;
    url: string;
    newsletter: string;
    edition_date: string;
  };
  entry: {
    type: WikiEntryType;
    slug: string;
    title: string;
    aliases: string[];
    tags: string[];
    confidence: WikiConfidence;
    summary: string;
    key_ideas: string[];
    related: string[];
  };
}

export interface WikiProvenance {
  source_item_id: string;
  source_path: string;
  url: string;
}

export interface CompileResult {
  status: 'created' | 'updated' | 'skipped';
  output_path: string;
  markdown: string;
  provenance_count: number;
}
