# SetupWizardLauncher

`ui/shell/app/SetupWizardLauncher.js`

Shows the non-dismissible first-run setup wizard when setup is not complete, or on "Re-run setup". Finishing loads the extension renderers and refreshes Settings > About > License.

## Methods

- `new SetupWizardLauncher({ SetupWizard, extensionLoader, slotManager })`.
- `maybeShow({ force })` never throws; `force` skips the "already set up" check.

## Globals

Reads `window.electronAPI.getSetupComplete`.
