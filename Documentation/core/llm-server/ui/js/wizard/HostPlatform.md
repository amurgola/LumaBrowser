# HostPlatform

`core/llm-server/ui/js/wizard/HostPlatform.js`

Renderer-side platform checks shared by the Setup panels: `isMacPlatform(nav?)` (navigator.platform; music and the music question) and `isMac(nav?)` (platform or user agent; the MLX search toggles).

## Globals

Reads `navigator` when no object is passed.
