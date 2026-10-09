# GpuCard

`core/llm-server/ui/js/setup-ui/diagnostics/GpuCard.js`

The Server Info "GPU" card: every adapter Chromium reports with VRAM, driver and PCIe link, then the adapter health block (in every branch, since a faulted card is when Chromium reports nothing).

## Methods

- `GpuCard.render(doc, gpu)`; `GpuCard.pillText(gpu, adapters)`.

## Globals

Reads `document` by id.
