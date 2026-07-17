// Dynamic loading of Aktualności entries created via Pages CMS (content/news/*.json).
// These files aren't part of the hand-written static site, so we fetch and render
// them client-side. If the fetch fails (offline, rate-limited, no entries yet),
// we simply show nothing extra — the static cards already on the page keep working.
(function () {
  var LIST_API = 'https://api.github.com/repos/conradopro/guty/contents/content/news';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function fetchNewsEntries() {
    try {
      var res = await fetch(LIST_API, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) return [];
      var files = await res.json();
      if (!Array.isArray(files)) return [];
      var jsonFiles = files.filter(function (f) {
        return f.type === 'file' && /\.json$/i.test(f.name);
      });
      var entries = await Promise.all(
        jsonFiles.map(async function (f) {
          try {
            var r = await fetch(f.download_url);
            if (!r.ok) return null;
            var data = await r.json();
            if (!data.slug) data.slug = f.name.replace(/\.json$/i, '');
            return data;
          } catch (e) {
            return null;
          }
        })
      );
      entries = entries.filter(Boolean);
      entries.sort(function (a, b) {
        var oa = typeof a.order === 'number' ? a.order : 999;
        var ob = typeof b.order === 'number' ? b.order : 999;
        return oa - ob;
      });
      return entries;
    } catch (e) {
      return [];
    }
  }

  function newsCardHtml(entry) {
    var tagClass = entry.tag_variant === 'warn' ? 'tag warn' : 'tag';
    return (
      '<a href="aktualnosc.html?slug=' + encodeURIComponent(entry.slug) + '" class="card news-card">' +
      '<span class="' + tagClass + '">' + escapeHtml(entry.tag_label || '') + '</span>' +
      '<div class="date-pill">' + escapeHtml(entry.date_label || '') + '</div>' +
      '<h3 style="font-size:1.08rem; margin-top:8px;">' + escapeHtml(entry.title || '') + '</h3>' +
      '<p>' + escapeHtml(entry.excerpt || '') + '</p>' +
      '<span class="card-link">Czytaj więcej &rarr;</span>' +
      '</a>'
    );
  }

  window.RODNews = {
    fetchNewsEntries: fetchNewsEntries,
    newsCardHtml: newsCardHtml,
    escapeHtml: escapeHtml
  };

  // Appends dynamically-fetched entries into an existing grid container.
  window.renderDynamicNewsList = async function (containerId, opts) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var entries = await fetchNewsEntries();
    if (opts && opts.featuredOnly) {
      entries = entries.filter(function (e) { return !!e.featured; });
    }
    if (opts && opts.max) {
      entries = entries.slice(0, opts.max);
    }
    if (!entries.length) return;
    container.insertAdjacentHTML('beforeend', entries.map(newsCardHtml).join(''));
  };
})();
