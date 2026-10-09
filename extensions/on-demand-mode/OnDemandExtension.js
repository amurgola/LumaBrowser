const path = require('path');
const OnDemandKnowledgeBase = require('./OnDemandKnowledgeBase');
const OnDemandMode = require('./OnDemandMode');

class OnDemandExtension {
  static DOCS_DIR = path.join(__dirname, 'docs');

  async activate(context) {
    const knowledgeBase = new OnDemandKnowledgeBase();
    const seededDocs = knowledgeBase.seed(OnDemandExtension.DOCS_DIR);
    context.chat.registerMode(new OnDemandMode(knowledgeBase).descriptor());
    return { modeId: OnDemandMode.MODE_ID, kbScope: OnDemandKnowledgeBase.SCOPE, seededDocs };
  }

  async deactivate() {}
}

module.exports = OnDemandExtension;
