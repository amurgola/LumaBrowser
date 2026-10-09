const express = require('express');
const GrantableTools = require('./GrantableTools');
const AgentKnowledgeBase = require('./AgentKnowledgeBase');
const AgentSseChat = require('./AgentSseChat');

module.exports = function createRoutes(context) {
  const router = express.Router();
  const api = () => context.extensionApi;
  const store = () => api().getStore();
  const knowledge = new AgentKnowledgeBase();
  const sendError = (res, status, e) => res.status(status).json({ success: false, error: e.message });

  const withAgent = (fn) => (req, res) => {
    const agent = store().get(req.params.id);
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });
    return fn(agent, req, res);
  };

  router.get('/agents', (req, res) => {
    try { res.json({ success: true, agents: store().list() }); } catch (e) { sendError(res, 500, e); }
  });

  router.post('/agents', (req, res) => {
    try { res.status(201).json({ success: true, agent: api().createAgent(req.body || {}) }); } catch (e) { sendError(res, 400, e); }
  });

  router.put('/agents/:id', (req, res) => {
    try { res.json({ success: true, agent: store().update(req.params.id, req.body || {}) }); } catch (e) { sendError(res, 400, e); }
  });

  router.delete('/agents/:id', (req, res) => {
    try { res.json({ success: true, removed: api().deleteAgent(req.params.id) }); } catch (e) { sendError(res, 400, e); }
  });

  router.get('/tools', (req, res) => {
    try { res.json({ success: true, groups: GrantableTools.groups() }); } catch (e) { sendError(res, 500, e); }
  });

  router.get('/agents/:id/export', withAgent((agent, req, res) => {
    try {
      const bundle = api().exportAgentBundle(agent.id);
      res.setHeader('Content-Disposition', `attachment; filename="${agent.name.replace(/[^\w.-]+/g, '_')}.agent.json"`);
      res.json(bundle);
    } catch (e) { sendError(res, 500, e); }
  }));

  router.post('/agents/import', (req, res) => {
    try {
      const { agent, warnings, kb } = api().importAgentBundle(req.body || {});
      res.status(201).json({ success: true, agent, warnings, kb });
    } catch (e) { sendError(res, 400, e); }
  });

  router.get('/agents/:id/kb', withAgent((agent, req, res) => {
    try { res.json({ success: true, documents: knowledge.documents(agent.id) }); } catch (e) { sendError(res, 500, e); }
  }));

  router.post('/agents/:id/kb', withAgent(async (agent, req, res) => {
    if (!knowledge.ragService()) return res.status(503).json({ success: false, error: 'The knowledge base service is not available' });
    const body = req.body || {};
    const paths = Array.isArray(body.paths) ? body.paths : (body.path ? [body.path] : []);
    if (!paths.length) return res.status(400).json({ success: false, error: 'paths is required' });
    try {
      const results = await knowledge.ingest(agent.id, paths);
      return res.json({ success: true, results, documents: knowledge.documents(agent.id) });
    } catch (e) { return sendError(res, 500, e); }
  }));

  router.delete('/agents/:id/kb/:docId', withAgent((agent, req, res) => {
    if (!knowledge.ragService()) return res.status(503).json({ success: false, error: 'The knowledge base service is not available' });
    try {
      return res.json({ success: true, documents: knowledge.removeDocument(agent.id, req.params.docId) });
    } catch (e) {
      return sendError(res, /not found/i.test(e.message) ? 404 : 500, e);
    }
  }));

  router.post('/agents/:id/chat', withAgent((agent, req, res) => new AgentSseChat((opts) => api().runTurn(opts)).respond(agent, req.body || {}, req, res)));

  return router;
};
