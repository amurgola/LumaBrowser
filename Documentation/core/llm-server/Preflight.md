# Preflight

`core/llm-server/Preflight.js`

Boot-time preflight for the LLM tab: the configuration problems the user is
guaranteed to hit later (missing system libraries, no installed runtime for
the default model, a vanished default model), so the tab's top banner can show
them the moment it opens instead of at first use. An issue marked
`selection: true` is a saved model choice that is gone; the shell alerts on
those at startup ([StartupModelAlert](../../ui/shell/notifications/StartupModelAlert.md)).

## Methods

- `Preflight.collectIssues({ llmServerService, imageServerService?, musicServerService?, llmService?, fileExists?, sysdeps? })`
  resolves `{ issues }`. Same as `new Preflight(options).collect()`.
  - `llmService` is the slot router ([LLMService](../llm-service/LLMService.md)), for
    slots bound to a model that is gone; optional.
  - `agentManager` is the Agent Manager's public surface (`global.__lumaAgentManager`), for
    agents pinned to a model that is gone; optional.
  - `fileExists(path)` defaults to a safe `fs.existsSync`.
  - `sysdeps` is anything with `preflight({ binaries })`; defaults to
    `new SysdepsChecker()`, which is a no-op off Linux.

Issue order: system libraries, then LLM, image, music, then the selection
issues of [PreflightSelectionIssues](PreflightSelectionIssues.md).

## Issue shape

```
{ id, area: 'system'|'llm'|'image'|'music'|'slots', severity: 'error'|'warning', title, detail, selection?,
  fix: { kind: 'install-runtime', server, runtimeId, runtimeName }
     | { kind: 'open-view', view: 'settings'|'image'|'music', settingId? }
     | { kind: 'open-settings', tab, extensionId?, settingId?, selector? }
     | { kind: 'sysdeps', aptLine, packages, missing: [{ soname, pkg }] } }
```

Every `selection` issue's fix also carries `settingId`, the search palette's
catalog entry for the control itself (`llm.model` for `llm-model-missing`,
`music.model` for `music-model-missing`; the rest in
[PreflightSelectionIssues](PreflightSelectionIssues.md)), so an alert takes the
user to that control through `core.palette.reveal` and not just to its page.

The renderer banner (`ui/js/preflight.js`, deferred) acts on `fix`.

## Checks

| id | When |
|---|---|
| `system-libs-missing` | [PreflightSysdepsIssue](PreflightSysdepsIssue.md): Linux libraries missing |
| `llm-runtime-unknown` / `-missing` / `-hardware` | about the runtime that serves the default model (below); see [PreflightRuntimeIssue](PreflightRuntimeIssue.md) |
| `llm-model-missing` | the default model path no longer exists (`selection`) |
| `image-runtime-*` | image server enabled and a default image runtime chosen |
| `image-runtime-unset` | image server enabled, a model (generate, edit or video) set, no runtime |
| `music-runtime-*` | music server enabled (runtime `sglang-omni` is implicit) |
| `music-model-missing` | music default model set but not fully downloaded (`selection`) |
| `llm-helper-model-missing`, `image-model-missing`, `image-edit-model-missing`, `image-video-model-missing`, `slot-model-unavailable:<slotId>` | [PreflightSelectionIssues](PreflightSelectionIssues.md) (all `selection`) |

## Why it is shaped this way

- **Only configured features.** No default runtime chosen means setup is
  unfinished, which the wizard owns. A fresh install gets an empty list, so the
  banner never nags before onboarding. Image and music checks need the server
  enabled (`isEnabled()`).
- **No probes of its own.** Runtime state comes from each service's cached
  `ensureRuntimesView()`, so a pass never spawns `--version` probes; the only
  fresh I/O is the models scan that finds what serves the default chat model
  (headers cached) and one existence check on that model.
- **The runtime that serves the default model.** The LLM check reports on
  `llmServerService.runtimeFollower.resolve()`
  ([DefaultRuntimeFollower](service/DefaultRuntimeFollower.md)), not on the stored
  `defaults.runtimeId`. When no installed build loads the model, the issue is
  `llm-runtime-missing` for the build to install: that framework's active build
  (`frameworkSelection.activeBuild`), else the stored id, else its first row
  (`PreflightRuntimeIssue.frameworkBuild`). A model no framework loads raises no
  runtime issue (the launch refuses it with its own message). With no default model
  on disk, no follower on the service, or a resolver failure, the stored id is
  checked as before.
- **Fail soft.** A throwing `getDefaults` skips that feature. A runtimes-view
  failure leaves no rows, which reads as `-runtime-unknown` rather than
  pretending the binary is absent. A music models-view failure assumes the
  model is fine. A throwing sysdeps check adds nothing.
- **System libraries first,** because a missing libgomp or libnss makes every
  later check moot and the fix is the same apt line whichever runtime tripped.
