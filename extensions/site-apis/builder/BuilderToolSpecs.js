const StepKinds = require('../spec/StepKinds');

class BuilderToolSpecs {
  static LIST_PERSISTED_TABS = 'list_persisted_tabs';
  static USE_TAB = 'use_tab';
  static DEFINE_SITE = 'define_site';
  static DEFINE_ENDPOINT = 'define_endpoint';
  static COMPILE_ENDPOINT = 'compile_endpoint';
  static SET_STEPS = 'set_steps';
  static GET_ENDPOINT = 'get_endpoint';
  static TEST_ENDPOINT = 'test_endpoint';
  static SAVE_ENDPOINT = 'save_endpoint';
  static LIST_ENDPOINTS = 'list_endpoints';

  static NAMES = Object.freeze([
    BuilderToolSpecs.LIST_PERSISTED_TABS, BuilderToolSpecs.USE_TAB, BuilderToolSpecs.DEFINE_SITE,
    BuilderToolSpecs.DEFINE_ENDPOINT, BuilderToolSpecs.COMPILE_ENDPOINT, BuilderToolSpecs.SET_STEPS,
    BuilderToolSpecs.GET_ENDPOINT, BuilderToolSpecs.TEST_ENDPOINT, BuilderToolSpecs.SAVE_ENDPOINT,
    BuilderToolSpecs.LIST_ENDPOINTS,
  ]);

  static UNBOUND_NAMES = Object.freeze([BuilderToolSpecs.LIST_PERSISTED_TABS, BuilderToolSpecs.USE_TAB]);

