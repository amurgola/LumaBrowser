# AppLicenseInfo

`core/shell/extension-admin/AppLicenseInfo.js`

What Settings > About shows.

## Methods

- `AppLicenseInfo.read(rootDir)` `{ appLicense, thirdParty, version, name }` from
  `LICENSE`, `THIRD-PARTY-LICENSES` (each `''` when missing) and `package.json`
  (`productName`, else `name`).
