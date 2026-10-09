const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const CoreRequire = require('./CoreRequire');
const AudioAnalysis = require('./AudioAnalysis');

const WavCodec = CoreRequire.load('shared/audio/WavCodec');

class VoiceStore {
  static MIN_REF_SEC = 3;
  static MAX_REF_SEC = 40;
  static SILENCE_PEAK = 0.01;

  constructor(rootDir) {
    this.rootDir = rootDir;
    this.file = path.join(rootDir, 'voices.json');
    this.voicesDir = path.join(rootDir, 'voices');
  }

  refPath(id) {
    return path.join(this.voicesDir, String(id), 'ref.wav');
  }

  list() {
    return this._read().filter((v) => fs.existsSync(this.refPath(v.id)));
  }

  get(id) {
    return this.list().find((v) => v.id === String(id)) || null;
  }

  create(fields, wav) {
    const name = VoiceStore._requireName(fields.name);
    const prep = VoiceStore.prepareClip(wav, fields);
    const id = `v-${crypto.randomBytes(5).toString('hex')}`;
    this._writeClip(id, prep.wav);
    const now = new Date().toISOString();
    const row = {
      id,
      name,
      description: String(fields.description || '').trim(),
      language: VoiceStore.normLanguage(fields.language),
      referenceText: String(fields.referenceText || '').trim(),
      ...VoiceStore._clipFields(prep),
      createdAt: now,
      updatedAt: now,
    };
    this._write([...this._read(), row]);
    return row;
  }

  update(id, patch = {}, wav = null) {
    const list = this._read();
    const row = list.find((v) => v.id === String(id));
    if (!row) throw new Error('Voice not found.');
    VoiceStore._applyPatch(row, patch);
    if (wav) this._replaceClip(row, wav, patch);
    row.updatedAt = new Date().toISOString();
    this._write(list);
    return row;
  }

  remove(id) {
    const list = this._read();
    const idx = list.findIndex((v) => v.id === String(id));
    if (idx < 0) return false;
    list.splice(idx, 1);
    this._write(list);
    fs.rmSync(path.join(this.voicesDir, String(id)), { recursive: true, force: true });
    return true;
  }

  static prepareClip(wav, fields = {}) {
    VoiceStore.validateClip(wav);
    const { wav: prepared, analysis } = AudioAnalysis.prepareReferenceClip(wav, { trimStartSec: fields.trimStartSec });
    const refSec = VoiceStore.validateClip(prepared);
    return { wav: prepared, refSec: Math.round(refSec * 10) / 10, analysis };
  }

  static validateClip(wav) {
    const parsed = VoiceStore._parse(wav);
    const sec = parsed.samples.length / parsed.sampleRate;
    if (sec < VoiceStore.MIN_REF_SEC) throw new Error(`Reference clip is too short (${sec.toFixed(1)} s). Record at least ${VoiceStore.MIN_REF_SEC} seconds; 10-20 is best.`);
    if (sec > VoiceStore.MAX_REF_SEC) throw new Error(`Reference clip is too long (${sec.toFixed(0)} s). Keep it under ${VoiceStore.MAX_REF_SEC} seconds.`);
    if (VoiceStore._isSilent(parsed.samples)) throw new Error('Reference clip is silent. Check the microphone and try again.');
    return sec;
  }

  static normLanguage(lang) {
    const l = String(lang || 'en').trim().toLowerCase().slice(0, 2);
    return /^[a-z]{2}$/.test(l) ? l : 'en';
  }

  static _parse(wav) {
    try { return WavCodec.parse(wav); } catch (err) { throw new Error(`Reference clip is not a WAV file: ${err.message}`); }
  }

  static _isSilent(samples) {
    let peak = 0;
    for (let i = 0; i < samples.length; i += 7) peak = Math.max(peak, Math.abs(samples[i]));
    return peak < VoiceStore.SILENCE_PEAK;
  }

  static _requireName(value) {
    const name = String(value || '').trim();
    if (!name) throw new Error('A voice needs a name.');
    return name;
  }

  static _clipFields(prep) {
    return { refSec: prep.refSec, refHz: prep.analysis.medianHz, refRmsDb: prep.analysis.rmsDb };
  }

  static _applyPatch(row, patch) {
    if (patch.name != null) row.name = VoiceStore._requireName(patch.name);
    if (patch.description != null) row.description = String(patch.description).trim();
    if (patch.language != null) row.language = VoiceStore.normLanguage(patch.language);
    if (patch.referenceText != null) row.referenceText = String(patch.referenceText).trim();
  }

  _replaceClip(row, wav, patch) {
    const prep = VoiceStore.prepareClip(wav, patch);
    Object.assign(row, VoiceStore._clipFields(prep));
    this._writeClip(row.id, prep.wav);
  }

  _writeClip(id, wav) {
    fs.mkdirSync(path.join(this.voicesDir, String(id)), { recursive: true });
    fs.writeFileSync(this.refPath(id), wav);
  }

  _read() {
    try {
      const list = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  _write(list) {
    fs.mkdirSync(this.rootDir, { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
    fs.renameSync(tmp, this.file);
  }
}

module.exports = VoiceStore;
