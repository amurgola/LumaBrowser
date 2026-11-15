# PromptApiSwitch

`ui/shell/settings/general/PromptApiSwitch.js`

The Settings switch "Let web pages use your local model" (`#gsPromptApiEnabled`,
Privacy & permissions, "Local model for web pages"): when on, pages that call the
browser's built-in AI (the Prompt API) are answered by the user's default chat
model ([PromptApiService](../../../../core/prompt-api/PromptApiService.md)). Off
by default. Built and loaded by [GeneralSettings](GeneralSettings.md).

## Methods

- `new PromptApiSwitch({ feedback })`.
- `install()` wires the checkbox through [SettingToggle](SettingToggle.md) to
  `setPromptApiEnabled`, reloading the state after a change.
- `load()` reads `getPromptApiStatus()` (`{ enabled, running }`) and applies it;
  does nothing when the element or the API is missing, and leaves the switch as
  it is when the call fails.
- `apply(status)` checks the box when `status.enabled`.

## Globals

Reads `window.electronAPI.getPromptApiStatus`, `setPromptApiEnabled`
(`core.promptApi.getStatus`, `core.promptApi.setEnabled`).
