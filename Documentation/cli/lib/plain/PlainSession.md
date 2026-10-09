# PlainSession

`cli/lib/plain/PlainSession.js`

The line-oriented `luma` session: print mode, `--json`, piped stdin and `--plain`.

## Methods

- `new PlainSession({ ws, renderer, opts, stdin?, stdout?, stderr? })`: `opts` from
  [AgentArgs](../AgentArgs.md); the streams default to the process's.
- `run()` resolves the exit code:
  - `--agents`: `list-agents`, prints [AgentList](AgentList.md) (a bridge error prints `luma: <message>`, exit 1);
  - `hello { cwd, agent, conversationId, approval }`; when the first word was not an agent
    (`no-agent`), it joins the prompt and the Code agent is asked instead; no `ready` prints the
    error, exit 1;
  - interactive mode prints a two-line greeting to stderr;
  - the first prompt runs as a turn; one-shot modes need one (`luma: a prompt is required with -p / --json`, exit 1);
  - interactive mode then reads lines until `/quit`, EOF or ctrl+c twice.
- `turn(text)`: sends `prompt` and resolves when the renderer sees `done` or `error` (or the socket closes).
- `loop()`: lines become prompts, or `followup` frames while a turn streams; `/quit`, `/exit`, `/id`,
  `/agents` are local; ctrl+c sends `abort` (twice quits).
- `askApproval()`: asks `[y]es once · [a]ll this run · [n]o` through the loop's reader, a one-off
  reader on a TTY, or denies at once on piped stdin (saying to pass `--yes`).
- `PlainSession.decisionFor(reply)`: `y/yes` -> `once`, `a/all` -> `run`, else `reject`.
- `onFrame(raw)`, `onClose()`, `send(type, payload)`, `wait(type, timeoutMs)`.

Exit codes per turn: an `error` frame 1, `done { aborted }` 2, the socket closing mid-turn 1
(`luma: connection closed mid-turn`).
