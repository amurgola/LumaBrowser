const NarratorContext = require('./NarratorContext');

class NarratorPrompt {
  static build(data) {
    return NarratorContext.build(data).contextText;
  }
}

module.exports = NarratorPrompt;
