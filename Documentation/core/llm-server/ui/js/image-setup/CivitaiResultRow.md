# CivitaiResultRow

`core/llm-server/ui/js/image-setup/CivitaiResultRow.js`

Pure HTML builders for the Browse CivitAI modal, in the shape of the LLM search rows and detail ([ModelSearchRow](../models/ModelSearchRow.md), [ModelSearchDetail](../models/ModelSearchDetail.md)); no DOM access, the modal binds the events.

## Methods

- `CivitaiResultRow.html(item)` the inner HTML of a `.ms-row` button for a `CivitaiSearchView` row: the thumbnail (or an empty block), the name with type and `adult` marks, a facts line with a verdict dot (green when the newest version installs, grey otherwise, the verdict as hover text) followed by the base and creator, and the abbreviated download and like counts.
- `detailHtml(detail, { busy? })` the right pane for a `CivitaiSearchView.detail`: the name with an open-on-CivitAI button (`data-href`), fact chips (type, base, creator, counts, adult), the safe sample images, a "Version" `<select class="img-civ-version" data-civ-model>` with the selected version's verdict badge (green or red dot plus text), the install bar (`installBarHtml`: file, size, the starting settings, the Install button `data-act="install"` with `data-model`, `data-version`, `data-file`, disabled while `busy`, or nothing for a version that cannot be installed), trigger words, the licence note, and the `.ms-card-md` slot the modal fills with the rendered page.
- For a LoRA version (`version.loraBase`) the bar is `loraBarHtml(detail, busy, { inLibrary, fits })` instead: file and size, an "Add to library" button (`data-act="install" data-kind="lora"`, disabled while `busy`; "In library" and disabled once the library holds that version), and `loraNote`: which installed models it fits (`Fits A, B, C and 2 more.` or `No SDXL model is installed yet.`) and where to attach it. `detailHtml` takes that state as `{ lora: { inLibrary, fits } }`.
- `verdictText(version)` `Installs as SDXL, Pony score tags · 6.46 GB SafeTensor`, or for a LoRA `Adds to the LoRA library for SDXL models · 218 MB SafeTensor`, with an early-access note, or the reason it cannot be installed. `dot(version)`, `badges(item)`, `versionLabel(version)`, `settingsText(defaults)` (`starts at 1024x1024 · 20 steps · cfg 6.5 · dpm++2m / karras`), `statusText(count, query)`, `count(n)` (`1.5k`, `12k`, `2.5M`).
- `BASE_LABELS`, `PROFILE_LABELS`: the import base ids and prompt profile ids in words.

## Why

Row and detail markup kept as pure functions is testable with a fragment and re-renderable when a version changes, and sharing the LLM search's classes means the two browsers read the same way.
