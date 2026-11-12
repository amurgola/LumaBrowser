# ContextRepository

`extensions/personal-hub/context/ContextRepository.js`

Plain queries over `hub_contexts` and `hub_context_rules`: the user's contexts
(a company, a project, "Personal") in display order, each with the rules that
say which accounts, tabs, calendars and trackers belong to it. Validation and
matching live in [ContextService](ContextService.md).

## Methods

- `new ContextRepository(db)`: `db` is the extension's DatabaseService.
- `list()` -> `[{ id, name, color, sortOrder, rules: [{ kind, value }] }]`,
  ordered by `sort_order` then name; each context's rules ordered by kind
  then value.
- `replaceAll(contexts)`: deletes every context and rule, inserts the given
  set (`[{ id, name, color, sortOrder, rules }]`) and returns `list()`.

## Why

The settings section saves the contexts as one set (like the board columns),
so the repository only ever replaces the whole set: there is no per-row
update to keep in step with the rules table.
