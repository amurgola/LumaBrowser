# WizardFinisher

`core/shell/ui/wizard/WizardFinisher.js` (ES module)

Applies the choices on Finish or Skip setup and closes the wizard.

## Methods

- `new WizardFinisher(wizard)`, `finish()`: locks the footer ("Applying…"),
  then in order: first run (`electronAPI.getSetupComplete()` falsy) writes the
  disabled set with `setDisabledExtensions` (known ids whose override is false),
  a re-run toggles each changed extension live (`core.shell.toggleExtension`);
  a remote provider is saved (`ipcBridge.saveProviderConfigs`, replacing the same
  type, preserving its id or generating one for a new provider) and empty slots
  routed to that provider id; the webhook (`setWebhookUrlDirect` on
  first run, else `saveWebhookUrl`); the update preference; `setSetupComplete({
  persona, workflow, enabledExtensions, hasLlm, hasWebhook })` (on first run
  this activates extensions and awaits it); then empty slots are routed to the
  local model (`core.llmServer.local`); then the [landing](WizardLanding.md).
  "All set. Launching LumaBrowser…", and teardown after 550 ms. A failure reports
  "Setup hit an error: ..." and turns Next into Retry. Status goes to
  `#setupDoneStatus`, or the footer progress text when reached through Skip.

## Globals

Reads `window.electronAPI`, `window.ipcBridge`, `window.llmSlotAPI`.
