# ShellIntegrationParser

`core/terminal/host/ShellIntegrationParser.js`

Reads the marks a shell prints around its prompt and commands off a terminal's escape parser and keeps what they say.
The marks are consumed, so they never reach the screen.

| Sequence | Meaning |
|---|---|
| `OSC 633 ; A` / `OSC 133 ; A` | prompt starts (the shell is integrated; the last command is over) |
| `OSC 633 ; B` | prompt ends |
| `OSC 633 ; C` / `OSC 133 ; C` | a command starts running |
| `OSC 633 ; D [; code]` | the command ended; without a code the shell cannot say how |
| `OSC 633 ; E ; text` | the command line (`\\` is a backslash, `\xHH` that character) |
| `OSC 633 ; P ; Cwd=path` | working directory (escaped the same way) |
| `OSC 7 ; file://host/path` | working directory |
| `OSC 9 ; 9 ; path` | working directory, raw (Command Prompt uses this: its paths cannot be escaped) |

OSC 633 is what our own [integration scripts](../shells/integration/integration.md) print; OSC 133 covers shells that
mark themselves (fish).

## Methods

- `new ShellIntegrationParser(listener)`, `attach(term)`, getter `state` -> `{ integrated, running, cwd, command,
  exitCode }`. Listener events: `prompt`, `command-start`, `command-end`, `cwd`.
- Static `unescape(text)`.
