# renderer

`extensions/site-apis/renderer.js`

Renderer entry of Site APIs, loaded by the shell as a module script (the extension is bundled and not
distributable, so `RendererScriptLoader.mode` picks MODULE). Registers `window.__ext_site_apis`
(`activate(context)`, `deactivate()`) over one [SiteApisRenderer](ui/SiteApisRenderer.md) instance.
