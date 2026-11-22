# BasaltVenv

`extensions/basalt-runtime/BasaltVenv.js`

Builds the `.venv` that `basalt serve` runs its Python server from.

## Methods

- `new BasaltVenv({ layout, python, emit, canceled, run? }).create()`: removes
  any old `.venv`, runs `<python> -I -m venv <archive>/.venv`, then
  `<venv python> -I -m pip install --disable-pip-version-check -r <archive>/requirements.txt`,
  both through core `PythonEnvShell.streamCommand` (no shell, cwd the archive
  folder, streamed lines as `extract` progress events; 5 and 30 minute
  timeouts). Errors: `CANCELED`, `VENV_FAILED`, `PIP_INSTALL_FAILED` with the
  output tail.

## Why

Upstream's Windows recipe is `py -3 -m venv .venv` then
`.venv/Scripts/pip install -r requirements.txt`; `python -m pip` is the same
pip without relying on the launcher script. `-I` keeps the current folder and
`PYTHON*` variables off `sys.path`, so nothing in the extracted archive is
imported by the installer's own Python runs. No bash: Basalt runs natively on
Windows.
