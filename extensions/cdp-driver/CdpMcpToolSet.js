class CdpMcpToolSet {
  static NO_INPUT = { type: 'object', properties: {}, additionalProperties: false };

  static TOOLS = [
    {
      name: 'cdp_driver_status',
      description: 'Report whether the CDP WebSocket server is running, on which host/port, and with how many active sessions/targets. Any CDP client (Puppeteer, Playwright via connectOverCDP, chrome-remote-interface, Playwright MCP) connects to this endpoint.',
      inputSchema: CdpMcpToolSet.NO_INPUT,
    },
    {
      name: 'cdp_driver_start',
      description: 'Start the CDP WebSocket server. Once running, connect from Puppeteer via `puppeteer.connect({ browserURL: "http://host:port" })`, from Playwright via `chromium.connectOverCDP("http://host:port")`, or from any other CDP client (default 127.0.0.1:9222).',
      inputSchema: CdpMcpToolSet.NO_INPUT,
    },
    {
      name: 'cdp_driver_stop',
      description: 'Stop the CDP server, close all automation-owned tabs, and release all active sessions.',
      inputSchema: CdpMcpToolSet.NO_INPUT,
    },
  ];

  static handlerFor(api) {
    return async (toolName) => {
      const payload = await CdpMcpToolSet._run(api, toolName);
      return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
    };
  }

  static async _run(api, toolName) {
    if (toolName === 'cdp_driver_status') return api.status();
    if (toolName === 'cdp_driver_start') return api.start();
    if (toolName === 'cdp_driver_stop') return api.stop();
    throw new Error(`Unknown cdp-driver tool: ${toolName}`);
  }
}

module.exports = CdpMcpToolSet;
