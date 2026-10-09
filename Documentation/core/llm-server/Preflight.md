# Preflight

`core/llm-server/Preflight.js`

Boot-time preflight for the LLM tab: the configuration problems the user is
guaranteed to hit later (missing system libraries, a chosen runtime that is
not installed, a vanished default model), so the tab's top banner can show
them the moment it opens instead of at first use.

## Methods

- `Preflight.collectIssues({ llmServerService, imageServerService?, musicServerService?, fileExists?, sysdeps? })`
  resolves `{ issues }`. Same as `new Preflight(options).collect()`.
  - `fileExists(path)` defaults to a safe `fs.existsSync`.
  - `sysdeps` is anything with `preflight({ binaries })`; defaults to
    `new SysdepsChecker()`, which is a no-op off Linux.

Issue order: system libraries, then LLM, image, music.

## Issue shape

```
{ id, area: 'system'|'llm'|'image'|'music', severity: 'error'|'warning', title, detail,
  fix: { kind: 'install-runtime', server, runtimeId, runtimeName }
     | { kind: 'open-view', view: 'settings'|'image'|'music' }
     | { kind: 'sysdeps', aptLine, packages, missing: [{ soname, pkg }] } }
```

The renderer banner (`ui/js/preflight.js`, deferred) acts on `fix`.

## Checks

| id | When |
|---|---|
| `system-libs-missing` | [PreflightSysdepsIssue](PreflightSysdepsIssue.md): Linux libraries missing |
| `llm-runtime-unknown` / `-missing` / `-hardware` | a default LLM runtime is chosen; see [PreflightRuntimeIssue](PreflightRuntimeIssue.md) |
| `llm-model-missing` | the default model path no longer exists |
| `image-runtime-*` | image server enabled and a default image runtime chosen |
| `image-runtime-unset` | image server enabled, a model (generate, edit or video) set, no runtime |
| `music-runtime-*` | music server enabled (runtime `sglang-omni` is implicit) |
| `music-model-missing` | music default model set but not fully downloaded |

## Why it is shaped this way

- **Only configured features.** No default runtime chosen means setup is
  unfinished, which the wizard owns. A fresh install gets an empty list, so the
  banner never nags before onboarding. Image and music checks need the server
  enabled (`isEnabled()`).
- **No probes of its own.** Runtime state comes from each service's cached
  `ensureRuntimesView()`, so a pass never spawns `--version` probes; the only
  fresh I/O is one existence check on the default chat model.
- **Fail soft.** A throwing `getDefaults` skips that feature. A runtimes-view
  failure leaves no rows, which reads as `-runtime-unknown` rather than
  pretending the binary is absent. A music models-view failure assumes the
  model is fine. A throwing sysdeps check adds nothing.
- **System libraries first,** because a missing libgomp or libnss makes every
  later check moot and the fix is the same apt line whichever runtime tripped.
