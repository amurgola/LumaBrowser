# ShellPathExpander

`core/shell/shellClassifier/ShellPathExpander.js`

Expands the environment references a shell path word can carry, for the write-boundary check.

## Methods

- `ShellPathExpander.expand(word, env)`: replaces `$env:X`, `%X%`, `${X}` and `$X` from `env` (unknown ones are left
  as written), `$PWD` with `.`, and a leading `~` with `HOME`, `USERPROFILE` or `os.homedir()`.
- `ShellPathExpander.lookup(env, key)`: exact key first, then case-insensitive.
- `ShellPathExpander.homeOf(env)`: `HOME` or `USERPROFILE`.
- `ShellPathExpander.hasUnresolvedVariable(text)`: true while any variable reference remains.
- `ShellPathExpander.unquote(word)`: trims and strips one matching pair of quotes.
