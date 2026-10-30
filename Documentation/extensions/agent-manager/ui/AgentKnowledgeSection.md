# AgentKnowledgeSection

`extensions/agent-manager/ui/AgentKnowledgeSection.js`

The agent form's knowledge base. Uploads and removals are RAG-store
operations applied at once (not part of Save), so they are offered only for a
saved agent; the section re-renders in place so unsaved field edits survive.

## Methods

- `new AgentKnowledgeSection({ wrap, errBox, agent, docs, inv, onDocsChanged })`.
- `render()`: "Save the agent first..." for a new agent; else one row per
  document (name, "N page(s) . N chunk(s)", Remove) or the empty line, and
  "Add documents..." plus "Add folder...".
- `add()`: `kb.add` (file picker); `addFolder()`: `kb.addFolder` (folder picker,
  every supported document inside, recursively). Per-file failures are listed
  in the error line as "path: error". `remove(docId)`: `kb.remove`. All call
  `onDocsChanged(docs)` and re-render; failures show "Add documents failed: ..."
  / "Remove failed: ...".
