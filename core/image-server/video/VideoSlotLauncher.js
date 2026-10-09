const ImageSlotLauncher = require('../router/ImageSlotLauncher');

class VideoSlotLauncher extends ImageSlotLauncher {
  static START_FAILED = 'Failed to start the video server.';
  static IMAGE_NOT_READY_PREFIX = 'Image server is ';
  static VIDEO_NOT_READY_PREFIX = 'Video server is ';

  async ensureReady(args) {
    const result = await super.ensureReady(args);
    if (result.error) result.error = VideoSlotLauncher.relabel(result.error);
    return result;
  }

  static relabel(error) {
    if (error === ImageSlotLauncher.START_FAILED) return VideoSlotLauncher.START_FAILED;
    if (!error.startsWith(VideoSlotLauncher.IMAGE_NOT_READY_PREFIX)) return error;
    return VideoSlotLauncher.VIDEO_NOT_READY_PREFIX + error.slice(VideoSlotLauncher.IMAGE_NOT_READY_PREFIX.length);
  }
}

module.exports = VideoSlotLauncher;
