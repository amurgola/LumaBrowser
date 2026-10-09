# MusicModelStore

`core/music-server/service/MusicModelStore.js`

The music model store: catalog rows with their installed and downloading state,
one snapshot download at a time, and deletion scoped to catalog ids.

## Methods

- `new MusicModelStore({ modelsDir, catalog?, startDownload? })`: `modelsDir()`
  is read live; defaults are a new [MusicModelCatalog](../models/MusicModelCatalog.md)
  and [MusicModelDownload](../models/MusicModelDownload.md)`.start`.
- `async view()` `{ modelsDir, models }`, each row the catalog row plus
  `installed` (marker present), `sizeBytes` (the marker's `bytes`, else
  `approxTotalBytes`), `downloading` and `dirPath`.
- `isInstalled(modelId)` and `modelPath(modelId)` (`<modelsDir>/<id>`).
- `download(modelId, { onEvent })` resolves the download result. Throws
  `A model download is already running.`, or the downloader's
  `Unknown music model: <id>`.
- `cancelDownload()` cancels the active download (a throwing cancel is ignored)
  and returns `{ success: true }` either way.
- `async delete(modelId)` refuses `Unknown music model: <id>` for ids outside the
  catalog, else removes `<modelsDir>/<id>` and returns `{ success: true }`.
- Statics: `BUSY_MESSAGE`.

## Why

The catalog check before the recursive delete keeps a renderer-supplied id from
reaching any folder other than a catalog snapshot.
