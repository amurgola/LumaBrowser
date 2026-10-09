# LauncherCli

`cli/lib/launcher/LauncherCli.js`

`npx lumabrowser [command]`.

## Methods

- `LauncherCli.main(argv)`: dispatches; any error prints `lumabrowser: <message>` in red and exits 1.
- `new LauncherCli({ out?, installer? })`: a [ConsoleOutput](ConsoleOutput.md) and an
  [AppInstaller](AppInstaller.md) (seams for tests).
- `dispatch([command, ...args])`, default command `start`:
  - `start`: launches the installed build ([InstallRecord](../connect/InstallRecord.md)), installing it
    first when missing, with the remaining args ([AppProcess](../connect/AppProcess.md));
  - `agent ...`: hands the rest to [AgentCli](../AgentCli.md) and sets the exit code;
  - `install`; `update` / `upgrade` (forced download);
  - `uninstall` / `remove`: deletes `~/.lumabrowser`;
  - `version` / `--version` / `-v`: the install record, or how to install;
  - `help` / `--help` / `-h`, or an unknown command (warned first): the help text.
- `start(args)`, `uninstall()`, `version()`, `help()`.
