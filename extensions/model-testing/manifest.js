module.exports = {
  id: 'model-testing',
  name: 'Model Testing',
  version: '1.0.0',
  description:
    'Test what a downloaded LLM model can do. Pick a model and the tests to run from the "Model testing" tab in '
    + 'the LLM Setup area. Ships with the LumaBrowser compatibility gambit, which grades a model on the real job: '
    + 'following instructions, conversation, driving the browser, picking tools, correct answers, building '
    + 'artifacts and finishing a turn without looping.',

  distributable: true,

  dependencies: {},

  main: './main.js',

  setupTab: {
    id: 'model-testing',
    label: 'Model testing',
    group: 'developer',
    file: './setup-ui.js',
    assets: ['./setup-ui.css'],
  },
};
