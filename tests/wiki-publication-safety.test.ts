import assert from 'node:assert/strict';
import test from 'node:test';

import {
  validatePublishedWikiDocuments,
  type PublishedWikiDocument,
} from '../src/wiki/publication-safety.js';

const safeDocument: PublishedWikiDocument = {
  path: 'wiki/concepts/example.md',
  frontmatter: {
    type: 'concept',
    provenance: [{ source_item_id: 'source-1', url: 'https://example.com/article' }],
  },
  markdown: `---
type: concept
---

# Example

Safe synthesis.

### [Source](https://example.com/article)

<!-- source-item-id: source-1 -->
`,
};

test('accepts safe published wiki content and provenance', () => {
  assert.doesNotThrow(() => validatePublishedWikiDocuments([safeDocument]));
});

test('rejects missing or unsupported entry types without applying that rule to known indexes', () => {
  for (const frontmatter of [{}, { type: 'conecpt' }]) {
    assert.throws(
      () => validatePublishedWikiDocuments([{ ...safeDocument, frontmatter }]),
      /frontmatter\.type must be one of/
    );
  }

  assert.doesNotThrow(() =>
    validatePublishedWikiDocuments([
      { path: 'wiki/concepts/index.md', frontmatter: { layout: 'default' }, markdown: '# Index' },
    ])
  );
});

test('rejects missing, retired, unsafe, and conflicting provenance', () => {
  assert.throws(
    () => validatePublishedWikiDocuments([{ ...safeDocument, frontmatter: { type: 'concept' } }]),
    /frontmatter\.provenance must be an array/
  );

  assert.throws(
    () =>
      validatePublishedWikiDocuments([
        {
          ...safeDocument,
          frontmatter: {
            type: 'concept',
            provenance: [
              {
                source_item_id: 'source-1',
                source_path: 'sources/tldr/retired.txt',
                url: 'https://example.com/article',
              },
            ],
          },
        },
      ]),
    /unsupported fields: source_path/
  );

  for (const url of [
    'javascript:alert(1)',
    'https://user:password@example.com/article',
    'https://example.com/article?access_token=secret',
    'https://example.com/article)',
  ]) {
    assert.throws(() =>
      validatePublishedWikiDocuments([
        {
          ...safeDocument,
          frontmatter: {
            type: 'concept',
            provenance: [{ source_item_id: 'source-1', url }],
          },
        },
      ])
    );
  }

  assert.throws(
    () =>
      validatePublishedWikiDocuments([
        safeDocument,
        {
          ...safeDocument,
          path: 'wiki/tools/conflict.md',
          frontmatter: {
            type: 'tool',
            provenance: [{ source_item_id: 'source-1', url: 'https://example.net/other' }],
          },
        },
      ]),
    /Conflicting provenance for source_item_id source-1/
  );
});

test('rejects unsafe public text, HTML, and Markdown links', () => {
  for (const unsafeText of [
    '<script>alert(1)</script>',
    'Confidential Range.com workflow',
    'client_secret = definitely-not-public',
    '[leak](https://example.com/?x-api-key=secret)',
    '[script](javascript:alert)',
  ]) {
    assert.throws(() =>
      validatePublishedWikiDocuments([
        { ...safeDocument, markdown: `${safeDocument.markdown}\n${unsafeText}\n` },
      ])
    );
  }
});

test('validates reference-style Markdown link destinations', () => {
  const referenceMarkdown = safeDocument.markdown.replace(
    '[Source](https://example.com/article)',
    '[Source][article]\n\n[article]: https://example.com/article'
  );
  assert.doesNotThrow(() =>
    validatePublishedWikiDocuments([{ ...safeDocument, markdown: referenceMarkdown }])
  );

  for (const destination of [
    'https://user:password@example.com/article',
    'https://example.com/article?access_token=secret',
    'javascript:alert(1)',
  ]) {
    assert.throws(() =>
      validatePublishedWikiDocuments([
        {
          ...safeDocument,
          markdown: `${safeDocument.markdown}\n[unsafe]: ${destination}\n`,
        },
      ])
    );
  }
});

test('requires source ids and URLs to remain traceable in the page', () => {
  assert.throws(
    () =>
      validatePublishedWikiDocuments([
        { ...safeDocument, markdown: safeDocument.markdown.replace(/<!--[^>]+-->\n/, '') },
      ]),
    /does not trace source_item_id source-1/
  );
  assert.throws(
    () =>
      validatePublishedWikiDocuments([
        {
          ...safeDocument,
          markdown: safeDocument.markdown.replace(
            'https://example.com/article)',
            'https://example.com/other)'
          ),
        },
      ]),
    /does not link provenance URL/
  );
});
