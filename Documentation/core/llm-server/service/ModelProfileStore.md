# ModelProfileStore

`core/llm-server/service/ModelProfileStore.js`

The user's model profiles: a named set of request overrides on top of one base model (`{ id, name, baseRef, overrides, createdAt, updatedAt }`). A profile is picked anywhere a model is, as `profile::<id>`. Extends [JsonCollectionStore](../../database/JsonCollectionStore.md).

## Methods

- `new ModelProfileStore(settingsDb)`.
- `list()`, `get(id)`, `delete(id)` inherited.
- `listFor(baseRef)`: the profiles of one base model.
- `create({ name, baseRef, overrides })`: a new profile with a slugged id (`precise-ab12cd`) and `ModelOverrides.clean(overrides)` (request fields only). Throws `A profile needs a base model` (missing, or no `::`), `A profile cannot be based on another profile`, `Profile name is required`, or `This model already has a profile named "x"`. Names are trimmed and cut to `MAX_NAME_LENGTH` (60).
- `update(id, { name?, overrides? })`: renames (same checks) and replaces the overrides; the base never changes. Throws `Model profile not found`.
- `STORAGE_KEY` `core.llmServer.modelProfiles`.

## Why

Names are unique per base model only, so "Precise" can exist for two different models. A different base is a different profile, so `update` ignores a `baseRef` rather than silently moving the agents and chats that use it to another model.
