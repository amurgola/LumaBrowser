# ProcessTreeKiller

`tools/crash/ProcessTreeKiller.js`

Stops the process tree of a child crash-repro spawned itself, identified by its PID: `taskkill /PID <pid> /T /F`
on Windows, `SIGKILL` to the child's process group on POSIX (falling back to the child alone). It never matches
processes by image name, so a user's running LumaBrowser, another agent's test instance or an IDE are never touched.

## Methods

- `ProcessTreeKiller.spawnOptions(platform)`: `{ detached: true }` on POSIX (the child leads its own group), `{}` on Windows.
- `ProcessTreeKiller.kill(child, { platform, run, signal })`: true when the stop was issued.
