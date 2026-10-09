const fs = require('fs');
const path = require('path');

class GoldenSet {
  static DEFAULT_DIR = path.join(__dirname, 'golden');

  static loadGoldenTasks(dir = GoldenSet.DEFAULT_DIR) {
    const tasks = [];
    const seen = new Set();
    for (const file of GoldenSet._listTaskFiles(dir)) {
      for (const task of GoldenSet._readTaskFile(dir, file)) {
        GoldenSet.validateTask(task, file);
        GoldenSet._assertUnique(task.id, seen, file);
        tasks.push(task);
      }
    }
    return tasks;
  }

  static validateTask(task, source) {
    GoldenSet._validateIdentity(task, source);
    GoldenSet._validatePromptOrTurns(task);
    GoldenSet._validateOptionalFields(task);
    return task;
  }

  static _listTaskFiles(dir) {
    try {
      return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
    } catch (err) {
      throw new Error(`golden set dir not readable (${dir}): ${err.message}`);
    }
  }

  static _readTaskFile(dir, file) {
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    } catch (err) {
      throw new Error(`golden file ${file} is not valid JSON: ${err.message}`);
    }
    return Array.isArray(raw) ? raw : [raw];
  }

  static _assertUnique(id, seen, file) {
    if (seen.has(id)) throw new Error(`duplicate golden task id "${id}" (in ${file})`);
    seen.add(id);
  }

  static _validateIdentity(task, source) {
    if (!task || typeof task !== 'object') throw new Error(`golden task in ${source} is not an object`);
    if (!task.id || typeof task.id !== 'string') throw new Error(`golden task in ${source} missing string "id"`);
  }

  static _validatePromptOrTurns(task) {
    const hasTurns = Array.isArray(task.turns) && task.turns.length > 0;
    if (!hasTurns && (!task.prompt || typeof task.prompt !== 'string')) {
      throw new Error(`golden task ${task.id} needs a string "prompt" or a non-empty "turns" array`);
    }
    if (task.turns != null && !Array.isArray(task.turns)) {
      throw new Error(`golden task ${task.id} "turns" must be an array`);
    }
    if (hasTurns) task.turns.forEach((turn, i) => GoldenSet._validateTurn(task.id, turn, i + 1));
  }

  static _validateTurn(taskId, turn, number) {
    if (!turn || typeof turn !== 'object') throw new Error(`golden task ${taskId} turn ${number} is not an object`);
    if (!turn.prompt || typeof turn.prompt !== 'string') throw new Error(`golden task ${taskId} turn ${number} missing string "prompt"`);
    if (turn.expect != null && typeof turn.expect !== 'object') throw new Error(`golden task ${taskId} turn ${number} "expect" must be an object`);
  }

  static _validateOptionalFields(task) {
    if (task.expect != null && typeof task.expect !== 'object') {
      throw new Error(`golden task ${task.id} "expect" must be an object`);
    }
    if (task.requires != null && !Array.isArray(task.requires)) {
      throw new Error(`golden task ${task.id} "requires" must be an array of capability names`);
    }
    if (task.group != null && typeof task.group !== 'string') {
      throw new Error(`golden task ${task.id} "group" must be a string`);
    }
  }
}

module.exports = GoldenSet;
