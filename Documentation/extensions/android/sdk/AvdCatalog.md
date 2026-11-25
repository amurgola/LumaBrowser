# AvdCatalog

`extensions/android/sdk/AvdCatalog.js`

The virtual devices (AVDs) in the SDK's device folder.

## Methods

- `list()` -> `[{ name, label, target, playStore }]`, one per `<name>.ini` whose folder still has a `config.ini`.
- `has(name)`; `freeName()`: `Luma_Phone`, `Luma_Phone_2`, ...
- `create({ name, image })`: writes `<name>.ini` and `<name>.avd/config.ini` (4 cores, 2 GB, 1080x2400 as a starting size). A bad or taken name throws.

## Why

Making a device needs no Android Studio and no Java: a device with only these fields booted to the home screen in 59 s on its first start (measured 2026-11-24), and the emulator makes the disk images itself.
