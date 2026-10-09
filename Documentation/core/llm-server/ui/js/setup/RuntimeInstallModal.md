# RuntimeInstallModal

`core/llm-server/ui/js/setup/RuntimeInstallModal.js`

The runtime install or update chooser shared by the LLM and image runtime cards.

## Methods

- `RuntimeInstallModal.open({ name?, assetSupported?, installed? })` shows an
  "Install <name>" (or "Update") dialog on the shared `.luma-modal-overlay`
  shell with two options: automatically download the official prebuilt binary
  (disabled, "Unavailable", when no prebuilt exists for the platform) or locate
  an existing install. Resolves `'auto'`, `'locate'`, or `null` on Cancel, the
  close button, Escape or a click on the surround. Pure UI: the caller performs
  the action. The name is escaped.

## Globals

Reads `document`; adds and removes its own keydown listener.
