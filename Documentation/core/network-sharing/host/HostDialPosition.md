# HostDialPosition

`core/network-sharing/host/HostDialPosition.js`

The host's own thinking-dial position for a model, read the way the desktop
chat reads it: the model's Tune setting first, then the two Setup settings
('Disable thinking' and the effort level).

## Methods

- `HostDialPosition.of(llmServerService, modelRef?)`: the model's Tune
  `reasoningEffort` (`modelSettings.resolve(modelRef).settings`) when set;
  else `'off'` when `noThink`, else the `reasoningEffort` value, else null;
  null when there is no service, no defaults, or `getDefaults()` throws.

## Why

It only fills a shared client's silence, via
[ThinkingKnobs](../../llm-server/server/ThinkingKnobs.md)`.extra(body, hostFallback)`;
a client that states a position always wins. The manifest shows it as
`hostDefault` (null becomes `'default'`).
