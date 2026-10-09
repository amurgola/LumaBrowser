# UserPathEditor

`core/llm-server/diagnostics/UserPathEditor.js`

Adds the nvidia-smi directory to the user-scope Windows PATH and to this
process's PATH, so the next diagnostics run finds it without a restart.

## Methods

- `UserPathEditor.addDirectory(directory)` resolves
  `{ success: true, status: 'added' | 'already-present' }` or
  `{ success: false, error }`. It refuses off Windows, without a directory, or
  when `nvidia-smi.exe` is not in it (so a bogus IPC argument cannot write an
  arbitrary string into PATH). Runs
  [UserPathScripts](UserPathScripts.md)`.persistScript`; on failure the error is
  the script's stderr. On success it appends the directory to
  `process.env.PATH` unless already there (case-insensitive).
