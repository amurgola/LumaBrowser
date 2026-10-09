# CommitMessageDrafter

`extensions/code-mode/terminal/CommitMessageDrafter.js`

The IDE commit dialog's draft message: a side completion, never a chat message,
never touching a running turn, no tools.

## Methods

- `new CommitMessageDrafter(session, runGit = GitLog.run)`.
- `draft(p)`: replies `commit-message-result { requestId, ok, text | message }`.
  Refuses without a router (`the chat router is not ready yet`) or with an empty
  diff; a newer request aborts the older one (answered `superseded by a newer
  request`); recent subjects of the repository at `p.cwd` (else the session cwd)
  ride along as a style sample ([CommitPrompt](CommitPrompt.md)); the reply is
  cleaned, an empty draft and completion errors are reported.
- `stop()` aborts the pending draft.
