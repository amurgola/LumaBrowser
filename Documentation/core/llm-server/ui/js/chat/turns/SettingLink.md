# SettingLink

`core/llm-server/ui/js/chat/turns/SettingLink.js`

Takes the user from an error to the setting behind it, outlined so there is
nothing to hunt for. An [ErrorCard](ErrorCard.md) names a target and draws an
"Edit setting" button when this component says it is available; the click
opens one of two surfaces:

- `{ tune: <field id>, label? }`: the chat model's Tune dialog
  ([ModelTunePanel](../composer/ModelTunePanel.md)) for `state.modelRef`,
  opened with that row outlined, scrolled to and focused. Needs the host's
  `api.modelSettings` (the web client has none) and a picked model.
- `{ setup: <page>, selector?, label? }`: Setup, on that page
  ([ComposerView](../composer/ComposerView.md)`.openSetup(page)`), then the
  element matching `selector` is outlined, scrolled into view and focused
  once the page has rendered it (up to `FIND_TRIES` frames).

Both outlines use the `cm-setting-hl` class (`OUTLINE_CLASS`): an accent ring
that pulses three times. In Setup it clears itself after `OUTLINE_MS`; in the
Tune dialog it stays until the field is edited.

## Methods

- `available(target)`: whether the target can be opened here.
- `open(target)`: opens it (a no-op when unavailable).
- `SettingLink.label(target)`: the button text: the target's own `label`, else
  one from `TUNE_LABELS` for a Tune field ("Edit run timeout"), else
  "Edit setting" for a Tune target or "Open Setup" for a Setup one.
- `SettingLink.outline(doc, selector, tries?)`: resolves with the outlined
  element, or null when it never appeared.
- `SettingLink.flash(el)`: outlines, scrolls to and focuses one element (or
  its first control), clearing the outline after `OUTLINE_MS`.

## Why

A tester hit "Execution timed out after 8 minutes" and asked whether a
setting for it existed; it did not, and once it did it lived three clicks
away in a dialog they had never opened. An error that is caused by a setting
should hand the user that setting, outlined, in one click. The target shape
is deliberately small and declarative so the host can name a setting on the
error itself (`errorMeta.setting`, see [LaunchErrorHints](../../../../chat/router/LaunchErrorHints.md))
without the UI having to recognise the error text.

## Globals

None.
