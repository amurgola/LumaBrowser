const LoraTrainerTools = require('./LoraTrainerTools');

const trainerTools = new LoraTrainerTools();

module.exports = {
  tools: LoraTrainerTools.TOOLS,
  handler: (toolName, args) => trainerTools.handle(toolName, args),
  bind: (services) => trainerTools.bind(services),
};
