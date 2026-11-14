# PreferredImageRuntime

`core/image-server/service/PreferredImageRuntime.js`

Swaps the configured image runtime for one the model's catalog row prefers,
for one launch, when that runtime is installed, is a drop-in for the
configured one and is not older than the build the row says it needs.

## Methods

- `PreferredImageRuntime.pick({ model, configured, runtimes })` returns
  `{ runtime, note, error }`. Walks `model.preferredRuntimes` in order: a
  preferred id that is the configured one stops the search; one that is not an
  alias of the configured id (`interchangeable`) is skipped; one that is
  installed but whose release tag is older than `model.minRuntimeTags[id]` is
  skipped and named in the note (`runtime <id> <tag> skipped, older than the
  <minimum> this model needs`); the first that is `installed` with a
  `binaryPath` in `runtimes` (the detector's rows) and new enough is returned
  with the note `runtime <preferred> preferred over <configured>`. Otherwise
  the configured runtime stays. `error` is null unless the runtime that would
  launch is itself older than the row's minimum for it; then it is a plain
  refusal: `<model> needs the image runtime <name> <minimum> or newer, and the
  installed build is <tag>. Update the image runtime in Setup, Image, Image
  runtimes, then try again.` A null `configured` returns all three null.
- `PreferredImageRuntime.interchangeable(a, b)` is true when either id lists the
  other in [ImageModelRecord](../ImageModelRecord.md)`.RUNTIME_ALIASES`
  (upstream CUDA 12 and the LumaByte build).

Tags are compared by [RuntimeReleaseTag](RuntimeReleaseTag.md): a tag that is
missing (a manual or PATH binary) or cannot be parsed never blocks.

## Why

MiniMax-H3's video decode on upstream sd.cpp spends about 80 s of one CPU core
per 124 frames in a per-element temporal blend; the luma-sdcpp tensor patch
removes it (94 s to 20 s measured 2026-10-22). The user's runtime setting stays
untouched: a Vulkan or CPU choice is never moved onto CUDA, and the swap is
visible in the launch line ([ImageLaunchLog](ImageLaunchLog.md)).

The version check is ISSUES.md entry 11: installs fetch the latest release and
nothing pinned a version, so an `sd-cpp-luma` install from before `luma-b4`
was chosen for MiniMax-H3-Image and failed with a cryptic load error ("get sd
version from file failed"). Now an old install is skipped for the configured
runtime, and when it is the runtime that would launch, the launch is refused
with a message that says to update it.
