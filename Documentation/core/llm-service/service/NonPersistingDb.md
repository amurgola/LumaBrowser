# NonPersistingDb

`core/llm-service/service/NonPersistingDb.js`

Wraps a settings database so reads pass through and writes are dropped.

## Methods

- `NonPersistingDb.wrap(db)` returns `{ get, has, set, delete }`; `get` and
  `has` read the real db (`has` falls back to `get(key, undefined) !== undefined`
  when the db has no `has`), `set` and `delete` do nothing.

## Why

Ephemeral providers load their config from the real db but get
`setEndpoint`/`setApiKey`/`setSelectedModel` on every resolve; through this
wrapper those calls can never clobber the user's saved provider settings.
