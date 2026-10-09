# ModePreflight

`core/llm-server/ui/js/chat/modes/ModePreflight.js`

The built-in requirement check before a mode starts, and the blocking card
listing what is missing with Close and Open Setup.

## Methods

- `run(requirements)`: `'llm'` (configured runtime and model, else any listed
  model) and `'image'` (`api.image.isRoleReady('image-generate')`, else the local
  defaults); resolves `{ ok, missing: [{ requirement, message }] }`.
- `showBlock(def, missing)`.
