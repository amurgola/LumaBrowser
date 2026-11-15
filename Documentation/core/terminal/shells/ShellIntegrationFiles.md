# ShellIntegrationFiles

`core/terminal/shells/ShellIntegrationFiles.js`

The [integration scripts](integration/integration.md) as a shell can load them. They ship inside the app archive,
which a shell cannot read, so bash's and zsh's are copied to `<userData>/terminal/shell-integration` (rewritten once
per launch, so an update replaces the old ones, and always with Unix line endings: a checkout that gave the
sources Windows endings would otherwise break bash and zsh) and PowerShell's is handed over as text. zsh gets a folder with one
startup file per stage (`.zshenv`, `.zprofile`, `.zshrc`, `.zlogin`), each loading the shared script with its stage
name.

## Methods

- `new ShellIntegrationFiles(dir, fsOps)`, `powershellScript()`, `bashInitFile()`, `zshDotDir()`.
- Static `shellQuote(text)`.
