const BuildHooks = require('../tools/build/BuildHooks');

exports.onNodeModuleFile = (filePath) => BuildHooks.onNodeModuleFile(filePath);
