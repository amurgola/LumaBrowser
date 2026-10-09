# TriggerText

`core/llm-server/ui/js/triggers/TriggerText.js`

Text helpers for the trigger card.

## Methods

- `when(iso, now?)`: "just now", "N min ago", "N h ago", else the date.
- `preview(sample)`: file events as "name (size B): text", bodies as JSON or
  text, clipped to 220 characters.
- `hookUrls(trigger, baseUrls)`: `[{ key, url }]` for public, lan, local.
- `headline(trigger, running)`: `{ cls, text }` per status and source kind.
