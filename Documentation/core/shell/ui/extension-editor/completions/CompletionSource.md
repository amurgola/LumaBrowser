# CompletionSource

`core/shell/ui/extension-editor/completions/CompletionSource.js`

Base class of the editor's autocomplete sources.

- `suggest(ctx)` throws until implemented; `ctx` is `{ text (line up to the
  cursor), fileName, position, data, extensionId, monaco }`; returns Monaco items.
- `CompletionSource.matches(label, prefix)`, `CompletionSource.snippet(ctx, fields)`.
- Items carry no range unless a source needs one; Monaco then replaces the word
  at the cursor (legacy passed `getWordUntilPosition(...).range`, which is undefined).

Implementations: ContextPropertyCompletions, ExtensionApiCompletions, ServiceMethodCompletions, DependencyShortcutCompletions, CssClassCompletions, RendererContextCompletions, SlotNameCompletions.
