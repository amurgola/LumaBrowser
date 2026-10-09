const SpanSegmenter = require('./SpanSegmenter');

class LineSegmenter extends SpanSegmenter {
  _cutPoints(source, start, end) {
    const cuts = [];
    for (let i = source.indexOf('\n', start); i !== -1 && i < end - 1; i = source.indexOf('\n', i + 1)) cuts.push(i + 1);
    return cuts;
  }
}

module.exports = LineSegmenter;
