class TaskProvider {
  static KIND = null;

  validateConfig(_config) {
    throw new Error(`${this.constructor.name} must implement validateConfig()`);
  }

  async discover(_opts) {
    throw new Error(`${this.constructor.name} must implement discover()`);
  }

  async resolveAssignee(_opts) {
    throw new Error(`${this.constructor.name} must implement resolveAssignee()`);
  }

  async fetchTasks(_source, _opts) {
    throw new Error(`${this.constructor.name} must implement fetchTasks()`);
  }

  async describeLists(_opts) {
    throw new Error(`${this.constructor.name} must implement describeLists()`);
  }

  async createTask(_opts) {
    throw new Error(`${this.constructor.name} must implement createTask()`);
  }

  async pushStatus(_opts) {
    throw new Error(`${this.constructor.name} must implement pushStatus()`);
  }

  async postComment(_opts) {
    throw new Error(`${this.constructor.name} must implement postComment()`);
  }

  async pushFields(_opts) {
    throw new Error(`${this.constructor.name} must implement pushFields()`);
  }
}

module.exports = TaskProvider;
