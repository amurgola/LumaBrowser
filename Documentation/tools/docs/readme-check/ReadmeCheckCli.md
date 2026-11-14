# ReadmeCheckCli

`tools/docs/readme-check/ReadmeCheckCli.js`

The `node scripts/readme-check.js` command (`npm run readme:check [-- --max-words <n>] [files...]`). With no files
it checks `README.md` and every page in `Documentation/features`, prints one summary line per file and one indented
line per problem from [ReadmeCheck](ReadmeCheck.md), and exits 1 when there is any problem.

The word budget applies to the root `README.md` only. The feature pages are where the detail is meant to go, so
they are checked for links, images, anchors and dashes but not for length.

Run it before a release (the `new-build` skill does) and after editing the README.

## Methods

- `constructor({ log, rootDir })`: `log` defaults to `console.log`, `rootDir` to the repo root.
- `execute(argv)`: returns the exit code: 0 clean, 1 problems or a missing file, 2 bad options.
