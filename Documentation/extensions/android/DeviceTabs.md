# DeviceTabs

`extensions/android/DeviceTabs.js`

Shows a device in a browser tab. The tab is an ordinary one, so it can be kept and comes back after a restart.

## Methods

- `urlOf(deviceName)`: `<gateway>/api/ext/android/?device=<name>`, on 127.0.0.1 (the address core signs an app tab's own requests for). Throws `API_OFF` while the local API is switched off.
- `open(deviceName, { keep })` -> `{ tabId, url }`: brings the device's tab to the front, or creates it; `keep` makes it a kept tab.
