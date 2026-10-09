# AddonZipper

`tools/build/addons/AddonZipper.js`

Zips a folder under a top-level `<id>/` folder (archiver, zlib level 9), the
layout `core.shell.installExtension` and the extension exporter expect.

## Methods

- `new AddonZipper({ archiver })`; `zip(srcDir, topFolder, destZip)` resolves to the zip size in bytes.
