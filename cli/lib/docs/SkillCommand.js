const fs = require('fs');
const os = require('os');
const path = require('path');

class SkillCommand {
  static SKILL_MD = `---
name: luma
description: Operate LumaBrowser from the terminal. Use for browser automation, the local model API, Network Sharing, MCP tools, or any LumaBrowser question.
---

# LumaBrowser

LumaBrowser runs local models and drives a real browser. Its CLI is \`luma\`.

Read \`luma docs\` for the topic list, then \`luma docs <topic>\` for the exact
reference: \`local-api\` (OpenAI and Anthropic endpoints on this computer),
\`api\` (REST browser automation), \`tools\` (MCP tool groups), and
\`remote-access\` (reaching a LumaBrowser on another machine). The docs print
without the app running. \`luma "<prompt>"\` runs a LumaBrowser agent over the
current folder; \`luma --agents\` lists agents.
`;

  static USAGE = 'luma skill install    write the luma skill for Claude Code and shared agent skills\n';

  static skillPaths({ home = os.homedir(), env = process.env } = {}) {
    const claudeDir = env.CLAUDE_CONFIG_DIR || path.join(home, '.claude');
    return [
      path.join(claudeDir, 'skills', 'luma', 'SKILL.md'),
      path.join(home, '.agents', 'skills', 'luma', 'SKILL.md'),
    ];
  }

  static install(opts = {}) {
    const written = [];
    for (const file of SkillCommand.skillPaths(opts)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, SkillCommand.SKILL_MD, 'utf8');
      written.push(file);
    }
    return written;
  }

  static run(args, { stdout = process.stdout, stderr = process.stderr, home, env } = {}) {
    const verb = (args[0] || '').trim();
    if (verb !== 'install') {
      stderr.write(SkillCommand.USAGE);
      return verb ? 1 : 0;
    }
    const files = SkillCommand.install({ home, env });
    stdout.write(`${files.map((f) => `installed ${f}`).join('\n')}\n`);
    return 0;
  }
}

module.exports = SkillCommand;
