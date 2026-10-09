# MusicInstallProgress

`core/llm-server/ui/js/music-setup/MusicInstallProgress.js`

Folds the music runtime's install events into the Runtime card's progress: start, resolved, download (bytes), extract (installing, keeping the last pip or uv output line), error (failed with message), finalize (null).

## Methods

- `MusicInstallProgress.next(previous, type, payload)`; `isTerminal(type)` (error and finalize end with a full refresh).

## Globals

None.
