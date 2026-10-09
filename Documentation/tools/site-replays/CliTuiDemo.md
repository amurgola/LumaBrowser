# CliTuiDemo

`tools/site-replays/CliTuiDemo.js`

Runs the `luma` full-screen session ([App](../../cli/lib/tui/session/App.md)) in the real terminal against
[CliDemoLink](CliDemoLink.md), so its visuals can be checked without LumaBrowser running. Interactive: type, the
answers are canned. `--auto`: sends "fix the failing test", approves, and quits 1.6 s after the first turn ends.
`--reasoning` starts with the thinking unfolded (ctrl+o toggles it). `LUMA_CLI_THEME=light`, `NO_COLOR=1` and
`LUMA_CLI_ASCII=1` change the look. Thin entry: `scripts/cli-tui-demo.js`.

## Methods

- `execute(args, { cwd = process.cwd(), terminal })`: resolves the session's exit code; `terminal` is a test seam.
