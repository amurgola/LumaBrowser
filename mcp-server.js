#!/usr/bin/env node

const McpServer = require('./core/shell/McpServer');

const server = new McpServer();

const stopAndExit = async () => {
  await server.stop();
  process.exit(0);
};

server.start().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

process.on('SIGINT', stopAndExit);
process.on('SIGTERM', stopAndExit);
process.on('exit', () => { server.stop(); });
