# LumabyteFiles

`extensions/desktop-integration/features/lumabyte/LumabyteFiles.js`

Lumabyte reading files when asked ("summarize Andy.md"): the `read` action of
[LumabyteActions](LumabyteActions.md). It needs no desktop control and is
switched by the `files` setting.

- `folderOf(hwnd, { exe, title })` -> `{ folder, selected }` or null. Only for
  File Explorer on Windows: one PowerShell call (`FOLDER_SCRIPT`, encoded) walks
  `Shell.Application.Windows()` for the window's HWND. With tabs, several share
  the HWND and the one whose name starts the title wins. Virtual folders (This
  PC) and failures give null. About half a second per look.
- `resolve(target, folder)` -> `{ path }` or `{ error }`: a bare name joins the
  open folder; device and network paths are refused
  (`FileSelection.pathProblem`).
- `read(target, { folder })` -> `{ ok, name, text }` or `{ ok: false, error }`.
  `text` starts with a header (`[File <path>, <size>]` or
  `[Folder <path>: <n> items]`):
  - text and code: the first `READ_BYTES` (256 KB) as UTF-8, cut at
    `TEXT_CHARS` (40000) with a note;
  - PDFs (up to 20 MB): through `AttachmentPdfText`;
  - images and binaries (a NUL byte in the first 8 KB): named, not read;
  - folders: folders first, then files with size and modified date, up to
    `LIST_MAX` (200).
