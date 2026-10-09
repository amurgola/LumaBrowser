const fs = require('fs');

class BytecodeJob {
  constructor({ bytenode, jobPath, resultPath }) {
    this._bytenode = bytenode;
    this._jobPath = jobPath;
    this._resultPath = resultPath;
  }

  async run() {
    const jobs = JSON.parse(fs.readFileSync(this._jobPath, 'utf8'));
    const results = [];
    for (const job of jobs) results.push(await this._compileOne(job));
    fs.writeFileSync(this._resultPath, JSON.stringify(results), 'utf8');
    return results.every((r) => r.ok);
  }

  async _compileOne({ input, output }) {
    try {
      await this._bytenode.compileFile({ filename: input, compileAsModule: true, output });
      return { input, ok: true };
    } catch (err) {
      return { input, ok: false, error: err.message };
    }
  }
}

module.exports = BytecodeJob;
