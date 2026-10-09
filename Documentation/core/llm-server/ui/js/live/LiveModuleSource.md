# LiveModuleSource

`core/llm-server/ui/js/live/LiveModuleSource.js`

Reads a live module's JS for the names the mount injects.

## Methods

- `LiveModuleSource.declaresOwnName(js, name)`: true when the source declares
  `name` with `let`, `const`, `var`, `function` or `class`. Such a module
  predates (or opts out of) the injection, and binding the name as a parameter
  anyway would throw "Identifier has already been declared".
- `LiveModuleSource.declaresOwnStore(js)`: `declaresOwnName(js, 'store')`. Check
  it BEFORE building a store, so no orphan subscription is created.

The pop-out page uses the same regular expression (LiveModuleDocument).

## Globals

None.
