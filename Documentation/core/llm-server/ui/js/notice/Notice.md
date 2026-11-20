# Notice

`core/llm-server/ui/js/notice/Notice.js`

The one inline notice: a `.luma-callout.luma-notice` with an optional title, lines of text, at most one action and a close button. Its state is the tint and the words; there is no dot, icon or stripe. The rules it follows are in the design system's [Notices](../../../../../ui/DesignSystem.md#notices) section. Styles: `core/llm-server/ui/css/luma-components.css` (`.luma-notice*`).

Used by the Agents tab, the My Tools tab and, for its controls, the Settings toast ([SettingsFeedback](../../../../../ui/shell/settings/SettingsFeedback.md)). It replaced the per-extension copies `AgentNotice` and `ToolNotice`.

## Methods

- `Notice.render(notice, onDismiss?)` returns the element. `notice`: `{ kind?, title?, text?, lines?, action? }`.
  - `kind` is `info`, `ok`, `warn` or `bad`. `bad` gets `role="alert"`, the others `role="status"`.
  - `text` then `lines` become one `.luma-notice-line` each; empty lines are dropped. All text is set as text, never parsed as markup.
  - `action`: `{ label, run() }`, drawn as a quiet secondary button.
  - `onDismiss()` adds the close button.
- `Notice.kindOf(kind)`: the kind, or `info` for anything unknown, so a typo never paints a failure as a success.
- `Notice.controls(action, onDismiss)`: the `.luma-notice-controls` element (action, then close), or null when there is neither.
- `Notice.actionButton(action)`, `Notice.closeButton(onDismiss, label?)`: the close button is the stroked close icon with `aria-label` and title "Dismiss".

## Globals

None.
