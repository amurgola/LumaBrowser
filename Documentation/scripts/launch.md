# Development launcher

`scripts/launch.js`

Entry point for `npm start`, `npm run dev`, `npm run dev:trace`, and
`npm run start:hidden`. On macOS, prepares a branded development bundle through
[MacDevApp](MacDevApp.md). Other platforms use the installed Electron executable.

Launches the repository root with all supplied arguments and inherited stdio.
Forwards SIGINT, SIGTERM and SIGUSR2; propagates child exit status and reports
preparation/spawn failures. Does not alter the application name setting or data
paths, so existing models, chats and profiles are retained.
