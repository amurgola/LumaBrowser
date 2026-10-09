# PowerShellGrammar

`core/llm-server/validation/validators/PowerShellGrammar.js`

Loads the tree-sitter PowerShell grammar into the web-tree-sitter WebAssembly
runtime once and caches it.

## Methods

- `PowerShellGrammar.load()` resolves to `{ Parser, language }`. The first call
  initialises the runtime and loads `tree-sitter-powershell.wasm`; later calls
  share the same promise. A failed load clears the cache so the next call
  retries (for example when the wasm was not unpacked yet).
- `PowerShellGrammar.createParser()` resolves to a new `Parser` set to the
  PowerShell language. The caller must `delete()` it.

## Why

Loading the grammar is the expensive part and the result is immutable, so it
happens once per process and only on first use; startup pays nothing.

The grammar file is read with `fs.promises.readFile` and handed to
`Language.load` as bytes. Given a path, `Language.load` does a dynamic
`import('fs/promises')`, which Jest's VM rejects without
`--experimental-vm-modules`; reading the bytes ourselves behaves the same in
Electron and lets the PowerShell tests run under Jest.
