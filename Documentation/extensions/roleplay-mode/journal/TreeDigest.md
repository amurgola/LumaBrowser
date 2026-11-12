# TreeDigest

`extensions/roleplay-mode/journal/TreeDigest.js`

A small picture of a roleplay conversation at one instant, for the turn
journal.

- `TreeDigest.of(tree, data)`: the message tree (`ConversationPath.tree`: each
  message with its parent, whether it is on the shown branch, and a short
  excerpt), the timeline's points, the head id and the state the head holds
  (turn, scene, cast with who is off stage, ledger rows, open threads,
  pressure, summary length).
- `TreeDigest.shown(list)`: the ids on the shown branch, root first. A
  message is on it when it is the active variant and what it follows is on it
  (a root has no parent to check). `of()` uses it for `active`. The flag alone
  is not enough: after an edit the old wording's reply is still its turn's
  active variant, and read off the flag it sat on the branch behind the new
  wording, so the log reported a fork that never happened.
- `TreeDigest.diff(before, after)`: messages added and removed, where the
  shown branch forks (`{ at, was, now }`; a branch that only grew is not a
  fork), timeline points dropped and added, the head before and after, and per
  state key what was removed and added or the old and new value. `null` when
  nothing changed.
