---
type: concept
title: 'State Ownership Before State Management'
# prettier-ignore
aliases: ["Classify state before choosing a library","Do we need state management libraries anymore?"]
# prettier-ignore
tags: ["react","state-management","software-design","frontend"]
permalink: /wiki/state-ownership-before-state-management/
created: 2026-07-25
updated: 2026-07-25
confidence: high
# prettier-ignore
provenance: [{"source_item_id":"dev-20260724-02","source_path":"sources/tldr/2026-07-24-state-ownership.txt","url":"https://neciudan.dev/do-we-need-state-management-libraries-anymore"}]
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

The article's small Zustand-like implementation is valuable for exposing the
mechanics and pitfalls—subscriptions, stale selector closures, tearing, and
selectors that create fresh values. It is not by itself a reason to own a
production state library. The decision should weigh library complexity against
the maintenance and correctness work an established implementation already
absorbs.

## Source Notes

### [Do we need state management libraries anymore?](https://neciudan.dev/do-we-need-state-management-libraries-anymore)

<!-- source-item-id: dev-20260724-02 -->

TLDR Dev, 2026-07-24.
