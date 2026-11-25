# AndroidExtension

`extensions/android/AndroidExtension.js`

Main-process side of the Android extension: Android devices (emulators from the user's own Android SDK) shown live in a browser tab, driven by the user and by agent tools, with their notifications sent on to the Personal Hub.

## Methods

- `new AndroidExtension({ loadTango, readFile, openSession })`: all three are test seams.
- `activate(context)`: builds [AndroidSettings](settings/AndroidSettings.md), [AndroidEnvironment](AndroidEnvironment.md), [DeviceSessions](device/DeviceSessions.md), [DeviceManager](DeviceManager.md), [DeviceTabs](DeviceTabs.md), [ViewerTokens](web/ViewerTokens.md) and [AndroidToolCalls](tools/AndroidToolCalls.md); wires every device's `posted` notifications to a [NotificationRelay](relay/NotificationRelay.md); registers [AndroidIpcHandlers](AndroidIpcHandlers.md). Returns the API the routes receive: `{ devices, sessions, tokens, settings, gatewayInfo, viewerSocket }`.
- `deactivate()`: with "Shut devices down when LumaBrowser quits" on, stops the devices this app started ([DeviceManager](DeviceManager.md) `stopStarted`), else only closes the sessions. Waits at most `SHUTDOWN_WAIT_MS` (3 s): an emulator is started detached and finishes saving its snapshot on its own.
- `toolCalls()`: what `mcp-tools.js` calls into.

## An add-on

The manifest is `distributable: true`: the extension is taken out of `app.asar`, packaged by
`npm run build:extensions` as `dist/extensions/android.zip` (about 145 KB with the scrcpy server) and installed
into userData. So nothing in it requires core by a relative path ([ToolReply](tools/ToolReply.md) is its own),
npm packages are found through [AppModules](AppModules.md), and the [renderer](renderer.md) is one classic script.
The Tango packages are dependencies of the app itself. Two things in core name the add-on's tools: the host-only
list (`android_` in HostOnlyTools) and the `ext.android` tool group (MergedSourceTable).

## How it fits together

- **Engine:** Google's Android Emulator from the user's SDK, started headless ([EmulatorFleet](emulator/EmulatorFleet.md)). The SDK licence does not let an app ship it, so the extension finds an installed one ([AndroidSdk](sdk/AndroidSdk.md)) and can make its own device from an installed system image ([AvdCatalog](sdk/AvdCatalog.md)).
- **Screen and input:** the scrcpy server (`resources/scrcpy-server-v3.3.4`, Apache-2.0, licence text beside it, sha256 `8588238c9a5a00aa542906b6ec7e6d5541d9ffb9b5d0f6e1bc0e365e2303079e`) is pushed to the device and driven with Tango, a TypeScript adb and scrcpy client ([TangoModules](device/TangoModules.md), [ScreenStream](device/ScreenStream.md)). Nothing is installed on the device. Tango's newest options class is for scrcpy 3.3.3; the 3.3.4 server speaks the same protocol and carries the Android 16 fixes.
- **The tab:** an ordinary tab on a page the extension serves from its own routes (`/api/ext/android/?device=<name>`, [DeviceRoutes](web/DeviceRoutes.md)), with the video on a WebSocket guarded by a single-use ticket ([ViewerSocket](web/ViewerSocket.md)). An extension cannot add a `luma://` page or a preload bridge, and a custom preload is not kept when a tab is restored; a page found by its address alone comes back after a restart and can be kept like any tab. Loading the page starts the device, so a kept tab keeps its device running.
- **Fit to the tab:** the page sends the size of its frame and the device's display takes it ([DeviceDisplay](device/DeviceDisplay.md)), so the picture is drawn pixel for pixel.
- **Notifications:** read over adb shell with no app on the device ([NotificationWatcher](device/NotificationWatcher.md)) and pushed to the Hub's queue ([NotificationRelay](relay/NotificationRelay.md)). They do not go through the Notifications extension's log or webhook: that extension has no way in for a notification that did not come from a web page.
- **Agent tools:** thirteen `android_*` tools ([AndroidToolSet](tools/AndroidToolSet.md)), one lazy group in chat (`ext.android` in core's MergedSourceTable) and never offered to a turn run for someone else (core's HostOnlyTools).

## Measured (2026-11-24, Ryzen 9 9950X3D, RTX 5090, Android 16 x86_64 image)

- Start from the saved snapshot: 4.3 s to booted, 0.8 s more to the first frame. Cold boot: 17 s on the graphics card, 22 to 50 s on the processor. A stop takes 2.2 s and saves the snapshot. Changing the graphics mode discards the snapshot.
- Touch to the next frame: 35 to 49 ms drawing on the processor, 56 to 111 ms on the graphics card.
- Scrolling at 1688x1120: 36 to 46 fps. The device encodes H.264 in software (`c2.android.avc.encoder`).
- A running device holds about 3.5 GB of memory. `-gpu host` picked the first card only.
- Reading the screen (`uiautomator dump`) takes 2 to 2.8 s: uiautomator waits for the screen to settle.

## Not built

- Installing the SDK for the user, real phones over USB or Wi-Fi (the stream would work; fitting the display must not be applied to one), sound, the clipboard, and the Notifications extension's webhook.
