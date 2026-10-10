# MacDevApp

`scripts/MacDevApp.js`

Prepares a macOS development bundle named LumaBrowser Dev without changing the
installed Electron dependency. OS-facing names come from bundle metadata;
`app.setName()` alone does not change the name in the macOS app switcher.

- `prepare(electronPath, rootDir)` returns the copied executable inside
  `.cache/mac-dev-app/<key>/LumaBrowser Dev.app`. Preserves relative framework
  symlinks and uses filesystem copy-on-write where supported.
- `cacheKey(source, icon)` hashes the runtime path and Info.plist, project icon,
  and preparation code. A ready marker is written only after successful branding.
- `brand(bundle, icon, staging, run?)` sets the bundle names, development bundle
  identifier and icon, then ad-hoc signs the copied outer bundle while preserving
  Electron's entitlements, requirements and flags.
- `createIcon(icon, staging, output, run?)` uses macOS sips/iconutil to produce
  an ICNS with standard and Retina sizes from `icon/icon.png`.

Uses system macOS tools only. Failed preparation removes staging files and
propagates the error; completed bundles are cached for subsequent starts.
The app still runs unpackaged from the repository with its existing profile.
