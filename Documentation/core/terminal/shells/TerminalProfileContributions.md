# TerminalProfileContributions

`core/terminal/shells/TerminalProfileContributions.js`

The terminal profiles extensions contribute through their manifest:

```js
terminalProfiles: [
  { id: 'repl', label: 'Acme REPL', command: 'acme repl' },          // typed into the user's shell
  { id: 'console', label: 'Acme console', file: '/opt/acme/console', args: ['-i'], env: { ACME: '1' } },
]
```

`ExtensionWiring` registers them at activation and `ExtensionTeardown` removes them when the extension is disabled.
[TerminalProfileRegistry](TerminalProfileRegistry.md) reads and validates them.

## Methods

- `TerminalProfileContributions.shared`, `register(extensionId, profiles)`, `unregisterByExtension(extensionId)`,
  `all()` -> `[{ extensionId, profile }]`.
