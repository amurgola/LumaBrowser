const path = require('path');

class TrainerRequirements {
  static INCLUDE = /^-r\s+(\S+)$/;
  static GITHUB_GIT = /^git\+https:\/\/github\.com\/([^/\s]+)\/([^/@\s]+?)(?:\.git)?@([0-9a-zA-Z._/-]+)$/;
  static MAX_DEPTH = 4;

  static resolve(file, readFile, depth = 0) {
    if (depth > TrainerRequirements.MAX_DEPTH) throw new Error(`Requirements files nest too deeply at ${file}.`);
    const lines = [];
    for (const raw of String(readFile(file)).split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const include = TrainerRequirements.INCLUDE.exec(line);
      if (include) lines.push(...TrainerRequirements.resolve(path.join(path.dirname(file), include[1]), readFile, depth + 1));
      else lines.push(TrainerRequirements.withoutGit(line));
    }
    return lines;
  }

  static withoutGit(line) {
    const match = TrainerRequirements.GITHUB_GIT.exec(line);
    if (!match) return line;
    const [, owner, repo, ref] = match;
    return `${repo} @ https://github.com/${owner}/${repo}/archive/${ref}.zip`;
  }
}

module.exports = TrainerRequirements;
