# TerminalMcpTools

`core/terminal/TerminalMcpTools.js`

The `terminal_*` MCP tools (source `core.terminal`), registered by `CoreMcpTools`. The in-app agent sees them as one
lazy "Terminal" group (`MergedSourceTable`); MCP clients see them through the MCP proxy.

| Tool | Does |
|---|---|
| `terminal_list` | open terminals and the profiles a new one can use |
| `terminal_open` | opens a terminal (a shell or a CLI app profile), shown to the user in a tab |
| `terminal_run` | types a command, presses Enter, waits; replies with output, exit code, folder |
| `terminal_send` | text and named keys for prompts, REPLs and full-screen programs |
| `terminal_read` | `new`, `screen` or `tail`, optionally waiting for a pattern, the command or quiet |
| `terminal_close` | ends a terminal and its tab |

Replies are plain text with one head line (`[terminal t1 | done | exit code 0 | 0.4 s | C:\work]`), not JSON, so a
model reads output as it was printed. A run that ends short carries a hint for the next step.

**Safeguards**

- Every call is refused while `core.terminal.agentAccess` is off ([TerminalSettings](TerminalSettings.md)). This covers
  the in-app chat, MCP clients and the REST proxy alike.
- The tools that type are `mutating`, so the chat's approval gate asks first; one "allow for this run" covers the
  family (`family:terminal`, not carried to later runs).
- `terminal_run` is a command tool for `CommandCallAssessor`: a read-only command skips the question, a destructive one
  always asks, a forbidden one is denied. The handler repeats the deny check itself (with the session's own shell as
  the dialect), so it also holds for callers that never pass the gate.
- A session the user took over refuses input ([TerminalService](TerminalService.md)).
- The tools never reach turns run for someone else (`HostOnlyTools`).

With no id, a tool uses the terminal the agent used last; `terminal_run` opens one when none is open. A terminal the
agent opens gets a tab that is not brought to the front.

## Methods

- `new TerminalMcpTools({ service, settings, viewers, db })`, `handler()` -> `(toolName, args) => McpResult`.
- Statics: `SOURCE`, `TOOLS`, `ACCESS_OFF`.
