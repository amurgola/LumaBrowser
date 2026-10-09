# ToolCardPresenter

`core/llm-server/chat/presentation/ToolCardPresenter.js`

Base class for tool-card presenters used by
[ToolPresentation](../ToolPresentation.md). All members are static.

## Methods

- `static KIND`: the card kind stored in the metadata (`diff`, `read`).
- `static present(args, result)`: card metadata or `null`. Must be pure and
  bounded. The base throws `<Class> must implement present`.
- `static validate(meta)`: the validated metadata, or `undefined`. Called only
  with a plain object whose `kind` is this presenter's. The base throws.
- Protected helpers: `_failed(result)` (missing, `ok: false` or
  `success: false`), `_pathOf(args, result)` (`result.path`, else
  `args.path`, else `args.file_path`), `_isNonEmptyString(value)`.

## Implementations

- [DiffCardPresenter](DiffCardPresenter.md)
- [ReadCardPresenter](ReadCardPresenter.md)
