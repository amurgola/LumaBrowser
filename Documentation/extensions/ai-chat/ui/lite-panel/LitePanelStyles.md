# LitePanelStyles

`extensions/ai-chat/ui/lite-panel/LitePanelStyles.js`

The side panel's own style block (approval and takeover cards, header
controls, the toolbar state dot), on tokens.css per the
[design system](../../../../ui/DesignSystem.md): header controls share a 28px
height, the tools popover is a level 2 surface, and approval/takeover cards
are a raised neutral fill with one primary button (no accent frame). The rest
of the panel is styled by `ui/shell/css/ai-chat-panel.css`.

## Methods

- `LitePanelStyles.install(doc = document)`: appends `<style id="ai-lite-panel-style">`
  with `RULES` once.
