# DeviceManager

`extensions/android/DeviceManager.js`

What the user and the tools do with devices as a whole. The settings tab, the device page's API and the agent tools all go through here.

## Methods

- `overview()` -> `{ sdk: { found, root, hasEmulator }, devices: [{ name, label, target, playStore, state }], images }`; `state` is `running`, `starting` or `stopped`. With no SDK everything is empty.
- `start(name)`: opens the device's session ([DeviceSessions](device/DeviceSessions.md)), which starts it when needed, and answers `{ name, model, release }`. Its notifications are heard from then on, tab or no tab.
- `stop(name)`: closes the session, then shuts the emulator down.
- `create()`: a new device from the newest installed image (Google Play first) under the first free name.
- `runningNames()`: every running device, started by this app or not.
- `stopStarted()`: closes every session and stops what the fleet started.
- An unknown name, an SDK with no emulator and a missing image are errors that say what to do.
