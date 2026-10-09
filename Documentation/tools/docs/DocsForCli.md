# DocsForCli

`tools/docs/DocsForCli.js`

The `node scripts/docs-for.js` command: which docs under `Documentation/` govern a path. A doc opts in with
front matter (see [FrontMatterParser](FrontMatterParser.md)):

```
---
applies_to:
  - core/adblocker/**
  - core/browser/NetworkInterceptor.js
---
```

Modes: `<path...>` (directories expand through `git ls-files`, or a walk when untracked), `--changed` (unstaged +
staged + untracked), `--all` (every opted-in doc with its patterns); `--explain` adds the matching pattern,
`--json` prints machine-readable output. No arguments, `--help` or `-h` print `USAGE`. Exit 0, or 1 when a doc's
front matter is malformed (the message names the doc).

No rebuild doc declares `applies_to` yet, so today every path reports "(no governing doc)".

## Methods

- `new DocsForCli({ out, err, root })` (root defaults to `DocRepository.findRoot(process.cwd())`);
  `execute(argv)` answers the exit code.
- Constants: `USAGE`.
