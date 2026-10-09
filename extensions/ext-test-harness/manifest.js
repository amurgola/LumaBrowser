module.exports = {
  id: 'ext-test-harness',
  name: 'Test Harness',
  version: '1.0.0',
  description: 'In-app test runner for extension integration tests with full logging and result analysis',
  debugOnly: true,
  loadPriority: 200,

  dependencies: {
    required: {
      'core:llm-service': {
        slots: [
          { id: 'runner', label: 'Test Harness Runner Model', required: true }
        ]
      },
      'core:database': {
        tables: [
          { name: 'test_runs' },
          { name: 'test_run_logs' }
        ]
      },
      'core:browser': {
        reason: 'Execute browser automation during test runs',
        tools: ['navigate', 'create_tab', 'get_tabs', 'click', 'fill_form', 'press_key', 'scroll', 'get_source', 'screenshot', 'wait_for', 'get_element']
      }
    }
  },

  navigationBar: {
    label: 'Test Harness',
    tooltip: 'Test Harness',
    icon: 'flask',
    panel: {
      location: 'bottom-bar',
      htmlFile: './panel.html',
    }
  },

  settings: {
    label: 'Test Harness',
    tabId: 'ext-test-harness',
    htmlFile: './settings.html',
  },

  main: './main.js',
  renderer: './renderer.js',

  routes: {
    file: './routes.js',
    prefix: '/api/test-harness',
  },
};
