# TrainerRequirements

`extensions/lora-trainer/TrainerRequirements.js`

Makes ai-toolkit's requirements installable without git on the PATH.

## Methods

- `resolve(file, readFile)`: the requirement lines of `file` with nested `-r` files
  inlined and comments dropped.
- `withoutGit(line)`: `git+https://github.com/o/repo.git@ref` becomes
  `repo @ https://github.com/o/repo/archive/ref.zip`; anything else is unchanged.
