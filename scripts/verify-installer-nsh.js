#!/usr/bin/env node
'use strict';

const path = require('path');
const InstallerNshVerifier = require('../tools/build/release/InstallerNshVerifier');

process.exit(new InstallerNshVerifier({ repoRoot: path.resolve(__dirname, '..') }).run());
