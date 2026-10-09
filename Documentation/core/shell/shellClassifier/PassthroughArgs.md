# PassthroughArgs

`core/shell/shellClassifier/PassthroughArgs.js`

Strips a pass-through wrapper's own options so what remains is the command it runs.

## Methods

- `PassthroughArgs.NAMES`: env, nohup, time, timeout, nice, ionice, xargs, watch, strace, ltrace, caffeinate, script,
  stdbuf, unbuffer, chronic, ts, busybox, wsl.
- `PassthroughArgs.isPassthrough(name)`.
- `PassthroughArgs.strip(name, args)` returns the inner command words:
  - `timeout` and `watch`: skip leading flags (and the values of value-taking ones); `timeout` also skips its
    positional duration.
  - `script`: only the `-c` value, or nothing.
  - `env`: its `VAR=value` words are kept, single-quoted, in front of the command (`["A='1'", 'ls']`), so the
    re-parsed line carries them as assignments the rules judge (e.g. `GIT_SSH_COMMAND`); a bare `env A=1` is `[]`.
  - others: skip flags and their values (`VALUE_FLAGS` per wrapper) and stop after `--`.
