#!/usr/bin/env node

const path = require('path');
const JetBrainsPluginBuilder = require('../tools/ide/JetBrainsPluginBuilder');

process.exit(new JetBrainsPluginBuilder(path.resolve(__dirname, '..')).execute(process.argv.slice(2)));
