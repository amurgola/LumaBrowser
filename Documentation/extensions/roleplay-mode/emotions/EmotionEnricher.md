# EmotionEnricher

`extensions/roleplay-mode/emotions/EmotionEnricher.js`

Enriches a free-text emotion with booru cues for tag-trained image models.

## Methods

- `EmotionEnricher.enrich(e)` catalog tags first, else the first matching
  `FALLBACKS` cue appended, else `e` unchanged; `''` for empty.
