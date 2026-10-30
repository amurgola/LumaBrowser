# KnowledgePathExpander

`core/rag/KnowledgePathExpander.js`

Expands the paths handed to a knowledge-base ingest. A folder stands for every
supported document inside it (recursively, each directory in name order, hidden
dot-entries skipped); a file path passes through untouched so
[RagFileIngestor](RagFileIngestor.md) can still explain an unsupported or
missing file. Used by [RagDocumentImporter](RagDocumentImporter.md), the
agent-manager's [AgentKnowledgeBase](../../extensions/agent-manager/AgentKnowledgeBase.md)
and its REST route, so folder semantics live in one place.

## Methods

- `KnowledgePathExpander.expand(paths)` -> `{ files, emptyFolders }`: `files` in
  input order with duplicates (by resolved path) dropped; `emptyFolders` lists
  the folders that held no supported document.
- `KnowledgePathExpander.isFolder(entry)`: true for an existing directory, false
  otherwise (a missing path is not a folder).
- `KnowledgePathExpander.emptyFolderResult(folder)` -> the per-path ingest
  result `{ path, success: false, error: 'No supported documents in that folder (...)' }`
  callers report for an empty folder.

Supported extensions come from [DocumentParser](DocumentParser.md)`.supportedExtensions()`.
