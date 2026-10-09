# SetupClickRouter

`core/llm-server/ui/js/setup-ui/SetupClickRouter.js`

One delegated click, change and keydown listener on the document body for every control the Setup cards re-render, so bindings survive every innerHTML repaint. The runtime-row collapse also serves the Image and Music runtime rows.

## Methods

- `new SetupClickRouter(ctx, { rows, hostFixes, rename, runtimeActions, modelSearch })`; `start()` binds the three listeners on `document.body`.
- `onClick(target)`, in legacy order: Defaults help toggles, host fixes (`data-fix-path`, `data-recover-gpu`, `data-aspm-off`, `data-copy-cmd`, `data-dismiss-hint`), `data-open-model-search`, `data-pick-dir`, `data-reset-dir`, fit test (`data-fit-test`, `data-fit-cancel`, `data-fit-use`), gambit (`data-gam-test`, `data-gam-cancel`, `data-gam-download`), `data-runtime-action`, rename, then `.runtime-head` toggles `.collapsed` on its `.runtime-row`.
- `onChange(target)`: `#modelsPathInput` commits the models directory.
- `onKeydown(event)`: Enter in `#modelsPathInput` blurs (the change handler commits once); Enter in a rename input clicks Save.

## Globals

Listens on `document.body`.
