# LaunchArgsBuilder

`core/llm-server/server/launch/LaunchArgsBuilder.js`

Assembles the llama-server argv for a resolved launch.

## Methods

- `LaunchArgsBuilder.build(state)` returns the argv, in this order:
  1. `-m <model> -c <ctx> -ngl <n> --host 127.0.0.1 --port <port>`
  2. `--load-mode none` or `--no-mmap` (none for mmap); `--fit off`; `--api-key <key>`
  3. `--flash-attn on`; `--mmproj`; `--cache-type-k/-v` (quantized only, with
     flash attention); `--no-kv-offload`
  4. `--parallel <n>`; `--swa-full`; `--no-context-shift`; `--cache-reuse 256`;
     `--cache-ram <MiB>`; `--slot-prompt-similarity 0.1`
  5. speculation: ik `--spec-type mtp:n_max=N`; mainline `--spec-type draft-mtp,ngram-mod --spec-draft-n-max N`
     [`-md <head> [-ngld 99]`] `--spec-ngram-mod-n-match 40 --spec-ngram-mod-n-min 0 --spec-ngram-mod-n-max 16`;
     or standalone `--spec-type ngram-mod --spec-ngram-mod-n-max 4`; then `--cache-type-k-draft/-v-draft`
  6. splits: `--split-mode tensor [--tensor-split r]`; `--rpc <addrs> [--tensor-split r]`;
     `--n-cpu-moe N [--tensor-split r]` or `--cpu-moe`; fill-order `--tensor-split r`
  7. family tuning args, the family drafter args, the runtime's `extraArgs`, then the user's flags
- `HOST` (`127.0.0.1`).

## Why

No `--log-disable`: the supervisor surfaces load progress and allocation errors.
`--fit off` skips a ~3 s no-alloc projection pass (8.5 s to 5.7 s load-to-healthy)
because every value it would tune is already set. `--parallel` is always pinned
because newer builds default to automatic slot counts. `--no-context-shift`
makes a full cache fail the request instead of silently dropping the oldest
tokens, which on an agent run are the system prompt and tool contract. The
detached MTP head goes to the GPU whenever the model does: a CPU draft step is
slower than the decode it saves. User flags come last so they win by
llama-server's last-occurrence parsing, and are never filtered.
