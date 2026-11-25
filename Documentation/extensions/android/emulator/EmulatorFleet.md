# EmulatorFleet

`extensions/android/emulator/EmulatorFleet.js`

The emulators running on this computer.

## Methods

- `running()` -> Map of device name to adb serial, read from `adb devices` and each emulator's `emu avd name`.
- `start(name)` -> `{ serial, alreadyRunning, bootSeconds }`: uses a device that is already running, else starts it (`-no-window -no-audio -no-boot-anim -gpu <mode>`) on the first free even port from 5554 and waits for `sys.boot_completed`. Two calls for one device share one start; `isStarting(name)` is true meanwhile.
- `stop(name)`: `emu kill`, which saves the quick-boot snapshot. `stopStarted()`: only what this app started.

## Why

An emulator is started detached and is not put in core's child-process registry: killed with the app it would lose its snapshot and the next start would be a cold boot. One that outlives the app is found running at the next start and used as it is. Its log goes to the temp folder (`luma-android/emulator-<name>.log`).
