# UserPathScripts

`core/llm-server/diagnostics/UserPathScripts.js`

The PowerShell scripts that put nvidia-smi's directory on the user-scope
Windows PATH.

## Methods

- `UserPathScripts.displayCommand(directory)` the multi-line script shown to
  the user to paste (readable names, safe to re-run, PowerShell 5.1 and 7+).
- `UserPathScripts.persistScript(directory)` the script the app runs: exits 1
  with the message on stderr on any error, and reads PATH back after writing,
  because some managed hosts swallow the write via group policy without
  raising. Prints `already-present` or `added`.
