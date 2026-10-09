class ForgeToolDefinitions {
  static RUN_CONTRACT =
    'The code MUST declare `async function run(args, ctx)` and return JSON-compatible data. '
    + 'It runs in a locked-down sandbox: NO require, no Node APIs, no filesystem, no DOM. '
    + 'The only I/O is via ctx: '
    + '`ctx.fetch(url, {method, headers, body})` → `{status, headers, body}` (body is a string; JSON.parse it yourself); '
    + '`ctx.luma.fetchPage({url, mode})` returns a page as markdown/text/html for scraping; '
    + '`ctx.luma.openTab({url})` opens a real browser tab for the user. '
    + 'Network is limited to the hosts you list in allowedHosts. '
    + 'Read secrets/keys from `ctx.config.<key>`: NEVER hardcode them; declare them as configSlots with secret:true.';

  static CREATE_TOOL = {
    name: 'create_tool',
    description:
      'Define (or redefine) a new custom chat tool as sandboxed JavaScript. '
      + 'FIRST gather the spec from the user in conversation: what the tool does, its inputs, which API it calls, and what config/keys it needs. '
      + 'If it calls an external API, use web_search to confirm the real endpoint, auth, and response shape before writing code (do not guess API details). '
      + 'Then submit the tool here. This saves a DRAFT; it does not publish. ' + ForgeToolDefinitions.RUN_CONTRACT
      + ' After creating, call test_tool to verify it actually works, then publish_tool. '
      + 'To fix or change an existing draft, call create_tool again with the SAME name (the result lists your other tools); never invent a second name for the same tool.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Unique tool name: lowercase letters, digits, underscores (e.g. github_stars). 3-41 chars.' },
        label: { type: 'string', description: 'Optional short human label for the settings toggle.' },
        description: { type: 'string', description: 'What the tool does and when to use it: this is what the AI reads to decide to call it. Be specific.' },
        inputSchema: {
          type: 'object',
          description: 'JSON Schema (type:"object") for the tool arguments: properties + required. Keep it minimal.',
        },
        configSlots: {
          type: 'array',
          description: 'Named config the tool reads from ctx.config (API keys, base URLs, account ids). The user fills these later in Setup → My Tools.',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Identifier read as ctx.config.<key>' },
              label: { type: 'string', description: 'Human label' },
              description: { type: 'string', description: 'What to enter' },
              required: { type: 'boolean', description: 'Tool cannot run without it' },
              secret: { type: 'boolean', description: 'true for keys/tokens, stored encrypted, redacted from results' },
            },
            required: ['key'],
          },
        },
        allowedHosts: {
          type: 'array',
          description: 'Hostnames the tool may reach (e.g. ["api.github.com"]). A host also covers its subdomains. Empty = no network. Keep it minimal.',
          items: { type: 'string' },
        },
        code: { type: 'string', description: 'The tool source. Must declare async function run(args, ctx).' },
      },
      required: ['name', 'description', 'code'],
    },
  };

  static TEST_TOOL = {
    name: 'test_tool',
    description:
      'Run a draft tool once in the sandbox with sample arguments and return its result, so you (and the user) can confirm it works BEFORE publishing. '
      + 'A tool must pass a test on its current code before publish_tool will accept it. '
      + 'If the tool declares config (an API key etc.) and the user has given you the value, pass it as configOverrides: '
      + 'the overrides a PASSING test ran with are saved as the tool\'s config when you publish, so the user never has to enter them again. '
      + 'A placeholder value only proves the request reaches the API; it will not pass.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The draft tool to test (the exact name you gave create_tool).' },
        args: { type: 'object', description: 'Representative arguments matching the tool inputSchema.' },
        configOverrides: { type: 'object', description: '{key:value} config for this run (e.g. the real API key the user gave you). Saved with the tool on publish if this test passes.' },
      },
      required: ['name'],
    },
  };

  static PUBLISH_TOOL = {
    name: 'publish_tool',
    description:
      'Publish a tested draft so it becomes a real chat tool. Refused unless the current code has a passing test_tool run. '
      + 'Publishing ENABLES the tool immediately (globally and in this chat) and you can call it by name right away, in this same turn. '
      + 'Config from the passing test is saved with it. Do NOT tell the user to enable it in the gear panel; '
      + 'only mention Setup → My Tools if the result reports missingConfig.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The draft tool to publish.' },
      },
      required: ['name'],
    },
  };

  static TOOLS = [ForgeToolDefinitions.CREATE_TOOL, ForgeToolDefinitions.TEST_TOOL, ForgeToolDefinitions.PUBLISH_TOOL];
}

module.exports = ForgeToolDefinitions;
