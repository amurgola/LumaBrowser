# NestedShellCheck

`core/terminal/NestedShellCheck.js`

Catches a command line an agent wrapped in a second PowerShell (`powershell -Command
"..."`) before it is typed into a terminal that is already PowerShell. The outer shell
expands the `$variables` of such a line and reads its `\"` before the inner shell sees
them, so the command arrives broken. The line is sent back with the reason; the same line
sent again is typed as it is, for the rare case a second shell is meant.

Used by [TerminalMcpTools](TerminalMcpTools.md) for `terminal_run`.

## Methods

- `new NestedShellCheck()`: keeps, per terminal, the line it last sent back.
- `refusal(terminalId, dialect, command)`: `REFUSAL` when `dialect` is `powershell`, the
  line `breaks`, and it is not the line just sent back; else null (type it). A line that
  was sent back gets its way once when it comes again unchanged, and the line after it is
  checked afresh. A different line in between ends that.
- `NestedShellCheck.breaks(command)`: the line matches `WRAPPER` (`powershell` or `pwsh`,
  optional `.exe`, any switches, then `-Command` or `-c` and a double-quoted body) and the
  body matches `BROKEN_BY_OUTER_SHELL`: a `$` that starts a variable or a subexpression,
  or a `\"` (PowerShell escapes with a backtick, so `\"` ends the string).
- `REFUSAL`: opens with "This command was NOT typed", says why, asks for the command line
  itself as it would be typed at the prompt, and names the way to insist.

## Why this and not the syntax validator

Seen live on 2026-11-21: Gemma 4 E4B wrapped a command that held a variable and a quoted
string this way in three of four trials. The shell answered `The term '=' is not
recognized` and `Missing an argument for parameter 'Value'`, and the model gave up.

This check names the one pattern, with no parser, and leaves everything else alone.
