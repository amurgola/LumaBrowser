# MediaModelCatalog

`core/media-shared/MediaModelCatalog.js`

Base class for the media servers' curated, read-only model catalogs. A subclass
passes its entry table to the constructor and adds its own download or
recommendation rules.

## Methods

- `new MediaModelCatalog(entries)` throws unless `entries` is an array.
- `list()` returns the table as given, in order.
- `getById(id)` returns the entry itself (same object) or `null`.
- `fingerprint()` returns a 16-char hex SHA-1 of the table's JSON, computed once
  per instance.
- `MediaModelCatalog.FINGERPRINT_LENGTH` is 16.

## Implementations

- `core/music-server/models/MusicModelCatalog.js`
- `core/tts-server/models/TtsModelCatalog.js`
- `core/whisper-server/models/SttModelCatalog.js`
- `core/image-server/models/ImageLoraCatalog.js`
- `core/image-server/models/ImageModelCatalog.js` (overrides `list` and
  `getById` to merge extension-contributed rows; the fingerprint covers the shipped rows)

## Why

The music, TTS and STT catalogs each hand-wrote the same `list` / `getById`
pair over a module array, and only music had a fingerprint. One base keeps the
accessor surface identical so callers and the renderer can treat every media
catalog the same way. It is instance-based to match `core/shared/runtime/RuntimeCatalog`.
The fingerprint hashing duplicates `RuntimeCatalog.hashDeclaration`; once that
class settles, this could reuse it.
