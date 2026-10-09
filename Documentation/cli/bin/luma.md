# bin/luma

`cli/bin/luma.js`

The `luma` npm bin entry: runs [AgentCli](../lib/AgentCli.md)`.main(process.argv.slice(2))`, sets
the exit code it resolves and exits 50 ms later (so the last writes flush); an unexpected rejection
prints `luma: <message>` and exits 1.

The app's launcher (see [CliShim](../../core/shell/CliShim.md)) runs this file under the app binary
with `ELECTRON_RUN_AS_NODE=1`, so its path must stay `bin/luma.js`.
