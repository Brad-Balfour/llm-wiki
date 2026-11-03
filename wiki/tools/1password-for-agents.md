---
type: tool
title: '1Password for Agents'
aliases: ['Introducing 1Password for Agents', '1Password Agentic Autofill']
tags: ['ai-agents', 'authentication', 'credentials', 'browser-automation', 'agent-security']
wiki_slug: 1password-for-agents
created: 2026-11-03
updated: 2026-11-03
confidence: medium
# prettier-ignore
provenance: [{"source_item_id":"20261023-tldr-ai:ai-002","url":"https://1password.com/blog/1password-for-ai-agents"}]
---

# 1Password for Agents

1Password for Agents is an opt-in credential-filling integration for supported
personal AI agents. The agent can request a login, the person approves an
individual Login item in 1Password, and the 1Password extension fills the
sign-in form in the agent's browser without exposing the password or one-time
code to the model. It does **not** grant the agent general vault access or
provide an authorization system for everything the agent does after login.

## Authentication Flow

1. The user connects a supported agent to a 1Password Individual or Family
   account. 1Password documents an OAuth 2.0 connection and a separate
   integration key held by the agent developer.
2. When the agent reaches a website login, it requests the needed item. The
   user unlocks 1Password and approves or denies the specific Login item.
   The agent cannot approve its own access request.
3. The 1Password browser extension in the agent developer's hosted browser
   fills the username, password, and any supported one-time code outside
   the agent model's view, then submits the form.
4. The website creates and maintains the authenticated session. 1Password
   does not own the website's cookies or decide how long that session remains
   valid. Approved credentials can be used again for a limited period,
   documented as **up to 30 days**, without a new 1Password approval.
5. Disconnecting an agent through 1Password Integrations revokes its
   connection keys and approvals. This is distinct from signing out of
   already-authenticated website sessions, which is controlled by the site.

1Password's published security model uses a confidential computing enclave
and an end-to-end encrypted channel to deliver an approved item to its
browser extension. The agent developer holds authorization tokens and the
integration key, and controls the browser environment. Consequently, the
claimed separation of secrets from the **model** depends on the developer's
implementation; 1Password explicitly says it cannot enforce the behavior of
a third-party agent after authentication.

## Design Considerations for a Long-Running Agent

**Treat authentication as a resumable, human-gated step, not as a persistent
credential grant.** An appropriate agent workflow is:

1. Persist task state and the intended website/account, then enter a
   `needs_authentication` state when a sign-in is required.
2. Ask the supported 1Password integration to initiate its approval flow.
   Do not invent a direct 1Password API endpoint: the launch announcement
   directs developers to its partnerships team, and the reviewed pages do
   not publish a general self-service integration SDK for Agentic Autofill.
3. On approval, continue in an authenticated browser session. Record only
   nonsecret status and durable checkpoints. Do not send passwords, OTPs,
   session cookies, or the login form to model context or ordinary logs.
4. On process restart, first test whether the website session is still
   authenticated. If so, resume. If it expired, request sign-in again,
   subject to the remaining approval period and the partner integration's
   capabilities.
5. Handle approval denial, timeouts, unavailable user/device, changed
   passwords, MFA/SSO incompatibility, site-side invalidation, and revoked
   1Password connections as explicit recoverable or terminal states.
6. Gate consequential post-login actions separately. Password protection
   does not prevent a compromised or mistaken agent from making purchases,
   changing settings, leaking account data, or following prompt injection
   inside an authenticated website.

For a durable worker, it may be useful to store encrypted browser session
state outside the model and scope access by task. That is an **architectural
recommendation**, not a capability or session persistence guarantee supplied
by the 1Password announcement.

## Current Scope and Integration Limits

As documented October 22–November 3, 2026:

- 1Password for Agents works with selected partner agents, not arbitrary
  custom Playwright or headless-browser workers. The announcement names
  integrations available or planned for Muse, Grok Bot, Town, Claude Duet,
  ChatGPT Work/dots, and other partners. Timing and protections vary.
- Eligible accounts are Individual and Family on `1Password.com`.
  Business/Teams and `1Password.ca`/`1Password.eu` are not supported for
  this feature at present.
- Supported credentials are Login items in Personal or Private vaults,
  including username/password and one-time codes. Passkeys, federated
  provider-based sign-ins, shared vaults, and other item types are not
  supported yet.
- Approval can be reused for **up to 30 days**. That window does not
  promise a 30-day website login session or fully unattended operation.
- 1Password's existing developer SDKs, Service Accounts, and Secrets
  Automation can retrieve application secrets for other use cases. Those
  products should not be conflated with Agentic Autofill: handing a worker
  a secret is different from filling a site login while keeping the
  model blind to it.

## Risk Boundary

This feature protects **credential handling**, not agent intent or scope of
authority. The destination website and its scripts receive submitted
credentials. The approved agent may gain broad control of the account once
signed in. Use dedicated limited-permission accounts when possible, enforce
separate human approval for sensitive actions, avoid exposing cookies or
secrets to model-visible tools, and ensure the agent has a clear revocation
and session-termination path. These are recommended application controls,
not claims about 1Password's built-in policy enforcement.

## Source Notes

[Introducing 1Password for Agents](https://1password.com/blog/1password-for-ai-agents),
John Torrey, 1Password, October 22, 2026. Saved from TLDR AI, October 23,
item `ai-002`, position 5, with a request for a developer-focused summary
of long-running-agent integration and the original link at commute closeout.

Additional official documentation:
[Use 1Password to sign in to sites with supported agents](https://support.1password.com/1password-for-agents/)
(October 30, 2026);
[About the security of 1Password for Agents](https://support.1password.com/1password-for-agents-security/)
(November 3, 2026).

<!-- source-item-id: 20261023-tldr-ai:ai-002 -->

## Related

- {% include wiki-related-link.md slug="long-running-agent-harnesses" %}
- {% include wiki-related-link.md slug="agent-autonomy-boundaries" %}
- {% include wiki-related-link.md slug="agent-tool-boundaries" %}
