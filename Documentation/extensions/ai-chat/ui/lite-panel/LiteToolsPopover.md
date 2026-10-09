# LiteToolsPopover

`extensions/ai-chat/ui/lite-panel/LiteToolsPopover.js`

The side panel header's per-chat tool checklist (the same catalog and
`disabled_tools` the LLM tab's gear panel edits).

## Methods

- `new LiteToolsPopover({ button, pop, api, getDisabled, onToggle })`.
- `toggle()`: opens (loading the catalog) or closes; `is-open` on the button.
- `close()`, `isOpen()`, `refreshIfOpen()`.
- `load()`: "Loading tools..." until `chat.agentTools()` answers; "Tools are
  not available yet." when it never did.
- `render()`: one `.ai-chat-tools-group` head per group and a `.luma-check`
  per tool, hiding globally disabled tools; "No tools are enabled for this
  install." when nothing is left. A checkbox change calls `onToggle(name, checked)`.
