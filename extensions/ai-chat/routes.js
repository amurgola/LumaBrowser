const express = require('express');
const AiChatAgentFactory = require('./AiChatAgentFactory');
const AiChatRunRequest = require('./AiChatRunRequest');

module.exports = function createRoutes(context) {
  const router = express.Router();
  const runner = AiChatAgentFactory.create(context);

  router.post('/run', async (req, res) => {
    const body = req.body || {};
    if (!AiChatRunRequest.isValidPrompt(body.prompt)) {
      return res.status(400).json({ success: false, error: 'prompt is required and must be a string' });
    }
    try {
      const result = await runner.run(AiChatRunRequest.toRunOptions(body, AiChatRunRequest.REST_TIMEOUT_MS));
      if (result.error) return res.status(500).json({ success: false, error: result.error, ...result });
      return res.json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
