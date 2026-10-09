# PythonPackageSpec

`core/music-server/runtimes/python-env/PythonPackageSpec.js`

Turns a catalog `pythonPackage` block into what the installer needs.

## Methods

- `PythonPackageSpec.requirement(pkg)`: `<name>==<version>`, or
  `<name> @ <sourceArchive.url>` when a `sourceArchive` is pinned.
- `PythonPackageSpec.label(pkg)`: the requirement, or
  `<name> <version>+git <first 7 of ref>` for a source archive.
- `PythonPackageSpec.resolvedEvent(pkg)`: the `resolved` install event payload
  `{ release: { tagName, name, publishedAt: null, url }, asset: { name, size: null } }`.
  The name ends in `(PyPI)` or `(source build)`; the url is the PyPI version page
  or the sglang-omni GitHub commit.
- `PythonPackageSpec.extras(pkg)`: a copy of `extraPackages` (or `[]`).

## Why

A `sourceArchive` overrides the wheel pin while the released wheel lacks the
model support the catalog promises (see
[MusicRuntimeCatalog](../MusicRuntimeCatalog.md)). The `resolved` payload has the
GitHub-release shape so the runtime card renders it unchanged. Extra packages
are undeclared runtime deps of the serve stack, such as `ninja` for flashinfer's
JIT compiles.
