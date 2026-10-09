# NinferUninstaller

`extensions/ninfer-runtime/NinferUninstaller.js`

The `uninstall` hook.

## Methods

- `NinferUninstaller.uninstall({ managedDir }, platform = process.platform)`: for
  a WSL manifest on Windows, `rm -rf` the install dir and its `-src` checkout
  inside the distro (60 s); then removes the managed dir. Best effort
  throughout; never throws.
