const express = require('express');
const ExposeParams = require('./expose/ExposeParams');
const McpResult = require('./McpResult');

class ExposeRegistry {
  static DEFAULT_TARGETS = ['api', 'mcp'];
  static QUERY_METHODS = new Set(['get', 'delete']);

  constructor(extensionId) {
    this.extensionId = extensionId;
    this._registrations = [];
    this._sealed = false;
  }

  expose(name, fn, options = {}) {
    this._assertOpen();
    this._assertValid(name, fn);
    this._registrations.push(ExposeRegistry._registration(name, fn, options));
  }

  seal() {
    this._sealed = true;
  }

  getRegistrations() {
    return this._registrations;
  }

  hasRegistrations() {
    return this._registrations.length > 0;
  }

  buildMcpToolSet() {
    const registrations = this._registrationsFor('mcp');
    if (registrations.length === 0) return null;
    const handlers = new Map(registrations.map((reg) => [this._toolName(reg), reg.fn]));
    return {
      tools: registrations.map((reg) => this._toolDefinition(reg)),
      handler: (toolName, args) => ExposeRegistry._callTool(handlers.get(toolName), args),
    };
  }

  buildExpressRouter() {
    const registrations = this._registrationsFor('api');
    if (registrations.length === 0) return null;
    const router = express.Router();
    for (const reg of registrations) {
      router[reg.method](`/${reg.name}`, (req, res) => ExposeRegistry._serveRoute(reg, req, res));
    }
    return router;
  }

  _assertOpen() {
    if (!this._sealed) return;
    throw new Error(
      `ExposeRegistry [${this.extensionId}]: cannot call expose() after activation - `
      + 'expose() must be called synchronously during activate().',
    );
  }

  _assertValid(name, fn) {
    if (!name || typeof name !== 'string') {
      throw new Error(`ExposeRegistry [${this.extensionId}]: name must be a non-empty string`);
    }
    if (typeof fn !== 'function') {
      throw new Error(`ExposeRegistry [${this.extensionId}]: fn must be a function`);
    }
  }

  _registrationsFor(target) {
    return this._registrations.filter((reg) => reg.targets.includes(target));
  }

  _toolName(reg) {
    return `${this.extensionId}_${reg.name}`;
  }

  _toolDefinition(reg) {
    return {
      name: this._toolName(reg),
      description: reg.description || `${this.extensionId}: ${reg.name}`,
      inputSchema: ExposeParams.toInputSchema(reg.params),
    };
  }

  static _registration(name, fn, { targets = ExposeRegistry.DEFAULT_TARGETS, description = '', method = 'post', params = {} }) {
    return { name, fn, targets, description, method: method.toLowerCase(), params };
  }

  static async _callTool(fn, args) {
    if (!fn) return null;
    try {
      const data = await fn(args || {});
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, data }, null, 2) }] };
    } catch (err) {
      return McpResult.error(err.message);
    }
  }

  static async _serveRoute(reg, req, res) {
    try {
      const args = ExposeParams.coerce(ExposeRegistry._requestArgs(reg.method, req), reg.params);
      const missing = ExposeParams.missingRequired(args, reg.params);
      if (missing.length > 0) {
        res.status(400).json({ success: false, error: `Missing required parameters: ${missing.join(', ')}` });
        return;
      }
      const data = await reg.fn(args);
      res.json({ success: true, data, timestamp: new Date().toISOString() });
    } catch (err) {
      res.status(err.statusCode || 500).json({ success: false, error: err.message, timestamp: new Date().toISOString() });
    }
  }

  static _requestArgs(method, req) {
    const source = ExposeRegistry.QUERY_METHODS.has(method) ? req.query : req.body;
    return { ...source, ...req.params };
  }
}

module.exports = ExposeRegistry;
