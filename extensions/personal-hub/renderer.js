import HubRenderer from './ui/HubRenderer.js';

const renderer = new HubRenderer();

window.__ext_personal_hub = {
  activate: (context) => renderer.activate(context),
  deactivate: () => renderer.deactivate(),
};
