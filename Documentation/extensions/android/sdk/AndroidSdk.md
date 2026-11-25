# AndroidSdk

`extensions/android/sdk/AndroidSdk.js`

The Android SDK installed on this computer: where it is, the tools in it the extension runs, and adb as a command.

## Methods

- `AndroidSdk.locate(preferred)`: the first folder that holds adb, from the folder the user set, `ANDROID_HOME`, `ANDROID_SDK_ROOT`, then where Android Studio puts it (`usualRoot`). Null when none does.
- `AndroidSdk.avdHome()`: `ANDROID_AVD_HOME`, else `~/.android/avd`.
- `root`, `emulatorPath`, `adbPath`, `imagesDir`; `hasAdb()`, `hasEmulator()`.
- `adb(args, { timeoutMs })` -> the trimmed output, or `''` when the command failed or took too long.
