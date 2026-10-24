import DesktopRenderer from './ui/DesktopRenderer.js';

const renderer = new DesktopRenderer();

window.__ext_desktop_integration = {
  activate: (context) => renderer.activate(context),
  deactivate: () => renderer.deactivate(),
};
