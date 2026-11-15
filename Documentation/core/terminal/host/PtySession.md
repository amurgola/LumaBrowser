# PtySession

`core/terminal/host/PtySession.js`

One live shell: its pseudoterminal, a headless xterm that keeps the screen as text, the shell-integration state
([ShellIntegrationParser](ShellIntegrationParser.md)) and the output stream for whoever is watching.

**Output.** Raw output is handed on in one piece per 8 ms. A viewer acknowledges what it has drawn; when it falls 512 K
characters behind, the shell is paused until it is back within 64 K. Without a viewer nothing pauses.

**Ready.** A new shell is ready at its first prompt mark, or (no integration) once it has printed something and gone
quiet. An agent's calls wait for that, so nothing is typed into a shell that is still starting.

**run** types a command and Enter and waits ([OutputWatch](OutputWatch.md)):

| Status | Meaning |
|---|---|
| `done` | the prompt is back; `exitCode` is the shell's |
| `running` | still going when the wait ended |
| `waiting` | integrated shell, quiet for 4 s with the cursor mid-line: probably asking something |
| `quiet` | no integration, output stopped for 1.5 s: finished or thinking |
| `exited` | the shell itself ended |

The output is the transcript from the line the command was typed on, clipped to a budget with its start and end kept
([ScreenReader](ScreenReader.md)).

**read** returns `new` (since the agent last ran or read, so it also carries what the user typed), `screen` or `tail`,
optionally waiting first: for `until` (a regular expression, or plain text when it is not a valid one), else for the
running command, else for quiet. **send** writes text and named keys ([KeySequences](KeySequences.md)) and replies with
the settled screen. Several lines go in as one bracketed paste when the program asked for it.

**snapshot** serializes screen and scrollback for a viewer that joins late. Pending output is flushed first, so
everything reported before the reply is in the snapshot and nothing after it is.

## Methods

- `new PtySession({ id, pty, xterm, launch, size, emit, timers })`, `start()`, `info()`.
- `write(data)`, `resize({ cols, rows })`, `setViewed(viewed)`, `ack(chars)`, `kill()`, `dispose()`.
- `snapshot()`, `run({ command, timeoutMs, maxChars })`, `read({ mode, lines, waitMs, until, maxChars })`,
  `send({ text, keys, submit, waitMs })`.
- Emits `data { data }`, `state { ...info }`, `exit { ...info }`.

`info().failedToStart` is true when the pseudoterminal ended without ever getting a process or printing anything: node-pty reports that as an exit with code -1, which is a start that failed, not a program that ran. `exitCode` is then null.

`resize` emits `state` at once, so the app's record of a session's size does not wait for the shell's next prompt.
