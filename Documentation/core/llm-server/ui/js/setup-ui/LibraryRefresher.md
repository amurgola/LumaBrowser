# LibraryRefresher

`core/llm-server/ui/js/setup-ui/LibraryRefresher.js`

Repaints the installed lists and the Defaults pickers after anything adds or removes a model or runtime. Completion signals land back to back, so they coalesce into one pass 250 ms later.

## Methods

- `request({ runtimes }?)`: schedules one pass (runtimes view first when any request asked for it), then the models card, then the Defaults card. A transient IPC failure is ignored; the next signal retries.

## Globals

None.
