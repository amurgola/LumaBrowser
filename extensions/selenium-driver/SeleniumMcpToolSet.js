class SeleniumMcpToolSet {
  static NO_INPUT = { type: 'object', properties: {}, additionalProperties: false };

  static TOOLS = [
    {
      name: 'selenium_driver_status',
      description: 'Report whether the W3C WebDriver-compatible HTTP server is running, on which host/port, and with how many active Selenium sessions.',
      inputSchema: SeleniumMcpToolSet.NO_INPUT,
    },
    {
      name: 'selenium_driver_start',
      description: 'Start the W3C WebDriver HTTP server. Selenium clients can then connect to http://host:port (default 127.0.0.1:9515). Returns the bound port and URL prefix.',
      inputSchema: SeleniumMcpToolSet.NO_INPUT,
    },
    {
      name: 'selenium_driver_stop',
      description: 'Stop the WebDriver HTTP server and release all active Selenium sessions.',
      inputSchema: SeleniumMcpToolSet.NO_INPUT,
    },
  ];

  static handlerFor(api) {
    return async (toolName) => {
      const payload = await SeleniumMcpToolSet._run(api, toolName);
      return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
    };
  }

  static async _run(api, toolName) {
    if (toolName === 'selenium_driver_status') return api.status();
    if (toolName === 'selenium_driver_start') return api.start();
    if (toolName === 'selenium_driver_stop') return api.stop();
    throw new Error(`Unknown selenium-driver tool: ${toolName}`);
  }
}

module.exports = SeleniumMcpToolSet;
