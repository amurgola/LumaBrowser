# FrameworkFrameHtml

`core/llm-server/ui/js/setup-ui/frameworks/FrameworkFrameHtml.js`

One installed framework in the Frameworks card (`<section class="fw-frame" data-framework="<id>">`): a heading line, an Options fold and a Builds fold. Frames are parted by a `--border-soft` hairline and spacing, never boxed.

## Methods

- `FrameworkFrameHtml.html(group, framework, context)`: `group` is `{ id, name, rows }` from [FrameworksCardHtml](FrameworksCardHtml.md)`.groups`, `framework` its [FrameworkStore](FrameworkStore.md) entry (or null), `context` `{ rows, prefs, npuNames, advice, currentFrameworkId }`.
- `headHtml(group, fw, inUse)`: the name, "Loads GGUF models" ([FormatLabels](FormatLabels.md)), the plain "In use" chip (`.fold-chip.is-current`) on the framework that serves the default model, and the build.
- `buildControl(group, fw)`: with two or more installed builds a select (`data-fw-active-build="<id>"`, the active build selected); with one, its name as text; with none, nothing.
- The Options fold (`data-fold-key="llm.fw.<id>.options"`, closed by default, chips from [FrameworkOptionChips](FrameworkOptionChips.md)) draws [FrameworkOptionRows](FrameworkOptionRows.md); a framework with nothing to draw has no fold.
- The Builds fold (`data-fold-key="llm.fw.<id>.builds"`, closed by default) lists every build with [RuntimeRowHtml](../runtimes/RuntimeRowHtml.md): installed first in catalog order, then the rest by [HostRuntimeAdvice](../runtimes/HostRuntimeAdvice.md)`.sortRows`, so install, update, reinstall, uninstall, relocate and the progress strip work unchanged.
- `buildsMeta(installed, total, updateAvailable)`: "2 of 9 installed", plus ", update available" (written by [RuntimesCard](../runtimes/RuntimesCard.md) once the upstream check knows), so a closed fold still says there is work in it.

## Why

A framework has several builds but only one runs; one build installed means nothing to choose, so a single-build user sees one short line and two closed folds.
