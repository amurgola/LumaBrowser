# WindhawkModSource

`core/shell/windhawk/WindhawkModSource.js`

Reads a Windhawk mod's source the way Windhawk does. Used by
[WindhawkModInstaller](../WindhawkModInstaller.md) and, through
`tools/windhawk/ModHeader.js` (a re-export), by `npm run windhawk:check`.

## Methods

- `parse(source)` -> `{ fields, id, name, description, version, include,
  exclude, architectureField, architectures, targets, compilerOptions }`;
  throws without a `// ==WindhawkMod==` header. `architectureField` is the raw
  `@architecture` list (what Windhawk stores, empty when absent);
  `architectures` falls back to x86 and x86-64 as Windhawk does.
- `targets(architectures)`: `x86` -> `i686-w64-mingw32`, `x86-64` / `amd64`
  -> `x86_64-w64-mingw32`, `arm64` -> `aarch64-w64-mingw32`.
- `splitArgs(line)`: shell-like split of `@compilerOptions`.
- `clientBlock(source)`: the `// BEGIN luma_client` ... `// END luma_client`
  text (line endings normalized), or null.
- `initialSettings(source)` -> `{ key: number | string }`: the
  `// ==WindhawkModSettings==` defaults flattened like Windhawk's engine
  stores them: booleans as 1/0, a `[a, b]` list as `key[0]`, `key[1]`; `$`
  keys ignored. Covers top-level `- key: scalar` items with plain, double or
  single quoted scalars and flow lists; a nested or object value throws, so a
  mod is never installed with missing defaults.
