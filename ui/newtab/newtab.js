(function newTabPage() {
  const api = window.lumaNewTab;
  const sites = document.getElementById('ntSites');
  const form = document.getElementById('ntSearch');
  const query = document.getElementById('ntQuery');

  function letterOf(site) {
    return (site.host || site.title || '?').charAt(0).toUpperCase();
  }

  function tile(site) {
    const a = document.createElement('a');
    a.className = 'nt-site';
    a.href = site.url;
    a.title = site.title ? `${site.title}\n${site.url}` : site.url;
    const icon = document.createElement('span');
    icon.className = 'nt-icon';
    if (site.icon) {
      const img = document.createElement('img');
      img.alt = '';
      img.src = site.icon;
      img.addEventListener('error', () => { icon.textContent = letterOf(site); });
      icon.appendChild(img);
    } else {
      icon.textContent = letterOf(site);
    }
    const name = document.createElement('span');
    name.className = 'nt-name';
    name.textContent = site.host || site.title || site.url;
    const remove = document.createElement('button');
    remove.className = 'nt-remove';
    remove.type = 'button';
    remove.title = 'Remove';
    remove.setAttribute('aria-label', `Remove ${site.host || site.url}`);
    remove.textContent = '×';
    remove.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (api) await api.hide(site.url);
      a.remove();
    });
    a.append(icon, name, remove);
    return a;
  }

  async function load() {
    if (!api) return;
    const data = await api.data();
    if (!data) return;
    if (data.engine && data.engine.name) query.placeholder = `Search ${data.engine.name}`;
    sites.replaceChildren(...(data.sites || []).map(tile));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = api ? await api.search(query.value) : null;
    if (url) window.location.href = url;
  });

  load();
}());
