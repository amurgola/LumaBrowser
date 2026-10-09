class VsixManifest {
  static CONTENT_TYPES = Object.freeze({
    '.json': 'application/json', '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html',
    '.md': 'text/markdown', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.vsixmanifest': 'text/xml',
  });

  static xml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  static packageManifest(m) {
    const x = VsixManifest.xml;
    return `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="${x(m.name)}" Version="${x(m.version)}" Publisher="${x(m.publisher)}"/>
    <DisplayName>${x(m.displayName)}</DisplayName>
    <Description xml:space="preserve">${x(m.description)}</Description>
    <Tags>${x((m.keywords || []).join(','))}</Tags>
    <Categories>${x((m.categories || []).join(','))}</Categories>
    <GalleryFlags>Public</GalleryFlags>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="${x(m.engines.vscode)}"/>
      <Property Id="Microsoft.VisualStudio.Code.ExtensionDependencies" Value=""/>
      <Property Id="Microsoft.VisualStudio.Code.ExtensionPack" Value=""/>
      <Property Id="Microsoft.VisualStudio.Code.ExtensionKind" Value="${x((m.extensionKind || ['workspace']).join(','))}"/>
      <Property Id="Microsoft.VisualStudio.Code.LocalizedLanguages" Value=""/>
    </Properties>
    <Icon>extension/${x(m.icon || '')}</Icon>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code"/>
  </Installation>
  <Dependencies/>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/>
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true"/>
    <Asset Type="Microsoft.VisualStudio.Services.Icons.Default" Path="extension/${x(m.icon || '')}" Addressable="true"/>
  </Assets>
</PackageManifest>
`;
  }

  static contentTypes(exts) {
    const rows = [...new Set([...exts, '.vsixmanifest'])].sort()
      .map((e) => `<Default Extension="${VsixManifest.xml(e)}" ContentType="${VsixManifest.CONTENT_TYPES[e] || 'application/octet-stream'}"/>`);
    return `<?xml version="1.0" encoding="utf-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${rows.join('')}</Types>\n`;
  }
}

module.exports = VsixManifest;
