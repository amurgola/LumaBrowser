import PageMonitorsRenderer from './ui/PageMonitorsRenderer.js';

const renderer = new PageMonitorsRenderer();

window.__ext_page_change_detector = {
  activate: (context) => renderer.activate(context),
  deactivate: () => renderer.deactivate(),
};
