# HubSchema

`extensions/personal-hub/HubSchema.js`

Creates and migrates the Hub's tables in the shared settings database, and
seeds the default board columns the first time.

## Tables

- `hub_calendar_sources`, `hub_task_sources`: one row per remote source (kind,
  label, JSON `config` without secrets, `enabled`, `interval_ms`, the sync
  bookkeeping `next_sync_at` / `last_sync_at` / `last_status` / `last_error`).
  Calendar sources also carry a `color`.
- `hub_calendar_events`: synced occurrences, unique per `(source_id, uid,
  starts_at)` so a recurring series expands into one row per occurrence.
- `hub_notifications`: the full intercepted-notification log (app, host,
  title, body, url, tag, sender, `thread_key`, `thread_id`, `dedupe_key`, JSON
  `data`), indexed by time, thread and dedupe key.
- `hub_threads`: the activity feed's items, unique per `(app, thread_key)`,
  with `state` (open, reviewed, snoozed, done; `done` is an item the user
  dismissed), `priority`, `summary`, `labels`, `context` (an automation's
  `kind` is kept here), `task_id` and `snooze_until`.
- `hub_board_columns`: the board's columns (`key` unique, `sort_order`, `is_done`).
- `hub_tasks`: local and imported tasks (`source_id` + `remote_id` unique),
  the `column_key` they sit in, the `remote_status` last seen and its
  `remote_status_color`, the `list_id` / `list_name` it came from, a
  `pending_status` still to push, the last push error `sync_error`, `archived`
  instead of deleted, and `hidden` (the user tucked it off the board).
- `hub_task_messages`: a task's conversation, `direction` local or remote,
  `synced` and `sync_error` for local messages still to post.
- `hub_contexts`: the user's contexts, the companies or areas of life
  everything is filed under (`name`, `color`, `sort_order`).
- `hub_context_rules`: what belongs to each context, one row per rule
  (`context_id`, `kind`: url, partition, domain, app, calendar or tasks,
  and `value`), indexed by context
  ([ContextService](context/ContextService.md)).
- `hub_summaries`: the last AI summary of each context's activity, keyed by
  `context_key` (a context id, or `other`), with the `signature` of the
  items it was written from, the `summary` as JSON, the `model` that wrote
  it and the last `error`
  ([ActivitySummarizer](summary/ActivitySummarizer.md)).
- `hub_contacts`: the people the activity feed has seen, one row per person
  (`name`).
- `hub_contact_identities`: every way a contact appears (`contact_id`, the
  `app`, the `handle`: an address or a normalised name, the `display` name,
  the `context_id` it was seen in, empty for none, `first_at`, `last_at` and
  a `count` of sightings), unique per `(app, handle, context_id)` and
  indexed by contact and by handle
  ([ContactService](contacts/ContactService.md)).
- `hub_snapshots`: the conversation text last read from the user's tab for
  an activity item, keyed by `thread_id`, with the `scope` it was read at
  (`conversation` or `tab`), the `url` read, `source_at` (the item's last
  activity the text reflects) and `taken_at`
  ([ConversationReader](snapshot/ConversationReader.md)).

That is fourteen tables.

## Methods

- `ensure(db)`: runs every `CREATE ... IF NOT EXISTS`, applies `ADDED_COLUMNS`
  (`hub_tasks.hidden`, `remote_status_color`, `list_id` and `sync_error` for databases made
  before them; each skipped when the column exists), then seeds `DEFAULT_COLUMNS`
  (backlog, todo, doing, review, done) when the column table is empty.

## Why

Tasks are archived, never deleted, by a sync so the messages written here
survive a task leaving the user's ClickUp filter. The notification log is a
real table rather than the 50-entry settings value the Notifications extension
keeps, because the activity feed needs history and per-thread lookups.
