/* Membaca kandungan dari Google Sheet (tab: Hebahan, Dokumen, FAQ).
   Jika Sheet gagal dibaca, kandungan tetap dalam HTML kekal dipaparkan. */
(function () {
  var cfg = window.PBU_CONFIG || {};
  var debug = /[?&]semak=1/.test(location.search);
  var log = [];
  var nodes = document.querySelectorAll('[data-sheet],[data-tarikh],[data-stat],[data-kenal],[data-tp],[data-sesi-key],[data-sesi-strip],[data-kenal-links]');
  if (!nodes.length) return;

  function report(msg, bad) {
    log.push((bad ? 'GAGAL: ' : 'OK: ') + msg);
    if (!debug) return;
    var b = document.getElementById('semak-box');
    if (!b) {
      b = document.createElement('pre');
      b.id = 'semak-box';
      b.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:99;margin:0;padding:10px 12px;background:#0c2150;color:#fff;font:12px/1.5 monospace;white-space:pre-wrap;border-radius:6px;max-height:40vh;overflow:auto';
      document.body.appendChild(b);
    }
    b.textContent = 'PBU Semak Sheet\n' + log.join('\n');
  }

  if (!cfg.SHEET_ID) { report('SHEET_ID kosong di config.js - guna kandungan tetap.', true); return; }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) {
    u = (u || '').trim();
    if (!u) return '';
    if (/^(https?:\/\/|mailto:|tel:)/i.test(u)) return u;
    if (/^[\w\-./#?=&%]+$/.test(u) && !/^[a-z]+:/i.test(u)) return u;
    return '';
  }
  function linkify(s) {
    return esc(s).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, function (u) {
      return '<a href="' + u + '" target="_blank" rel="noopener">' + u + '</a>';
    }).replace(/\n/g, '<br>');
  }

  function parseCSV(t) {
    var rows = [], row = [], f = '', q = false, i, c;
    t = t.replace(/^﻿/, '');
    for (i = 0; i < t.length; i++) {
      c = t[i];
      if (q) {
        if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && t[i + 1] === '\n') i++;
        row.push(f); f = ''; rows.push(row); row = [];
      } else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows;
  }

  var cache = {};
  function load(sheet, need) {
    if (cache[sheet]) return cache[sheet];
    var url = 'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(cfg.SHEET_ID) +
      '/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent(sheet);
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
    cache[sheet] = fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status + ' (semak kebenaran perkongsian Sheet)');
      return r.text();
    }).then(function (txt) {
      var rows = parseCSV(txt);
      if (!rows.length) throw new Error('tab kosong');
      var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
      need.forEach(function (n) {
        if (head.indexOf(n) === -1) throw new Error('lajur "' + n + '" tiada - semak nama tab "' + sheet + '" dan baris pertama');
      });
      var out = [];
      rows.slice(1).forEach(function (r) {
        var o = {}, any = false;
        head.forEach(function (h, i) { var v = (r[i] || '').trim(); o[h] = v; if (v) any = true; });
        if (any) out.push(o);
      });
      report('tab ' + sheet + ': ' + out.length + ' baris dibaca');
      return out;
    });
    cache[sheet].catch(function (e) { report('tab ' + sheet + ': ' + e.message, true); });
    return cache[sheet];
  }

  window.PBU_LOAD = load;

  function visible(o) { return !/^(tidak|no|x|0|false|n)$/i.test(o.papar || ''); }

  var BULAN = ['JAN', 'FEB', 'MAC', 'APR', 'MEI', 'JUN', 'JUL', 'OGOS', 'SEPT', 'OKT', 'NOV', 'DIS'];
  function parseDate(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s) || null, d;
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    d = new Date(s);
    return isNaN(d) ? null : d;
  }

  var ARROW = '<svg class="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var DL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 11l5 5 5-5M4 20h16"/></svg>';

  function renderHebahan(el, rows) {
    var list = rows.filter(visible).filter(function (o) { return o.tajuk; }).map(function (o) {
      o._d = parseDate(o.tarikh); return o;
    });
    list.sort(function (a, b) { return (b._d ? b._d.getTime() : 0) - (a._d ? a._d.getTime() : 0); });
    var la = el.getAttribute('data-limit'), lim = la === 'utama' ? (cfg.HEBAHAN_UTAMA || 4) : parseInt(la, 10);
    if (lim) list = list.slice(0, lim);
    var fb = el.getAttribute('data-fallback-href') || '#';
    if (!list.length) { el.innerHTML = '<p class="empty">Tiada hebahan buat masa ini.</p>'; return; }
    el.innerHTML = list.map(function (o) {
      var href = safeUrl(o.pautan), tag = href ? 'a' : 'div';
      var attr = href ? ' href="' + esc(href) + '"' + (/^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '') : '';
      if (!href && fb !== '#') { tag = 'a'; attr = ' href="' + fb + '"'; }
      var date = o._d
        ? '<b>' + ('0' + o._d.getDate()).slice(-2) + '</b><span>' + BULAN[o._d.getMonth()] + '<br>' + o._d.getFullYear() + '</span>'
        : '<b>&bull;</b><span>' + esc(o.tarikh) + '</span>';
      return '<' + tag + ' class="news"' + attr + '><div class="date">' + date + '</div><div class="news-body"><h4>' +
        esc(o.tajuk) + '</h4>' + (o.ringkasan ? '<p>' + esc(o.ringkasan) + '</p>' : '') + '</div>' +
        (tag === 'a' ? ARROW : '') + '</' + tag + '>';
    }).join('');
  }

  function imgSrc(u) {
    var m = /drive\.google\.com\/file\/d\/([\w-]+)/.exec(u) || /drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)/.exec(u);
    return m ? 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1600' : u;
  }
  function imgCard(o, href) {
    return '<figure class="doc-img"><a href="' + esc(href) + '" target="_blank" rel="noopener" title="Klik untuk buka saiz penuh">' +
      '<img src="' + esc(imgSrc(href)) + '" alt="' + esc(o.tajuk) + '" loading="lazy"></a>' +
      '<figcaption><b>' + esc(o.tajuk) + '</b>' + (o.keterangan ? '<small>' + esc(o.keterangan) + '</small>' : '') + '</figcaption></figure>';
  }

  function renderDokumen(el, rows) {
    var g = (el.getAttribute('data-group') || '').toLowerCase();
    var list = rows.filter(visible).filter(function (o) { return o.tajuk && o.kumpulan.toLowerCase() === g; });
    if (!list.length && el.hasAttribute('data-keep')) return;
    var wrap = el.closest ? el.closest('[data-poster-wrap]') : null;
    if (wrap) { wrap.hidden = !list.length; if (!list.length) return; }
    el.innerHTML = list.map(function (o) {
      var jenis = (o.jenis || 'PDF').toUpperCase(), href = safeUrl(o.pautan);
      if (/^(JPG|JPEG|PNG|GAMBAR|IMAGE)$/.test(jenis) && href) return imgCard(o, href);
      var cls = jenis === 'PDF' ? 'badge' : 'badge blue';
      var tag = href ? 'a' : 'div';
      var attr = href ? ' href="' + esc(href) + '" target="_blank" rel="noopener"' : '';
      return '<' + tag + ' class="doc"' + attr + '><span class="' + cls + '">' + esc(jenis) + '</span><span class="doc-body"><b>' +
        esc(o.tajuk) + '</b>' + (o.keterangan ? '<small>' + esc(o.keterangan) + '</small>' : '') + '</span>' + (href ? DL : '') + '</' + tag + '>';
    }).join('') || '<p class="empty">Tiada dokumen buat masa ini.</p>';
  }

  function renderFaq(el, rows) {
    var list = rows.filter(visible).filter(function (o) { return o.soalan && o.jawapan; });
    el.innerHTML = list.map(function (o) {
      return '<details data-cat="' + esc((o.kategori || 'umum').toLowerCase()) + '"><summary>' + esc(o.soalan) +
        '</summary><div class="ans">' + linkify(o.jawapan) + '</div></details>';
    }).join('');
    document.dispatchEvent(new Event('faq-updated'));
  }

  var MAP = {
    hebahan: { need: ['tajuk', 'tarikh'], fn: renderHebahan, sheet: 'Hebahan' },
    dokumen: { need: ['kumpulan', 'tajuk'], fn: renderDokumen, sheet: 'Dokumen' },
    faq: { need: ['soalan', 'jawapan'], fn: renderFaq, sheet: 'FAQ' }
  };

  var HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  var BLN = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
  function fmtNilai(v) {
    var d = /^\d{4}-\d{1,2}-\d{1,2}/.test(v) || /^\d{1,2}\/\d{1,2}\/\d{4}/.test(v) ? parseDate(v) : null;
    return d ? d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear() + ' (' + HARI[d.getDay()] + ')' : v;
  }
  window.PBU_FMT = fmtNilai;
  var tarikhEls = document.querySelectorAll('[data-tarikh]');
  if (tarikhEls.length) {
    load('Tetapan', ['kunci']).then(function (rows) {
      var map = {};
      rows.forEach(function (r) { var v = r.teks || r.tarikh || r.nilai; if (r.kunci && v) map[r.kunci.toLowerCase()] = v; });
      Array.prototype.forEach.call(tarikhEls, function (el) {
        var v = map[(el.getAttribute('data-tarikh') || '').toLowerCase()];
        if (v) el.textContent = fmtNilai(v);
      });
    }).catch(function () { /* kekalkan tarikh tetap dalam HTML */ });
  }

  var kenalEls = document.querySelectorAll('[data-kenal]');
  if (kenalEls.length) {
    load('Tetapan', ['kunci']).then(function (rows) {
      var map = {};
      rows.forEach(function (r) { var v = r.teks || r.nilai || r.tarikh; if (r.kunci && v) map[r.kunci.toLowerCase()] = String(v).trim(); });
      function senarai(v) { return v.split(/[;,\n]+/).map(function (x) { return x.trim(); }).filter(Boolean); }
      function safe(x) { return x.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
      Array.prototype.forEach.call(kenalEls, function (el) {
        var k = (el.getAttribute('data-kenal') || '').toLowerCase(), v = map[k];
        if (!v) return;
        var items = senarai(v);
        if (items.length > 1) {
          var blok = el.closest && el.closest('.contact-row, footer');
          el.innerHTML = items.map(safe).join(blok ? '<br>' : ', ');
        } else el.textContent = v;
      });
      Array.prototype.forEach.call(document.querySelectorAll('[data-kenal-href]'), function (a) {
        var v = map[(a.getAttribute('data-kenal-href') || '').toLowerCase()];
        if (v) a.setAttribute('href', 'mailto:' + senarai(v).join(','));
      });
    }).catch(function () { /* kekalkan teks tetap dalam HTML */ });
  }

  var sesiEls = document.querySelectorAll('[data-sesi-key]');
  var sesiNow = document.querySelector('[data-sesi-now]');
  if (sesiEls.length || sesiNow) {
    load('Tetapan', ['kunci']).then(function (rows) {
      var map = {};
      rows.forEach(function (r) { var v = r.teks || r.nilai || r.tarikh; if (r.kunci && v) map[r.kunci.toLowerCase()] = String(v).trim(); });
      var norm = function (x) { return String(x || '').toLowerCase().replace(/\s*:\s*/g, ':').replace(/\s+/g, ' ').trim(); };
      var now = map.sesi_semasa || (sesiNow ? sesiNow.textContent : '');
      if (sesiNow && map.sesi_semasa) sesiNow.textContent = map.sesi_semasa;
      Array.prototype.forEach.call(sesiEls, function (el) {
        var v = map[(el.getAttribute('data-sesi-key') || '').toLowerCase()] || el.textContent;
        el.textContent = v;
        var old = now && norm(v) !== norm(now);
        el.classList.toggle('is-old', !!old);
        if (old) el.textContent = 'Sesi lepas: ' + v;
        var p = el.closest && el.closest('.panel');
        if (p) p.classList.toggle('sesi-lepas', !!old);
      });
    }).catch(function () { /* kekalkan lencana tetap dalam HTML */ });
  }

  var linkEls = document.querySelectorAll('[data-kenal-links]');
  if (linkEls.length) {
    load('Tetapan', ['kunci']).then(function (rows) {
      var map = {};
      rows.forEach(function (r) { var v = r.teks || r.nilai || r.tarikh; if (r.kunci && v) map[r.kunci.toLowerCase()] = String(v).trim(); });
      Array.prototype.forEach.call(linkEls, function (el) {
        var v = map[(el.getAttribute('data-kenal-links') || '').toLowerCase()];
        var items = v ? v.split(/[;,\n]+/).map(function (x) { return x.trim(); }).filter(Boolean) : [];
        if (!items.length) return;
        el.innerHTML = items.map(function (x, i) {
          var a = '<a class="inline" href="mailto:' + esc(x) + '">' + esc(x) + '</a>';
          return (i === 0 ? '' : (i === items.length - 1 ? ' atau ' : ', ')) + a;
        }).join('');
      });
    }).catch(function () { /* kekalkan pautan tetap dalam HTML */ });
  }

  Array.prototype.forEach.call(nodes, function (el) {
    var m = MAP[el.getAttribute('data-sheet')];
    if (!m) return;
    load(m.sheet, m.need).then(function (rows) { m.fn(el, rows); }).catch(function () { /* kekalkan kandungan tetap */ });
  });
})();
