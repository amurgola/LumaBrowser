# BasaltPythonFinder

`extensions/basalt-runtime/BasaltPythonFinder.js`

Finds a Python that can build Basalt's server venv.

## Methods

- `new BasaltPythonFinder({ platform?, exec? }).find()` resolves
  `{ command, args, version }` for the first candidate that prints a version
  from 3.10 to 3.13 with `venv` and `ensurepip` importable, or throws a
  `RuntimeInstallError` with code `PYTHON_NOT_FOUND` and a platform message
  that says what to install. `exec` defaults to core `PythonEnvShell.exec`.
- Candidates (`CANDIDATES`): Windows `py -3.12`, `py -3.11`, `py -3.10`,
  `py -3.13`, then `python`, `python3`; Linux `python3.12`, `python3.11`,
  `python3.10`, `python3.13`, then `python3`. Each runs with `-I -c PROBE_CODE`.
- `parseVersion(stdout)`, `inRange(version)`.

## Why

Upstream asks for Python 3.10+; 3.12 is the version the release's requirements
were installed with on Windows (2026-11-21), and 3.14, the default `py` on that
PC, was not tried, so the range stops at 3.13. The probe imports `ensurepip`
because Debian splits it into `python3-venv`, without which `-m venv` fails
later. The probe code uses single quotes only so no escaped double quotes cross
the Windows command line.
