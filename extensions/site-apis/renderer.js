import SiteApisRenderer from './ui/SiteApisRenderer.js';

const renderer = new SiteApisRenderer();

window.__ext_site_apis = {
  activate: (context) => renderer.activate(context),
  deactivate: () => renderer.deactivate(),
};
