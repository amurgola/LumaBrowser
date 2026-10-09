const OptionSelector = require('./OptionSelector');
const DateSetter = require('./DateSetter');
const SliderSetter = require('./SliderSetter');
const ListCollector = require('./ListCollector');

class WidgetDriver {
  static selectOption(wc, opts = {}) {
    return new OptionSelector(wc).execute(opts);
  }

  static setDate(wc, opts = {}) {
    return new DateSetter(wc).execute(opts);
  }

  static setSlider(wc, opts = {}) {
    return new SliderSetter(wc).execute(opts);
  }

  static collectList(wc, opts = {}) {
    return new ListCollector(wc).execute(opts);
  }
}

module.exports = WidgetDriver;
