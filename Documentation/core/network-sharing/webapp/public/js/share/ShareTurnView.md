# ShareTurnView

`core/network-sharing/webapp/public/js/share/ShareTurnView.js`

One shared turn in the chat's classes.

## Methods

- `new ShareTurnView(artifacts)`: a [ShareArtifacts](ShareArtifacts.md).
- `render(message)`: a user turn (`.cm-turn.user`): attached files collapsed into
  the chat's attachment cards (images skipped: they come from the artifact refs),
  then the typed text as `.cm-user-bubble` (textContent) when there is any or no
  attachment, then artifacts. Otherwise an assistant turn (`.cm-turn.assistant` >
  `.cm-asst` > `.cm-asst-body` with `MarkdownRenderer.render`), artifacts, and
  an escaped `.sv-error` line `[<error>]`. No reasoning pane: the projection never
  carries it.
