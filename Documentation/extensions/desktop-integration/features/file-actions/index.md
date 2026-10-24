# file-actions feature

`extensions/desktop-integration/features/file-actions/index.js`

Luma actions on files and folders selected in a file manager. The action
catalog lives in Luma: a client (the Windhawk mod
[luma-explorer-actions](../../../../integrations/windhawk/luma-explorer-actions.wh.md),
a script, a launcher) asks which actions apply to a selection and runs one by
id; it never hardcodes the list. On by default. Contract: the
[README](../../README.md#5-feature-modules).

## Routes (token required)

- `POST /api/desktop/file-actions/available` `{ paths: [] }` ->
  `{ success, actions: [{ id, label, group, multi }], count, errors: [{ path, error }] }`.
  Any path that cannot be used (see [FileSelection](FileSelection.md)) gives
  `actions: []` plus the reason in `errors`. A malformed body (not a non-empty
  array of strings, over 100 paths) is `400`.
- `POST /api/desktop/file-actions/run` `{ action, paths, agentId? }` ->
  `{ success: true, started: true, action, detail }` at once; the work finishes
  in the background ([FileActionRunner](FileActionRunner.md)). `400` when the
  action does not apply to that selection, a path is unusable or `action` is
  missing. `action: 'ask'` is the generic "ask about this" (becomes
  `ask-image`, `ask-file` or `ask-files`); `action: 'kb-add'` with `agentId`
  equals `kb-add:<agentId>`.
- `GET /api/desktop/file-actions/agents` -> `{ agents: [{ id, name, kbDocs }] }`:
  the agents that can take knowledge-base documents (empty without Agent
  Manager or the knowledge base service).
- `GET /api/desktop/file-actions/settings` -> `{ settings }`: the values below.

## Actions

| id | Applies to | Does |
| --- | --- | --- |
| `describe-image` | one image (png, jpg, gif, webp; 8 MB) | chat handoff, image attached, prompt `promptDescribe`, sent |
| `ask-image` | one image | chat handoff, image attached, composer `promptAskImage`, not sent |
| `edit-image` | one image, an image model ready (edit slot, or the generate slot edit_image falls back to) | chat handoff, composer `promptEditImage`, not sent; the attached image becomes an artifact the chat's `edit_image` tool edits |
| `summarize` | one text, code, Markdown or PDF file (200 KB text, 20 MB PDF) | chat handoff, file attached, prompt `promptSummarize`, sent |
| `ask-file` | the same | chat handoff, composer `promptAskFile`, not sent |
| `read-aloud` | one text or PDF file, a TTS voice installed | `deps.speech.speak` on [FileText](FileText.md) (any size: the start is read) |
| `ask-files` | 2 to `maxFiles` attachable files | chat handoff, all attached, composer `promptAskFiles`, not sent |
| `kb-add:<agentId>` | folders and/or Markdown, text, HTML, PDF files; one per agent (10 at most) | [KnowledgeFiles](KnowledgeFiles.md) collects the documents, ingested into that agent's knowledge base |

Chat actions need the chat (the LLM feature); without it they are not offered.
Upscaling is not offered: the image server has no upscaler.

## Settings (`settingsSchema`)

`promptDescribe`, `promptAskImage`, `promptEditImage`, `promptSummarize`,
`promptAskFile`, `promptAskFiles` (placeholders `{name}`, `{names}`, `{count}`),
`maxFiles` (1 to 10, default 10), `kbMaxFiles` (1 to 2000, default 200),
`allowNetworkPaths` (default off), `notifyResults` (a desktop notification when
an action fails or a knowledge-base import ends; default on).

## Files

[FileSelection](FileSelection.md), [FileActionCatalog](FileActionCatalog.md),
[FileActionEnv](FileActionEnv.md), [FileActionRunner](FileActionRunner.md),
[FileText](FileText.md), [KnowledgeFiles](KnowledgeFiles.md).

`create(deps, options)` takes test seams in `options`: `env`, `runner`,
`notify`, `selection` (FileSelection options).
