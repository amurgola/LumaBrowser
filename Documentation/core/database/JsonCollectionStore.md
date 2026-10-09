# JsonCollectionStore

`core/database/JsonCollectionStore.js`

Base class for stores that keep a list of descriptor records (agents, MCP
servers, user tools) as one JSON array under a single settings key. Extends
[SettingsValueStore](SettingsValueStore.md).

## Methods

- `new JsonCollectionStore(rawDb, { storageKey, entity = 'item' })`. `rawDb`
  is `context.db.getRawDb()`; a missing `storageKey` throws. `entity` is the
  id fallback when a name slugs to nothing.
- `list()` every record in creation order; `get(id)` one record or `null`;
  `delete(id)` true when a record was removed.
- For subclasses: `_readAll()`, `_writeAll(list)`, `_slugId(name)`
  (`<slug>-<6 random chars>`), `_nameTaken(name, exceptId)` (case and
  whitespace insensitive), `_add(record)`, `_put(id, record)` (null for an
  unknown id).

## Why

AgentStore, McpServerStore and UserToolStore each re-implemented the same
read, write, id and uniqueness boilerplate. A missing or corrupt stored value
reads as an empty list (the SettingsValueStore contract, run by its test).

A store built with no database reads as empty and drops writes rather than
throwing, as legacy did, so an extension activated before core still loads.

The random id suffix is appended here, not inside [Slug](../shared/text/Slug.md),
so id generation stays visible at the call site.
