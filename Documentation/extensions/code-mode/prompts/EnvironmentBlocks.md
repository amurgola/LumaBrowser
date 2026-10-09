# EnvironmentBlocks

`extensions/code-mode/prompts/EnvironmentBlocks.js`

Renders `context.code.capabilities()` into build-prompt blocks so the agent uses
what this install really has.

## Methods (static)

- `environment(env)` -> `<environment>` listing core services (`(none)` when
  empty) and one line per installed extension: `- id (name): description | API:
  ... | tools: ... | routes: /api/ext/<id>` (`(no other extensions are installed)`
  when none). Null without a snapshot.
- `apiReference(env)` -> `<api_reference>` with one collapsed line per
  `env.contextApi` entry (`- context.<name> (<detail>): <doc>`) plus
  `Manifest fields: ...`. Null without a catalog.
