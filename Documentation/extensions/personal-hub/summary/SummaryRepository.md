# SummaryRepository

`extensions/personal-hub/summary/SummaryRepository.js`

Plain queries over `hub_summaries`: the last AI summary of each context's
activity, with the signature of the items it was written from (so a card is
only written again when its items changed) and the last error, if any.

## Methods

- `new SummaryRepository(db)`: `db` is the extension's DatabaseService.
- `all()` -> `{ <key>: row }` for every stored summary.
- `get(key)` -> the row or `null`.
- `save({ key, signature, summary, model, error })`: `summary` is an object
  or `null` (stored as JSON); stamps `updated_at` and returns the row.
- `delete(key)` -> whether a row went.
- `static hydrate(row)`.

Rows hydrate to `{ key, signature, summary, model, error, updatedAt }`. The
key is a context id, or `other` for the card of everything that matched no
context ([ActivitySummarizer](ActivitySummarizer.md)).

## Why

`save` is an update or an insert in two statements, because the extension
database's table scan misreads `ON CONFLICT ... DO UPDATE SET`.
