# ProcessControl

`core/shell/shellClassifier/rules/system/ProcessControl.js`

[HostCapability](HostCapability.md) for process kills (see [KillRequest](KillRequest.md)).

- Forbidden: everything (`kill -1`, a catch-all pattern), every process of a user (`pkill -u X` with no name), or an
  OS process: pid 1 on POSIX, 0 or 4 on Windows, or init, systemd, launchd, kernel_task, WindowServer, loginwindow,
  csrss, wininit, winlogon, lsass, smss, services, svchost.
- Mass-destructive: a hard kill of this app's runtimes, shells or desktop (node, electron, lumabrowser, python, java,
  shells, conhost, explorer, dwm, Finder, Dock), a wildcard name, `/F /T` trees, `/F /FI` filters, or a POSIX process
  group (`kill 0`, `kill -N`).
- Otherwise no opinion: a graceful `pkill node` or a single pid is ordinary.
