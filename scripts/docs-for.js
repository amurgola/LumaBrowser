#!/usr/bin/env node
'use strict';

const DocsForCli = require('../tools/docs/DocsForCli');

process.exitCode = new DocsForCli().execute(process.argv.slice(2));
