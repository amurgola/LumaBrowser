# ProgressPane

`core/shell/ui/wizard/ProgressPane.js` (ES module)

The install progress pane shared by the local LLM, image and Automatic Setup flows, and the hooks that drive it.

## Methods

- `ProgressPane.render(pane, prefix, onCancel)`: `#<prefix>Phase`
  ("Preparing…"), `#<prefix>Bar`, `#<prefix>Sub`, `#<prefix>Cancel`; Cancel
  runs `onCancel`, then reads "Canceling…" and disables.
- `ProgressPane.hooks(pane, prefix)` -> `{ onPhase, onBar, onSub }` for
  SetupHooks; a null fraction makes the bar indeterminate
  (`setup-wizard__bar-fill--indet`), a number is clamped to 0..100%.

## Globals

None.
