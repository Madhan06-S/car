/* Draftly export — applies draftly-customization.json at runtime */
(function () {
  var cfg;
  try {
    cfg = JSON.parse(document.getElementById('draftly-customization-data')?.textContent || '{}');
  } catch (e) { return; }
  if (!cfg || typeof cfg !== 'object') return;

  function applyTheme(theme) {
    if (!theme) return;
    var style = document.getElementById('draftly-theme-overrides');
    if (!style) {
      style = document.createElement('style');
      style.id = 'draftly-theme-overrides';
      document.head.appendChild(style);
    }
    var accent = theme.accent || '#8b5cf6';
    var bg = theme.background || '';
    var sans = theme.fontSans || '';
    var display = theme.fontDisplay || sans || '';
    var rules = [
      ':root { --draftly-accent: ' + accent + '; }',
      'a { color: ' + accent + ' !important; }',
    ];
    if (bg) {
      rules.push('html, body { background-color: ' + bg + ' !important; }');
      rules.push('#root { background-color: ' + bg + ' !important; min-height: 100%; }');
    }
    if (sans) rules.push('body, #root, #root * { font-family: ' + sans + ' !important; }');
    if (display) rules.push('h1, h2, h3, .font-display { font-family: ' + display + ' !important; }');
    style.textContent = rules.join('\n');
  }

  function applyReplacements(replacements) {
    if (!replacements || !replacements.length) return;
    var sorted = replacements
      .filter(function (r) { return r.from && r.from !== r.to; })
      .sort(function (a, b) { return b.from.length - a.from.length; });
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var t = n.textContent;
      if (!t || t.length < 2) continue;
      for (var j = 0; j < sorted.length; j++) {
        if (t.indexOf(sorted[j].from) !== -1) {
          t = t.split(sorted[j].from).join(sorted[j].to);
        }
      }
      if (t !== n.textContent) n.textContent = t;
    }
  }

  function applyAssets(overrides, catalog) {
    if (!overrides) return;
    var byId = {};
    (catalog || []).forEach(function (s) { if (s.id) byId[s.id] = s; });
    Object.keys(overrides).forEach(function (id) {
      var url = overrides[id];
      if (!url) return;
      var slot = byId[id];
      var isVideo = slot && slot.kind === 'video';
      if (isVideo) {
        document.querySelectorAll('video').forEach(function (v) {
          if (!v.src && !v.getAttribute('src')) return;
          v.src = url;
          v.setAttribute('src', url);
        });
      } else {
        document.querySelectorAll('img').forEach(function (img) {
          var src = img.getAttribute('src') || '';
          if (slot && slot.defaultUrl && src.indexOf(slot.defaultUrl.split('/').pop() || '___') === -1 && src.indexOf('http') === 0) return;
          img.src = url;
        });
      }
    });
  }

  /* Inline text edits are keyed by data-draftly-id, stamped in DOM order in
     the editor. Re-stamp here with the IDENTICAL selector + skip rules so the
     ids line up, then apply each saved innerHTML. */
  var EDIT_SELECTORS = 'h1,h2,h3,h4,h5,h6,p,a,li,button,span,td,th,label,figcaption,' +
    'section,article,figure,img,video,' +
    '[class*="card"],[class*="Card"],[class*="btn"],[class*="Btn"],' +
    '[data-editable],[data-editable-ui]';
  function applyContentEdits(edits) {
    if (!edits) return;
    var keys = Object.keys(edits);
    if (!keys.length) return;
    var idx = 0;
    var els = document.querySelectorAll(EDIT_SELECTORS);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.closest('script,style,noscript,#draftly-toolbar,#draftly-badge,[data-draftly-ui]')) continue;
      var tag = el.tagName;
      var isMedia = tag === 'IMG' || tag === 'VIDEO';
      if (!isMedia && !(el.textContent || '').trim() && tag !== 'A' && tag !== 'BUTTON') continue;
      if (!el.hasAttribute('data-draftly-id')) {
        el.setAttribute('data-draftly-id', 'd' + (idx++));
      }
    }
    keys.forEach(function (id) {
      var target = document.querySelector('[data-draftly-id="' + id + '"]');
      if (target && typeof edits[id] === 'string' && target.innerHTML !== edits[id]) {
        target.innerHTML = edits[id];
      }
    });
  }

  /* Brand: user logo + social profile links (editor Brand panel). Platforms
     are identified by href domain, aria-label, or SVG path signature. */
  var SOCIAL_DOMAINS = {"instagram":["instagram.com"],"linkedin":["linkedin.com"],"twitter":["twitter.com","x.com"],"facebook":["facebook.com","fb.com"],"youtube":["youtube.com","youtu.be"]};
  var SOCIAL_SIGS = {"instagram":["M16 11.37","M12 2.163","M7.0301.084","M12 7a5 5"],"linkedin":["M16 8a6 6","M20.447 20.452","M4 4h4","M6 9H2"],"twitter":["M22 4s-.7 2.1","M23 3a10.9","M18.244 2.25","M13.6823 10.6218"],"facebook":["M18 2h-3","M24 12.073","M9 8h-3v4h3v12"],"youtube":["M22.54 6.42","M23.498 6.186","M2.5 17a24.12"]};
  function detectPlatform(a) {
    var href = (a.getAttribute('href') || '').toLowerCase();
    var aria = (a.getAttribute('aria-label') || '').toLowerCase();
    var platforms = Object.keys(SOCIAL_DOMAINS);
    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      if (SOCIAL_DOMAINS[p].some(function (d) { return href.indexOf(d) !== -1; })) return p;
      if (aria.indexOf(p) !== -1 || (p === 'twitter' && aria === 'x')) return p;
    }
    var paths = Array.prototype.map.call(a.querySelectorAll('svg path'), function (el) {
      return el.getAttribute('d') || '';
    }).join(' ');
    if (!paths) return null;
    for (var j = 0; j < platforms.length; j++) {
      var q = platforms[j];
      if (SOCIAL_SIGS[q].some(function (sig) { return paths.indexOf(sig) !== -1; })) return q;
    }
    return null;
  }
  var SOCIAL_GLYPHS = {"instagram":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"18\" height=\"18\"><rect x=\"2\" y=\"2\" width=\"20\" height=\"20\" rx=\"5\" ry=\"5\"></rect><path d=\"M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z\"></path><line x1=\"17.5\" y1=\"6.5\" x2=\"17.51\" y2=\"6.5\"></line></svg>","linkedin":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"18\" height=\"18\"><path d=\"M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z\"></path><rect x=\"2\" y=\"9\" width=\"4\" height=\"12\"></rect><circle cx=\"4\" cy=\"4\" r=\"2\"></circle></svg>","twitter":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"18\" height=\"18\"><path d=\"M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z\"></path></svg>","facebook":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"18\" height=\"18\"><path d=\"M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z\"></path></svg>","youtube":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"18\" height=\"18\"><path d=\"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.92 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z\"></path><polygon points=\"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02\"></polygon></svg>"};
  function applyBrand(brand) {
    if (!brand) return;
    var socials = brand.socials || {};
    var matched = {};
    var anchors = Array.prototype.filter.call(document.querySelectorAll('a'), function (a) {
      return a.querySelector('svg') && !(a.textContent || '').trim();
    });
    anchors.forEach(function (a) {
      var platform = detectPlatform(a);
      if (!platform) return;
      matched[platform] = true;
      var url = (socials[platform] || '').trim();
      if (!url) return;
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      a.setAttribute('href', url);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.setAttribute('aria-label', platform);
    });
    var missing = Object.keys(SOCIAL_GLYPHS).filter(function (p) {
      return (socials[p] || '').trim() && !matched[p];
    });
    var row = document.querySelector('[data-draftly-socials]');
    if (missing.length === 0) {
      if (row) row.remove();
    } else {
      if (!row) {
        row = document.createElement('div');
        row.setAttribute('data-draftly-socials', '1');
        row.style.cssText = 'display:flex;gap:12px;justify-content:center;align-items:center;padding:28px 16px;opacity:0.85;';
        var footer = document.querySelector('footer');
        if (footer) footer.insertBefore(row, footer.firstChild);
        else document.body.appendChild(row);
      }
      row.innerHTML = '';
      missing.forEach(function (p) {
        var url = socials[p].trim();
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        var a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.setAttribute('aria-label', p);
        a.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;border:1px solid currentColor;color:inherit;opacity:0.75;';
        a.innerHTML = SOCIAL_GLYPHS[p];
        row.appendChild(a);
      });
    }
    if (brand.logoUrl) {
      var header = document.querySelector('header') || document.querySelector('nav');
      var img = document.querySelector('img[data-draftly-logo]');
      if (!img && header) {
        img = header.querySelector('a img');
        if (img) {
          img.setAttribute('data-draftly-logo', '1');
        } else {
          var host = header.querySelector('a') || header;
          img = document.createElement('img');
          img.setAttribute('data-draftly-logo', '1');
          img.alt = 'logo';
          img.style.height = '32px';
          img.style.width = 'auto';
          img.style.objectFit = 'contain';
          var mark = host.querySelector('svg, [class*="logo"], [class*="Logo"]');
          if (mark && mark.style) mark.style.display = 'none';
          host.insertBefore(img, host.firstChild);
        }
      }
      if (!img && document.body) {
        var wrap = document.createElement('div');
        wrap.setAttribute('data-draftly-logo-wrap', '1');
        wrap.style.cssText = 'position:fixed;top:16px;left:20px;z-index:9999;pointer-events:none;';
        img = document.createElement('img');
        img.setAttribute('data-draftly-logo', '1');
        img.alt = 'logo';
        img.style.cssText = 'height:36px;width:auto;object-fit:contain;';
        wrap.appendChild(img);
        document.body.appendChild(wrap);
      }
      if (img) img.src = brand.logoUrl;
    }
  }

  applyTheme(cfg.theme);
  applyReplacements(cfg.replacements);
  applyContentEdits(cfg.contentEdits);
  applyBrand(cfg.brand);
  var record = {};
  (cfg.assetOverrides || []).forEach(function (o) {
    if (o.assetId && o.url) record[o.assetId] = o.url;
  });
  applyAssets(record, cfg.assetSlots);
  [500, 1500, 3500, 6000, 10000].forEach(function (ms) {
    setTimeout(function () {
      applyReplacements(cfg.replacements);
      applyContentEdits(cfg.contentEdits);
      applyBrand(cfg.brand);
      applyAssets(record, cfg.assetSlots);
    }, ms);
  });
})();
