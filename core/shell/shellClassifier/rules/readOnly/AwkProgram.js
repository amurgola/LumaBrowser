class AwkProgram {
  static HAZARDS = Object.freeze([
    { pattern: /\bsystem\s*\(/, phrase: 'program calls system(), which runs a shell command' },
    { pattern: /\|&/, phrase: 'program opens a gawk coprocess' },
    { pattern: /\|\s*getline\b/, phrase: 'program reads the output of a command with | getline' },
    { pattern: /\bprintf?\b[^;{}\n]*(>|\|)/, phrase: 'program redirects print output to a file or a command' },
    { pattern: /@load\b/, phrase: 'program loads a gawk extension' },
    { pattern: /@include\b/, phrase: 'program includes a source file this rule cannot read' },
  ]);

  static hazardIn(program) {
    const text = String(program == null ? '' : program);
    const found = AwkProgram.HAZARDS.find((hazard) => hazard.pattern.test(text));
    return found ? found.phrase : null;
  }
}

module.exports = AwkProgram;
