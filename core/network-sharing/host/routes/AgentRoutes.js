const path = require('path');

class AgentRoutes {
  constructor(auth, agents) {
    this._auth = auth;
    this._agents = agents;
  }

  mount(router) {
    const browser = this._auth.requireBrowserCredential({ as: 'text' });
    router.get('/agents', this._auth.requireToken, (req, res) => res.json({ agents: this._agents.list(req.sharingToken) }));
    router.get('/agents/chat-ui.js', browser, (req, res) => AgentRoutes._sendScript(res, this._agents.chatUi(req.sharingToken)));
    router.get('/agents/ui/:file', browser, (req, res) => AgentRoutes._sendScript(res, this._agents.chatUiAsset(req.params.file, req.sharingToken)));
    router.get('/chat/modes', this._auth.requireToken, (req, res) => res.json({ modes: this._agents.webModes(req.sharingToken) }));
  }

  static _sendScript(res, target) {
    if (!target.path) return res.status(target.status).send(target.message);
    res.type('application/javascript');
    return res.sendFile(path.basename(target.path), { root: path.dirname(target.path) });
  }
}

module.exports = AgentRoutes;
