# ImageSetupStore

`core/llm-server/ui/js/image-setup/ImageSetupStore.js`

The Image Setup panel's last-known state and its best-effort loaders: a failed or missing IPC leaves a safe empty value.

## Methods

- Fields: `runtimes`, `models` (scan plus `config`), `catalog`, `defaults`, `server`, `enabled`, `downloadError` (sticky banner), `autoUnloadMs`, `ramPinStatus`, `vramBytes` (null = unknown), `activeDl`, `runtimeInstallProgress` (id to slot), `runtimeUpdateInfo` (Map).
- `loadEnabled()`, `loadRuntimes({ force }?)`, `loadModels()`, `loadCatalog()`, `loadDefaults()` (also the auto-unload ms and the RAM-pin status), `loadServer()`, `loadVram()` (`getDiagnostics` budget.vram.maxBytes), `loadRamPinStatus()` (resolves the status or null).
- `installedModels()`, `runtimeList()`, `findModel(id)`.

## Globals

None.
