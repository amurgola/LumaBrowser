class SystemctlArgs {
  static VALUE_OPTIONS = Object.freeze([
    '-H', '--host', '-M', '--machine', '-t', '--type', '-p', '--property', '-s', '--signal', '--root', '-n', '--lines',
    '-o', '--output', '--state', '--kill-whom', '--kill-value', '--what', '--job-mode', '--boot-loader-entry', '--timestamp',
  ]);

  static positionals(command) {
    return command.positionalsSkipping(SystemctlArgs.VALUE_OPTIONS);
  }
}

module.exports = SystemctlArgs;
