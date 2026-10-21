const main = require('./main.js');

module.exports = () => {
  const descriptor = typeof main.builderDescriptor === 'function' ? main.builderDescriptor() : null;
  return descriptor ? [descriptor] : [];
};
