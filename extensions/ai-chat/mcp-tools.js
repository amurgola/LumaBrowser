module.exports = {
  tools: [
    {
      name: 'ai_chat_run',
      description: 'Run a headless AI agent that autonomously performs browser tasks. Give it a natural language prompt and it will navigate, click, fill forms, and extract data using an agentic tool-call loop. Returns a summary, the final response, tool call log, and optionally a screenshot.',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Natural language task description (e.g., "Go to example.com and get the page title")',
          },
          tabId: {
            type: 'number',
            description: 'Use an existing browser tab by ID. If omitted, a new tab is created.',
          },
          autoCloseTab: {
            type: 'boolean',
            description: 'Close the tab after completion (default: true). Only closes tabs that were auto-created.',
          },
          includeScreenshot: {
            type: 'boolean',
            description: 'Capture a base64 PNG screenshot of the final page state (default: false)',
          },
          maxIterations: {
            type: 'number',
            description: 'Maximum agent loop iterations (default: 15)',
          },
          timeout: {
            type: 'number',
            description: 'Maximum total execution time in milliseconds (default: 300000)',
          },
          tools: {
            type: 'array',
            items: { type: 'string' },
            description: 'Restrict available tools to this list (e.g., ["navigate", "get_source", "screenshot"] for read-only). If omitted, all tools are available.',
          },
          systemPromptAppend: {
            type: 'string',
            description: 'Extra instructions appended to the system prompt for this run (e.g., "Always return data as JSON")',
          },
        },
        required: ['prompt'],
      },
    },
  ],

  handler: null,
};
