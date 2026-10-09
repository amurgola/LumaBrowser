# PreflightSysdepsIssue

`core/llm-server/PreflightSysdepsIssue.js`

Builds the Linux `system-libs-missing` [Preflight](Preflight.md) issue: the
known-library check plus `ldd` on every installed runtime binary, reduced to
one plain sentence and one copyable apt line.

## Methods

- `PreflightSysdepsIssue.collect(sysdeps, services)` (async) returns the issue
  or `null`. Collects `binaryPath` of every installed runtime from each
  service's `ensureRuntimesView()` (services without it, or whose view throws,
  are skipped), then calls `sysdeps.preflight({ binaries })`
  ([SysdepsChecker](../shared/runtime/SysdepsChecker.md)). `null` when
  `sysdeps` has no `preflight`, the call throws, or the result is ok.
  The issue: `{ id: 'system-libs-missing', area: 'system', severity: 'error',
  title, detail: result.message, fix: { kind: 'sysdeps', aptLine, packages, missing: [{ soname, pkg|null }] } }`.

The raw loader text (`result.rawLog`) never reaches the issue; the code that
installed the runtime logs it.
