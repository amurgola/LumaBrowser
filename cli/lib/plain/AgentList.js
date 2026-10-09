const AnsiCodes = require('./AnsiCodes');

class AgentList {
  static NO_AGENTS = 'No agents yet. Create one in LumaBrowser → Setup → Agents.\n';

  static print(payload, r, out = process.stdout) {
    const rows = (payload && payload.agents) || [];
    if (!rows.length) { out.write(AgentList.NO_AGENTS); return; }
    const w = Math.max(...rows.map((a) => a.name.length), 5);
    for (const a of rows) {
      out.write(`${r.c(AnsiCodes.bold, a.name.padEnd(w))}  ${r.c(AnsiCodes.dim, AgentList._details(a))}\n`);
      if (a.description) out.write(`${''.padEnd(w)}  ${a.description}\n`);
    }
  }

  static _details(a) {
    const kb = a.kbDocs ? ` · ${a.kbDocs} KB doc${a.kbDocs === 1 ? '' : 's'}` : '';
    return `${a.model || '(default model)'} · ${a.tools} tool${a.tools === 1 ? '' : 's'}${kb}`;
  }
}

module.exports = AgentList;
