# FoldMemory

`core/llm-server/ui/js/setup/FoldMemory.js`

Remembers which collapsible Setup sections the user opened. Setup cards re-render
through innerHTML after most saves, so an open `<details>` would otherwise snap
shut, and the choice should survive a reload.

## Methods

- `FoldMemory.isOpen(key, dflt)`: the stored choice
  (`localStorage['luma.setup.fold.<key>']` `'1'`/`'0'`), else `!!dflt`.
- `FoldMemory.attr(key, dflt)`: `'open'` or `''`, to splice into
  `<details data-fold-key="llm.more" ${FoldMemory.attr('llm.more')}>`.
- `FoldMemory.install(document)`: one capture-phase `toggle` listener (the event
  does not bubble) that records every `[data-fold-key]` toggle. Idempotent per
  document. Call it from every page entry that renders Setup cards.

## Globals

Reads and writes `window.localStorage`; listens on the given document.
