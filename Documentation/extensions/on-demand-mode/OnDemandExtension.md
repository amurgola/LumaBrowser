# OnDemandExtension

`extensions/on-demand-mode/OnDemandExtension.js`

Activates Luma On Demand: seeds the web-navigation knowledge base and
registers the hidden `on-demand` chat mode that core's OnDemandService runs
its per-tab Live panel conversations in.

## Methods

- `activate(context)` seeds `docs/*.md` ([OnDemandKnowledgeBase](OnDemandKnowledgeBase.md)),
  calls `context.chat.registerMode(new OnDemandMode(kb).descriptor())`
  ([OnDemandMode](OnDemandMode.md)) and resolves
  `{ modeId: 'on-demand', kbScope: 'webnav', seededDocs }`.
- `deactivate()` does nothing; ExtensionManager unregisters the mode.
- `OnDemandExtension.DOCS_DIR` the bundled `docs/` folder.

## Entry files

- `manifest.js`: id `on-demand-mode`, `private: true`, `distributable: false`,
  optional `core:llm-service` and `core:browser`, `main: './main.js'`.
- `main.js`: `{ MODE_ID, KB_SCOPE, ALLOWED_TOOLS, activate, deactivate }`, as legacy.
- `docs/*.md`: the knowledge base (10 web-navigation notes), copied verbatim.
