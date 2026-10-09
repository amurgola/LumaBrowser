# ShellCommandName

`core/shell/shellClassifier/ShellCommandName.js`

Reduces a command word to the bare program name the rules key on.

## Methods

- `ShellCommandName.base(command)`: strips one pair of surrounding quotes, any directory (`/` or `\`), and a
  `.exe/.cmd/.bat/.com` extension, then lowercases. `"C:\Tools\Git.EXE"` becomes `git`; `null` becomes `''`.
