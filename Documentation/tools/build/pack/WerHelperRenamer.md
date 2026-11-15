# WerHelperRenamer

`tools/build/pack/WerHelperRenamer.js`

The electron-builder `afterPack` step for Windows crash coverage, run by
`scripts/after-pack.js` after [DistributableExtensionPruner](DistributableExtensionPruner.md).
Electron 45 ships `electron_wer.dll`, a Windows Error Reporting helper that lets
the crash reporter catch fast-fail terminations. Windows looks it up as
`<executable name>_wer.dll` next to the executable, so it is renamed after the
packaged product (`LumaBrowser_wer.dll`); left under its original name it is
never loaded. File operations go through [BuildFs](../BuildFs.md).

## Methods

- `new WerHelperRenamer({ log })`: `log` defaults to `console.log`; one
  `[wer] electron_wer.dll -> <name>` line per rename.
- `rename(context)`: `context` is electron-builder's afterPack context
  (`{ electronPlatformName, appOutDir, packager }`). Renames
  `<appOutDir>/electron_wer.dll` to `<packager.appInfo.productFilename>_wer.dll`
  and returns the new file name, or null when there is nothing to rename
  (another platform, an Electron without the helper, a direct call without
  packager details).
- Statics: `SOURCE` (`electron_wer.dll`), `SUFFIX` (`_wer.dll`).
