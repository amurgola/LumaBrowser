'use strict';

const LumaExtension = require('./src/LumaExtension');
const CliConnectLib = require('./src/CliConnectLib');

function loadConnectLib() {
  try { return CliConnectLib.load(); } catch (_) { return null; }
}

function activate(context) {
  new LumaExtension(context, loadConnectLib()).activate();
}

function deactivate() {}

module.exports = { activate, deactivate };
