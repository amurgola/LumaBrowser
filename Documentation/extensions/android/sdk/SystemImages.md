# SystemImages

`extensions/android/sdk/SystemImages.js`

The Android system images installed in the SDK: what a new device can be made from.

## Methods

- `new SystemImages(imagesDir)`.
- `list()` -> `[{ sysdir, target, apiLevel, tag, label, abi, playStore }]`, newest first, the Google Play image ahead at the same version. `sysdir` is relative to the SDK root with a trailing separator, as an AVD's `image.sysdir.1` wants it.
