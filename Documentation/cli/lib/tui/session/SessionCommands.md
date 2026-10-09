# SessionCommands

`cli/lib/tui/session/SessionCommands.js`

The full-screen session's slash commands.

## Methods

- `new SessionCommands(app)`.
- `complete(prefix)`: palette entries for the editor: the `COMMANDS` matching what was typed, or after
  `/agent ` the agent names (the list is fetched once; the palette refreshes when it lands); `null`
  for text that is not a command.
- `run(line)`: a bare `/` is `/help`.
  - `/help` (`/?`): every command and a keys line; `/quit` (`/exit`, `/q`); `/id`; `/clear` (screen,
    scrollback bookkeeping); `/reasoning`; `/agents` (rows with model, tools, KB docs, `← current`);
  - `/agent <name>` (`.` for the plain Code agent), `/new`, `/resume <id>`, `/yes` (toggle approvals,
    same conversation): refused mid-turn; commit the transcript and send a new `hello` on the same
    socket; usage notes when the argument is missing;
  - anything else: `unknown command <cmd> (try /help)`.
- `fetchAgents()`: `list-agents`, waits 8 s for `agents`; a note on failure.
- Statics: `COMMANDS`, `KEYS_HELP`, `NO_AGENTS`, `SESSION_COMMANDS`.
