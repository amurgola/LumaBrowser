import TestHarnessRenderer from './ui/TestHarnessRenderer.js';

const harness = new TestHarnessRenderer();

window.__ext_ext_test_harness = {
  activate: (context) => harness.activate(context),
  deactivate: () => harness.deactivate(),
};
