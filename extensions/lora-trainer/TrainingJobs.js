const fs = require('fs');
const TrainingJob = require('./TrainingJob');

class TrainingJobs {
  static BUSY = 'A LoRA is already being trained. Wait for it to finish or cancel it first (lora_training_status shows it).';
  static RECENT_LIMIT = 10;

  constructor({ paths, clock = () => Date.now(), fsOps = fs, processAlive = TrainingJobs.processAlive }) {
    this._paths = paths;
    this._clock = clock;
    this._fs = fsOps;
    this._processAlive = processAlive;
    this._jobs = new Map();
    this._loaded = false;
  }

  create({ request, model, recipe, conversationId = null }) {
    if (this.active()) throw new Error(TrainingJobs.BUSY);
    const job = new TrainingJob({ id: `${request.name}-${this._clock().toString(36)}`, request, model, recipe, conversationId });
    this._jobs.set(job.id, job);
    this.save(job);
    return job;
  }

  active() {
    return [...this._jobs.values()].find((job) => job.active) || null;
  }

  get(id) {
    this._loadStored();
    return this._jobs.get(id) || null;
  }

  recent(limit = TrainingJobs.RECENT_LIMIT) {
    this._loadStored();
    return [...this._jobs.values()]
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, limit);
  }

  abandonedIds() {
    return this.storedIds().filter((id) => {
      const job = this._readStored(id);
      return !job || !job.wasRunning || !this._processAlive(job.ownerPid);
    });
  }

  save(job) {
    try {
      this._fs.mkdirSync(this._paths.jobDir(job.id), { recursive: true });
      this._fs.writeFileSync(this._paths.jobFile(job.id), JSON.stringify(job.snapshot(), null, 2));
    } catch (_) {}
  }

  _loadStored() {
    if (this._loaded) return;
    this._loaded = true;
    for (const id of this.storedIds()) {
      if (this._jobs.has(id)) continue;
      const job = this._readStored(id);
      if (job) this._jobs.set(id, job);
    }
  }

  storedIds() {
    try {
      return this._fs.readdirSync(this._paths.jobsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
    } catch (_) {
      return [];
    }
  }

  static processAlive(pid) {
    if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (err) {
      return !!err && err.code === 'EPERM';
    }
  }

  _readStored(id) {
    try {
      return TrainingJob.fromSnapshot(JSON.parse(this._fs.readFileSync(this._paths.jobFile(id), 'utf8')));
    } catch (_) {
      return null;
    }
  }
}

module.exports = TrainingJobs;
