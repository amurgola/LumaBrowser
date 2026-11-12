const path = require('path');

class ProfileEnvironment {
  static TRACE_CATEGORIES = ['devtools.timeline', 'v8', 'toplevel', 'blink.user_timing'];
  static STARTUP_TRACE_SECONDS = 10;
  static PROFILE_DIR = 'profile';
  static HANDSHAKE_FILE = 'cli-handshake.json';
  static STARTUP_TRACE_FILE = 'chromium-trace.json';

  static env(output, options, port, baseEnv = process.env) {
    const env = {
      ...baseEnv,
      LUMA_DATA_DIR: path.join(output, ProfileEnvironment.PROFILE_DIR),
      LUMA_CLI_HANDSHAKE: path.join(output, ProfileEnvironment.HANDSHAKE_FILE),
      LUMA_PERF_OUTPUT: output,
      LUMA_API_PORT: String(port),
      NO_TELEMETRY: '1',
      LUMA_PERF_FIRST_RUN: options.firstRun ? '1' : '0',
      LUMA_PERF_NO_ADBLOCK: options.noAdblock ? '1' : '0',
    };
    delete env.ELECTRON_RUN_AS_NODE;
    return env;
  }

  static args(entryScript, output) {
    return [
      entryScript,
      `--trace-startup=${ProfileEnvironment.TRACE_CATEGORIES.join(',')}`,
      `--trace-startup-duration=${ProfileEnvironment.STARTUP_TRACE_SECONDS}`,
      '--trace-startup-format=json',
      `--trace-startup-file=${path.join(output, ProfileEnvironment.STARTUP_TRACE_FILE)}`,
    ];
  }
}

module.exports = ProfileEnvironment;
