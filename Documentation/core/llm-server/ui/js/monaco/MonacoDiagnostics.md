# MonacoDiagnostics

`core/llm-server/ui/js/monaco/MonacoDiagnostics.js`

Turns on Monaco's built-in squiggles, tuned for standalone snippets.

## Methods

- `MonacoDiagnostics.configure(monaco)` runs once per page:
  - TypeScript and JavaScript compiler options: `allowJs`,
    `allowNonTsExtensions`, ESNext target and module, React JSX, `noEmit`.
  - TypeScript: syntax and semantic errors. JavaScript: syntax only (semantic
    checks of loose JS that leans on host globals give more false alarms than
    they are worth). Both ignore `IGNORED_CODES`, the "cannot find module or
    name" family, since a snippet has no node_modules.
  - JSON: validate, allow comments, schema problems as warnings. CSS: validate.
  Each step is best effort.
- `MonacoDiagnostics.IGNORED_CODES`; `reset()` for tests.

Monaco 0.55's language modes resolve their own workers, so `MonacoEnvironment`
must not be set.

## Globals

None.
