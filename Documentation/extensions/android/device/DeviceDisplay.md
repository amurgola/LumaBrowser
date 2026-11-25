# DeviceDisplay

`extensions/android/device/DeviceDisplay.js`

Sizes a device's display to the frame it is shown in, so the screen fills the tab instead of sitting in it as a fixed phone shape.

## Methods

- `fit({ width, height, density })`: applied one after another; a repeat of the current size is skipped; a device that refuses does not stop later fits.
- `DeviceDisplay.normalise(frame)`: sides rounded down to a multiple of 8 (the encoder's step) and held between 320 and 4096, density between 120 and 640; null for a frame that is not three numbers.
- `current`: the size last asked for.

## Why

scrcpy restarts its encoder by itself when the display changes, so the stream comes back at exactly the new size. Only for emulators: a real phone would keep the size on its own screen.
