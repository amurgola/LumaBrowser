const OnDemandExtension = require('./OnDemandExtension');
const OnDemandMode = require('./OnDemandMode');
const OnDemandKnowledgeBase = require('./OnDemandKnowledgeBase');

const extension = new OnDemandExtension();

module.exports = {
  MODE_ID: OnDemandMode.MODE_ID,
  KB_SCOPE: OnDemandKnowledgeBase.SCOPE,
  ALLOWED_TOOLS: OnDemandMode.ALLOWED_TOOLS,
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
