# StateProbeCli

`tools/roleplay/StateProbeCli.js`

`npm run rp:state`: runs the roleplay state probes from the terminal.

- `--context-only` (the default without a model): no model, checks the request
  each probe would send.
- `--model <gguf>` launches a llama-server (TextRunCli's launch and options:
  `--ctx`, `--effort`, `--device`, `--port`, `--runtime`); `--base-url <url>`
  uses a server that is already up.
- `--probe <id>` (repeatable), `--list`, `--repeat <n>`, `--log` (a verbose
  turn log per probe), `--label`, `--out`.
