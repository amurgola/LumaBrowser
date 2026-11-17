const LoraTrainerTools = require('./LoraTrainerTools');

const trainerTools = new LoraTrainerTools();

module.exports = {
  tools: LoraTrainerTools.TOOLS,
  handler: (toolName, args, opts) => trainerTools.handle(toolName, args, opts),
  bind: (services) => trainerTools.bind(services),
};
