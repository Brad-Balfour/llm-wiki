---
type: concept
title: 'State Ownership Before State Management'
# prettier-ignore
aliases: ["Classify state before choosing a library","Do we need state management libraries anymore?"]
# prettier-ignore
tags: ["react","state-management","software-design","frontend"]
wiki_slug: state-ownership-before-state-management
created: 2026-07-25
updated: 2026-07-25
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"dev-20260724-02","source_path":"sources/tldr/2026-07-24-state-ownership.txt","url":"https://tldr.tech/dev/2026-07-24"}]
---

# State Ownership Before State Management

A React application should classify each piece of state by ownership and source of truth before introducing a general-purpose client store.

## Key Ideas

- Keep local interface state local with React primitives.
- Use server-state and URL-state tools for data whose source of truth is not a global client store.
- Context fits stable shared configuration; a mutable global store is for the smaller residual category.
- A small implementation can teach the mechanism, but established libraries still carry maintenance and correctness value.

## Classification Order

Classify the state before evaluating a general-purpose store:

1. **Local UI state:** component or feature state handled with `useState` or
   `useReducer`.
2. **Simple shared state:** values that can remain near their owners and move
   through props or a focused context.
3. **Server state:** remote data, caching, invalidation, and synchronization
   handled by a server-state tool such as TanStack Query or RTK Query.
4. **URL state:** navigation, filters, and shareable views whose durable source
   of truth belongs in the URL.
5. **Stable global configuration:** broadly read values that change rarely and
   fit React Context.
6. **Mutable global client state:** the residual category that may justify
   Zustand, Redux, or another external store.

The TLDR summary says the source rebuilds a small Zustand-like implementation
and encounters subscription races, stale selector closures, and selectors that
create fresh values. Those examples are useful for understanding why a tiny
store is not automatically production-ready. The broader decision guidance
here is synthesis from the commute discussion: weigh library complexity against
the maintenance and correctness work an established implementation already
absorbs.

## Source Notes

### [Do we need state management libraries anymore? (TLDR summary)](https://tldr.tech/dev/2026-07-24)

<!-- source-item-id: dev-20260724-02 -->

TLDR Dev, 2026-07-24.

The original article URL in the commute queue was inaccessible during the July
25 maintenance pass. This page therefore uses the retrievable TLDR edition for
provenance and labels discussion-derived guidance as synthesis rather than
claiming the full article was retrieved.
