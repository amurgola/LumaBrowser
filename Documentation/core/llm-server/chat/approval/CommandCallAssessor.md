# CommandCallAssessor

`core/llm-server/chat/approval/CommandCallAssessor.js`

Judges one call to a shell-running tool by its command line, for the
[approval gate](../ApprovalGate.md). A safety gate: verdicts are never loosened.

## Methods (all static)

- `assess(toolName, params, { projectRoot?, enabled?, dialect?, env? })`:
  `null` when the tool is not in `COMMAND_TOOLS`, `enabled === false`, or the
  command is empty. Otherwise
  `{ verdict, tier, reasons, outside, unverifiable, command, detail }`:

  | Classifier tier / boundary | verdict | Gate behaviour |
  | --- | --- | --- |
  | `forbidden` | `deny` | refused before dispatch, reason to the model |
  | `mass-destructive`, or any write outside the project | `ask-always` | card even after "allow for this run" |
  | `readonly` | `skip` | no card (still ledgered and traced) |
  | `normal` | `ask` | card when the policy says ask |

  - The dialect is `ctx.dialect`, else the tool's `shell` param (unless
    `auto`), else `auto`; it goes to
    [ShellClassifier](../../../shell/shellClassifier/ShellClassifier.md)`.classify(command, { dialect })`.
  - With `projectRoot` and a non-forbidden tier,
    [ShellWriteBoundary](../../../shell/shellClassifier/ShellWriteBoundary.md)`.check(command, cwd, [projectRoot], { dialect, env })`
    runs, where `cwd` is the tool's `cwd` param resolved against the root (`.`
    or blank means the root) and `dialect` is `undefined` for `auto`.
  - `detail`: ``Run `<command>` `` (clipped to 120), plus the mass-destructive
    reason, plus `Writes outside the project: <up to 3 paths>[ and N more]`.
  - If the classifier throws, the result is a plain `ask` (`tier: 'normal'`,
    reason `classifier error: <message>`): exactly the pre-classifier behaviour,
    never a skip. If the boundary check throws, the tier verdict stands.
- `isEnabled(db)`: reads `SETTING` (`core.agent.shellClassifier`) from a
  `{ get(key, fallback) }` object; off for `false`, `'false'`, `0`, `'0'`,
  `'off'`; on otherwise, when there is no db, or when `get` throws.
- `isCommandTool(toolName)`: own-key lookup in `COMMAND_TOOLS`.
- `COMMAND_TOOLS`: data, one entry per tool that runs a shell string, with
  `command(p)`, `cwd(p)` and `shell(p)` accessors. Only `run_command` today.

## Why

A shell command is the one gated tool whose danger depends on its argument.
`git status` and `rm -rf /` both arrive as run_command, and gating them
identically is how a user ends up with thirty "Allow?" cards and turns the gate
off. A known write target outside the project root (the root the file tools
refuse to leave) always reaches a human, and the card names it.
