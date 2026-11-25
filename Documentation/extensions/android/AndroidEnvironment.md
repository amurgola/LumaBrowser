# AndroidEnvironment

`extensions/android/AndroidEnvironment.js`

The Android SDK the extension is working with right now and what is built on it: the device catalog, the system images and the emulator fleet.

## Methods

- `new AndroidEnvironment({ settings, locate, avdHome })`.
- `current()` -> `{ sdk, catalog, images, fleet }`, or null when no SDK is installed. Built once per SDK root and again when the stored folder points somewhere else.
- `required()`: as `current()`, but a missing SDK throws `NO_SDK`, which says what to install.