  static PARAM_SCHEMA = Object.freeze({
    type: 'array',
    description: 'The endpoint parameters. Each: { name (snake_case), type (string|number|boolean), required, description, default?, example }. Always give an example: the demonstration uses it and compile_endpoint turns it into the {{name}} placeholder.',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['string', 'number', 'boolean'] },
        required: { type: 'boolean' },
        description: { type: 'string' },
        default: { description: 'Value used when the caller omits the param' },
        example: { description: 'The value used in the demonstration' },
      },
      required: ['name'],
    },
  });

  static all() {
    return [
      BuilderToolSpecs.listPersistedTabs(), BuilderToolSpecs.useTab(), BuilderToolSpecs.defineSite(),
      BuilderToolSpecs.defineEndpoint(), BuilderToolSpecs.compileEndpoint(), BuilderToolSpecs.setSteps(),
      BuilderToolSpecs.getEndpoint(), BuilderToolSpecs.testEndpoint(), BuilderToolSpecs.saveEndpoint(),
      BuilderToolSpecs.listEndpoints(),
    ];
  }

  static listPersistedTabs() {
    return {
      name: BuilderToolSpecs.LIST_PERSISTED_TABS,
      description: 'List the user\'s persisted (kept signed-in) browser tabs: tabId, partition, origin, url, title. A Site API is built on one of them; call this when the conversation is not bound to a site yet.',
      inputSchema: { type: 'object', properties: {} },
    };
  }

  static useTab() {
    return {
      name: BuilderToolSpecs.USE_TAB,
      mutating: true,
      sandboxed: true,
      description: 'Bind this conversation to a persisted tab (from list_persisted_tabs): the site record is created for its partition and origin and a work tab in the same session opens on the next turn. After it answers, end your reply and tell the user to continue.',
      inputSchema: {
        type: 'object',
        properties: { tabId: { type: 'number', description: 'The persisted tab id' } },
        required: ['tabId'],
      },
    };
  }

  static defineSite() {
    return {
      name: BuilderToolSpecs.DEFINE_SITE,
      mutating: true,
      sandboxed: true,
      description: 'Update the site record: its display name, start URL and login rules. login.required says whether calls need a session; signInUrlPatterns are URL substrings (or /regex/) that mean "signed out"; signedInSelector and signedOutSelector are CSS selectors whose presence after a navigation means signed in or out. Only pass what changes.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Display name, also the base of the tool name prefix' },
          startUrl: { type: 'string', description: 'The URL every endpoint starts from' },
          login: {
            type: 'object',
            properties: {
              required: { type: 'boolean' },
              signInUrlPatterns: { type: 'array', items: { type: 'string' } },
              signedInSelector: { type: 'string' },
              signedOutSelector: { type: 'string' },
            },
          },
        },
      },
    };
  }

  static defineEndpoint() {
    return {
      name: BuilderToolSpecs.DEFINE_ENDPOINT,
      mutating: true,
      sandboxed: true,
      description: 'Create (or redefine) the endpoint you are about to demonstrate: name (snake_case), description, params with examples, and what it returns. It becomes the current endpoint with a placeholder script, and recording starts: every page tool call you make from now on is part of the demonstration until compile_endpoint. Demonstrate with the example values, then compile, fix, test and save in the same reply.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'snake_case endpoint name, e.g. search_products' },
          description: { type: 'string', description: 'What the endpoint does, one or two sentences' },
          params: BuilderToolSpecs.PARAM_SCHEMA,
          returns: {
            type: 'object',
            description: 'The result shape: { kind: rows|object|value|text, fields?: [string], description? }',
            properties: {
              kind: { type: 'string', enum: ['rows', 'object', 'value', 'text'] },
              fields: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' },
            },
          },
        },
        required: ['name', 'description'],
      },
    };
  }

  static compileEndpoint() {
    return {
      name: BuilderToolSpecs.COMPILE_ENDPOINT,
      mutating: true,
      sandboxed: true,
      description: 'Turn the page tool calls you made since define_endpoint (in this reply and in earlier ones) into the endpoint\'s steps, store them as the draft script and return them with warnings. Call it right after demonstrating, in the same reply; then review the steps, fix them with set_steps and test_endpoint.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Endpoint name (defaults to the current endpoint)' },
          examples: { type: 'object', description: 'Optional { param: value } used in the demonstration, when they differ from the declared examples' },
        },
      },
    };
  }

  static setSteps() {
    return {
      name: BuilderToolSpecs.SET_STEPS,
      mutating: true,
      sandboxed: true,
      description: `Replace the endpoint's steps with the given JSON array (the whole script, in order). Step kinds: ${StepKinds.KINDS.join(', ')}. A validation failure answers the exact error; fix and call again. Optionally update params and returns at the same time.`,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Endpoint name (defaults to the current endpoint)' },
          steps: { type: 'array', items: { type: 'object' }, description: 'The complete step list' },
          params: BuilderToolSpecs.PARAM_SCHEMA,
          returns: { type: 'object', description: '{ kind, fields?, description? }' },
        },
        required: ['steps'],
      },
    };
  }

  static getEndpoint() {
    return {
      name: BuilderToolSpecs.GET_ENDPOINT,
      description: 'Read one endpoint of this site in full: params, steps, returns, policy, status, last run.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', description: 'Endpoint name (defaults to the current endpoint)' } },
      },
    };
  }

  static testEndpoint() {
    return {
      name: BuilderToolSpecs.TEST_ENDPOINT,
      description: 'Run the endpoint\'s stored steps in the replay tab with the given params (kind test) and answer ok, the data (truncated), the fault with advice, the healed selectors and a per-step log. Test with the example values first, then with a second set.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Endpoint name (defaults to the current endpoint)' },
          params: { type: 'object', description: 'The call parameters, { name: value }' },
        },
      },
    };
  }

  static saveEndpoint() {
    return {
      name: BuilderToolSpecs.SAVE_ENDPOINT,
      mutating: true,
      sandboxed: true,
      description: 'Mark the endpoint validated, which registers its siteapi_* tool and REST route. Call only after a test answered ok with the expected shape. Answers the tool name.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string', description: 'Endpoint name (defaults to the current endpoint)' } },
      },
    };
  }

  static listEndpoints() {
    return {
      name: BuilderToolSpecs.LIST_ENDPOINTS,
      description: 'List this site\'s endpoints: name, status, params, tool name, last run.',
      inputSchema: { type: 'object', properties: {} },
    };
  }
}

module.exports = BuilderToolSpecs;
