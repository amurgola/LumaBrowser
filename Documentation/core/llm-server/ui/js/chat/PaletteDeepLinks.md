# PaletteDeepLinks

`core/llm-server/ui/js/chat/PaletteDeepLinks.js`

The search palette's deep links into the LLM tab, delivered on
`core.llmServer.palette` (`llmDiagAPI.onPalette`). Main
(`LLMServerService.revealSetting` / `openArtifact`) has already switched the tab
to Setup or Chat before the message arrives. Installed by
[ChatSubscriptions](ChatSubscriptions.md).

## Methods

- `new PaletteDeepLinks(ctx)`, `install()` (no-op without `api.onPalette`).
- `handle(msg)`:
  - `{ type: 'reveal', target: { tune } }`: opens that Tune field through
    [SettingLink](turns/SettingLink.md).
  - `{ type: 'reveal', target: { setup, selector, subtab? } }`: clicks the
    Advanced sub-tab when given, then reveals the element.
  - `{ type: 'artifact', conversationId, artifactId }`: opens the conversation and
    shows the artifact (matched by id or root id) in the side panel.
- `PaletteDeepLinks.reveal(doc, selector)`: waits up to about 2 s for the
  element (Setup may still be rendering), opens every closed `<details>` around
  it, then highlights its row.
- `PaletteDeepLinks.highlight(row)`: scrolls the row to the middle, focuses its
  control without scrolling, and plays `.cm-palette-hl` (chat.css: a soft wash
  with a short accent bar that fades, still under reduced motion) for 2.6 s.
- `openSubtab(doc, subtab)`, `openFolds(el)`, `rowOf(el)` (the labelled
  `.defaults-row`, `.defaults-opt`, `.setup-row` or `.cm-tune-row` around a
  control).

## Why

The palette's reveal is a quiet wash rather than the error-style outline
SettingLink uses for "fix this" links: the user asked to go there, nothing is
wrong.
