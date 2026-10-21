# BuilderToolSpecs

`extensions/site-apis/builder/BuilderToolSpecs.js`

The names, descriptions and input schemas of the builder tools; [BuilderTools](BuilderTools.md) attaches the
handlers.

## Tools

| name | mutating | sandboxed | input |
| --- | --- | --- | --- |
| `list_persisted_tabs` | no | | none |
| `use_tab` | yes | yes | `{ tabId }` |
| `define_site` | yes | yes | `{ name?, startUrl?, login?: { required, signInUrlPatterns, signedInSelector, signedOutSelector } }` |
| `define_endpoint` | yes | yes | `{ name, description, params?: [{ name, type, required, description, default?, example }], returns? }` |
| `compile_endpoint` | yes | yes | `{ name?, examples? }` |
| `set_steps` | yes | yes | `{ name?, steps, params?, returns? }` |
| `get_endpoint` | no | | `{ name? }` |
| `test_endpoint` | no | | `{ name?, params? }` |
| `save_endpoint` | yes | yes | `{ name? }` |
| `list_endpoints` | no | | none |

## Methods

- `all()`: every spec in `NAMES` order. One static method per tool (`useTab()`, `defineEndpoint()`, ...).
- `NAMES`, `UNBOUND_NAMES` (the two binding tools an unbound conversation gets), `PARAM_SCHEMA`.

## Decisions

- The record-editing tools are `mutating: true, sandboxed: true`: `ApprovalCheck` skips the approval question
  for a mode's sandboxed tools (`RunToolSet.injected.sandboxed`), and these tools only edit the site and
  endpoint records this conversation exists to edit.
- `test_endpoint` is not mutating: it replays a script in the site's hidden tab, the same class of action as
  the page tools the agent already has.
