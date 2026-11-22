import HtmlEscaper from '../../format/HtmlEscaper.js';
import ModelFrames from './ModelFrames.js';

export default class ModelFrameHead {
  static FORMAT_NAMES = Object.freeze({ gguf: 'GGUF', mlx: 'MLX', ninfer: 'NInfer', basalt: 'Basalt' });

  static html(frame, frameworks) {
    const body = ModelFrameHead._body(frame, frameworks);
    return `<div class="model-frame-head" data-model-frame="${HtmlEscaper.escape(frame.key)}">${body}</div>`;
  }

  static _body(frame, frameworks) {
    if (frame.kind === ModelFrames.UNLOADABLE) return ModelFrameHead._unloadable(frame);
    if (frame.kind === ModelFrames.COMPANION) return ModelFrameHead._companions(frame);
    const name = ModelFrameHead._frameworkName(frame.frameworkId, frameworks);
    if (frame.kind === ModelFrames.MISSING) return ModelFrameHead._missing(frame, name, frameworks);
    return ModelFrameHead._title(name) + ModelFrameHead._meta(ModelFrameHead._holds(frame));
  }

  static _missing(frame, name, frameworks) {
    const esc = HtmlEscaper.escape;
    const build = ModelFrameHead._buildName(frame.runtimeId, frameworks);
    const install = frame.runtimeId
      ? `<button class="luma-btn luma-btn--sm" type="button" data-runtime-action="install" data-runtime-id="${esc(frame.runtimeId)}">Install ${esc(build)}</button>`
      : '';
    return ModelFrameHead._title(`${name}: not installed`) + ModelFrameHead._meta(ModelFrameHead._holds(frame)) + install;
  }

  static _unloadable(frame) {
    const count = frame.models.length;
    const formats = ModelFrameHead._formatsText(frame.formats);
    const these = count === 1 ? `this ${formats} model` : `these ${count} ${formats} models`;
    return `<span class="model-frame-note">No framework on this PC loads ${HtmlEscaper.escape(these)}.</span>`;
  }

  static _companions(frame) {
    const files = ModelFrameHead._count(frame.models.length, 'file', 'files');
    return ModelFrameHead._title('Companion files')
      + ModelFrameHead._meta(`${files}, loaded with a model, not on their own`);
  }

  static _holds(frame) {
    const count = frame.models.length;
    const formats = ModelFrameHead._formatsText(frame.formats);
    return `${count} ${formats ? `${formats} ` : ''}${count === 1 ? 'model' : 'models'}`;
  }

  static _formatsText(formats) {
    return formats.map((format) => ModelFrameHead.FORMAT_NAMES[format] || format).join(' and ');
  }

  static _count(count, one, many) {
    return `${count} ${count === 1 ? one : many}`;
  }

  static _title(text) {
    return `<span class="model-frame-name">${HtmlEscaper.escape(text)}</span>`;
  }

  static _meta(text) {
    return `<span class="model-frame-meta">${HtmlEscaper.escape(text)}</span>`;
  }

  static _frameworkName(frameworkId, frameworks) {
    return frameworks && frameworks.view ? frameworks.nameOf(frameworkId) || frameworkId : frameworkId;
  }

  static _buildName(runtimeId, frameworks) {
    return frameworks && frameworks.view ? frameworks.buildName(runtimeId) || runtimeId : runtimeId;
  }
}
