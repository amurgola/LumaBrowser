# ArtifactRowHtml

`core/llm-server/ui/js/chat/sidebar/ArtifactRowHtml.js`

Markup for the artifact views: the scope header, one row per chain (its latest
version, a "vN ▾" history badge when there are several, and in the global view
the owning conversation or "Not in a conversation" plus the chain's size), and
the version rows. Every value is escaped.

## Methods

- `ArtifactRowHtml.scopeHead(eyebrow, title, count, extraHtml, titleAttr)`.
- `ArtifactRowHtml.row(artifact, { global }?)`.
- `ArtifactRowHtml.versions(versions)`: newest first, or "No history.".
- `ArtifactRowHtml.bytes(n)`: the one byte ladder with `'0 B'` for zero.
