# PreviewFlags

`core/shell/shellClassifier/rules/packages/PreviewFlags.js`

Recognizes rehearsal flags that make a command only report what it would do.

## Methods

- `PreviewFlags.rehearses(toolArgs)` -> true for `--dry-run`, `--dryrun`, `--preview-only`, `-WhatIf`, `--what-if`
  (bare or with a value such as `--dry-run=client`), false when an inline value turns it off (`none`, `false`,
  `$false`, `0`, `no`).

## Why

A rehearsal changes nothing, so it drops back to the normal ask instead of always asking. Only rows marked `preview`
consult it, and those are the commands whose documentation lists the flag (npm/pnpm/bun/deno/cargo/poetry/uv publish,
`hex.publish`, `swift package-registry publish`, kubectl, helm, AWS, `pulumi destroy`, PowerShell cmdlets). On other
tools the flag is ignored, since an unknown flag may be silently accepted and the command still run.
