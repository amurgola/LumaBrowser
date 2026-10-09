# HostDialPosition

`core/network-sharing/host/HostDialPosition.js`

The host's own thinking-dial position, read from the same two settings the
desktop uses ('Disable thinking' and the effort level).

## Methods

- `HostDialPosition.of(llmServerService)`: `'off'` when `noThink`, else the
  `reasoningEffort` value, else null; null when there is no service, no
  defaults, or `getDefaults()` throws.

## Why

It only fills a shared client's silence, via
[ThinkingKnobs](../../llm-server/server/ThinkingKnobs.md)`.extra(body, hostFallback)`;
a client that states a position always wins. The manifest shows it as
`hostDefault` (null becomes `'default'`).
