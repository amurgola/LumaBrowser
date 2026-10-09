class LauncherScript {
  static renderWindows(exePath, cliScript) {
    return [
      '@echo off',
      'setlocal',
      'set "ELECTRON_RUN_AS_NODE=1"',
      `"${exePath}" "${cliScript}" %*`,
      'exit /b %ERRORLEVEL%',
      '',
    ].join('\r\n');
  }

  static renderPosix(exePath, cliScript) {
    return `#!/bin/sh\n# LumaBrowser terminal CLI launcher (Settings → General → Terminal)\nELECTRON_RUN_AS_NODE=1 exec "${exePath}" "${cliScript}" "$@"\n`;
  }
}

module.exports = LauncherScript;
