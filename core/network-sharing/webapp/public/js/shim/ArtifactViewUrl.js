export default class ArtifactViewUrl {
  static of(id) {
    return '/sharing/artifacts/' + encodeURIComponent(id) + '/view';
  }
}
