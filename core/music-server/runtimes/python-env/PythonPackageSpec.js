class PythonPackageSpec {
  static SHORT_REF = 7;

  static requirement(pkg) {
    const src = pkg.sourceArchive;
    return src ? `${pkg.name} @ ${src.url}` : `${pkg.name}==${pkg.version}`;
  }

  static label(pkg) {
    const src = pkg.sourceArchive;
    return src ? `${pkg.name} ${pkg.version}+git ${String(src.ref).slice(0, PythonPackageSpec.SHORT_REF)}` : PythonPackageSpec.requirement(pkg);
  }

  static resolvedEvent(pkg) {
    const src = pkg.sourceArchive;
    const label = PythonPackageSpec.label(pkg);
    return {
      release: {
        tagName: pkg.version,
        name: src ? `${label} (source build)` : `${label} (PyPI)`,
        publishedAt: null,
        url: src
          ? `https://github.com/sgl-project/sglang-omni/commit/${src.ref}`
          : `https://pypi.org/project/${pkg.name}/${pkg.version}/`,
      },
      asset: { name: label, size: null },
    };
  }

  static extras(pkg) {
    return (pkg.extraPackages || []).slice();
  }
}

module.exports = PythonPackageSpec;
