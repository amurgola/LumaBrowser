# EmotionCatalog

`extensions/roleplay-mode/emotions/EmotionCatalog.js`

The 157-emotion catalog (`emotions.catalog.json`, data): resolves a short
free-text emotion to its entry, its Danbooru tags, and one of five cached
reaction buckets with a facial-muscle cue for edit models.

## Methods

- `EmotionCatalog.entries()` `[{ name, category, bucket, booru, natural, primary, all }]`, built once.
- `EmotionCatalog.lookup(text)` the best entry by token overlap (primary
  tokens score 3, prose tokens 1; at least 3 needed), or null.
- `EmotionCatalog.enrichBooru(text)` `"<text>, <tags>"` or the text unchanged.
- `EmotionCatalog.bucketFor(text)` `angry|happy|surprised|sad|embarrassed` or null.
- `EmotionCatalog.bucketCue(bucket)` the `BUCKET_CUE` text or `''`.
- Statics: `CATEGORY_BUCKET`, `STOP`, `BUCKET_CUE`.
