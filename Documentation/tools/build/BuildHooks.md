# BuildHooks

`tools/build/BuildHooks.js`

electron-builder `onNodeModuleFile` hook (wired through `scripts/build-hooks.js`):
force-includes `node_modules/typescript/lib/lib.*.d.ts`. electron-builder
excludes `*.d.ts` from node_modules whatever the `files` patterns say, and the
TypeScript validator needs these default libs at runtime.

## Methods

- `BuildHooks.onNodeModuleFile(filePath)`
