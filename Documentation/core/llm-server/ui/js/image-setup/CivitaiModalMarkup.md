# CivitaiModalMarkup

`core/llm-server/ui/js/image-setup/CivitaiModalMarkup.js`

`CivitaiModalMarkup.HTML`: the static markup of the Browse CivitAI modal, the same two-pane `.ms-*` shell as the LLM Search models modal. Left pane: the search box (`#civQuery`, a query or a pasted model URL) with the sort (`#civSort`), a second bar with the type (`#civType`), base group (`#civBase`) and Adult (`#civNsfw`) controls, the `[data-civ="status"]` line, the `.img-modal-err` error line (hidden while empty), the `[data-civ="results"]` list, the `[data-civ="more"]` footer and the API key fold (`#civToken`, Save, Clear, the `[data-civ="key-state"]` summary). Right pane: `[data-civ="detail"]`, holding `EMPTY_DETAIL` until a model is picked. Styled by the shared `.ms-*` rules plus the `.ms-row-civ`, `.ms-thumb`, `.ms-samples`, `.ms-key` and `.ms-more` additions in `setup.css`.
