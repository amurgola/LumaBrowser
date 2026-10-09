# ReadmeRenderer

`core/llm-server/ui/js/models/ReadmeRenderer.js`

Escape-first renderer for REMOTE, UNTRUSTED Hugging Face model cards shown in the privileged LLM tab. Recognised HTML (tables, headings, links, emphasis) is rebuilt as our own markup and parked in a [ReadmeVault](ReadmeVault.md); everything else is escaped. Links are inert `.ms-link` spans with `data-href` (opened through `openExternal` by ModelSearch); images degrade to their alt text.

## Methods

- `ReadmeRenderer.render(source)` returns safe HTML, or `<div class="ms-dim">No model card.</div>`. Order: fenced code vaulted first, then HTML tables ([ReadmeHtmlTable](ReadmeHtmlTable.md)), HTML headings, noise tags dropped (`img`, `source`, `picture`, `figure` removed; wrapper tags keep their text; `<br>` becomes a newline), then the block pass ([ReadmeBlocks](ReadmeBlocks.md)) and the vault restore.

## Globals

None.
