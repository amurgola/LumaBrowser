# FileActionRunner

`extensions/desktop-integration/features/file-actions/FileActionRunner.js`

Runs one [file action](index.md) on a validated selection.

- `start(action, items, source)` -> `{ started: true, detail, done }` without
  waiting; `done` resolves the outcome. An unknown id gives
  `{ started: false, detail: 'Unknown action' }`.
- Chat actions (`CHAT` table: prompt setting and autoSend per id) call
  `deps.handoff.open` with the files attached by `path` (read like dropped
  files) and the prompt filled by `fill`. A handoff that attached nothing is a
  failure carrying the rejection reasons.
- `read-aloud`: [FileText](FileText.md) then `deps.speech.speak(text)`.
- `kb-add:<agentId>`: [KnowledgeFiles](KnowledgeFiles.md) (up to `kbMaxFiles`)
  then `env.ingest`; the outcome has `added`, `failed`, `skipped`,
  `truncated` and a one-line `summary`.
- Every outcome is broadcast as `run` (`{ action, count, success, error,
  summary }`); with `notifyResults` on, failures and knowledge-base imports
  show a desktop notification.
- `fill(template, items)`: `{name}`, `{names}`, `{count}`.
