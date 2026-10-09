# DeliveryEventSummary

`core/llm-server/chat/trigger-store/DeliveryEventSummary.js`

The recognisable facts of an inbound event for the delivery log, never the full body.

## Methods

- `DeliveryEventSummary.compact(event)`: `null` for null, `{ text }` (300
  chars) for a non-object; otherwise the present `FACT_KEYS` (`event`,
  `method`, `contentType`, `name`, `path`, `relPath`, `size`, `monitorId`,
  `url`, `checksum`, `verified`, `synthetic`, `catchUp`), plus for an object
  body `bodyKeys` (30) and `bodyPreview` (its JSON, 300 chars), for a text
  body or `bodyText` a `bodyPreview`, and `diffSummary` (300). Headers and
  file previews are dropped.
