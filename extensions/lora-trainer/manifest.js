module.exports = {
  id: 'lora-trainer',
  name: 'LoRA Trainer',
  version: '1.0.0',
  description:
    'Train a LoRA of a character, object or style from your own pictures for an installed image model, then '
    + 'apply it to image models of the same family. Uses the open-source ai-toolkit trainer (MIT) in its own '
    + 'Python environment, downloaded on first use. Needs an NVIDIA GPU.',

  dependencies: {},

  main: './main.js',

  mcpTools: {
    file: './mcp-tools.js',
  },
  distributable: true,
};
