/* Statistik Graduan: papar angka, kad dan carta.
   Data lalai ada di bawah (supaya halaman sentiasa berfungsi).
   Jika tab "Statistik" dalam Google Sheet boleh dibaca, data Sheet menggantikannya. */
(function () {
  var root = document.querySelector('[data-stat]');
  if (!root) return;

  var DEFAULT = [
    ['Konvokesyen 1', '2009', 27], ['Konvokesyen 2', '2012', 105], ['Konvokesyen 3', '2013', 123],
    ['Konvokesyen 4', '2014', 38], ['Konvokesyen 5', '2015', 103], ['Konvokesyen 6', '2016', 80],
    ['Konvokesyen 7', '2017', 199], ['Konvokesyen 8', '2018', 356], ['Konvokesyen 9', '2019', 431],
    ['Majlis Penyampaian Diploma', '2021', 455], ['Konvokesyen 10', '2022', 439], ['Konvokesyen 11', '2023', 316],
    ['Konvokesyen 12', '2024', 156], ['Konvokesyen 13', '2025', 258], ['Konvokesyen 14', '2026', 109],
    ['Konvokesyen 15', '', null]
  ].map(function (r) { return { nama: r[0], tahun: r[1], bil: r[2], akan: r[2] === null }; });

  // Graduate On Time (GOT): tab "GOT" dalam Sheet (lajur Tahun, Peratus, Papar) menggantikan data lalai ini
  var GOT_DEFAULT = [['2018', 84.10], ['2019', 79.36], ['2020', 83.05], ['2021', 88.50], ['2022', 93.88],
    ['2023', 90.95], ['2024', 88.24], ['2025', 89.23], ['2026', 77.25]]
    .map(function (r) { return { tahun: r[0], pct: r[1] }; });
  var gotData = GOT_DEFAULT, gotHolder = null;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = function (n) { return Number(n).toLocaleString('en-US'); };
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function onView(node, fn) {
    if (!('IntersectionObserver' in window) || reduce) { fn(); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); fn(); }
    }, { threshold: 0.2 });
    io.observe(node);
  }
  function countUp(node, to) {
    if (reduce) { node.textContent = fmt(to); return; }
    var t0 = null, dur = 1300;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      node.textContent = fmt(Math.round(to * e));
      if (p < 1) requestAnimationFrame(step);
    }
    node.textContent = '0';
    requestAnimationFrame(step);
  }

  function normalise(rows) {
    return rows.map(function (o) {
      var bil = parseInt(String(o.bil || '').replace(/[^\d]/g, ''), 10);
      var akan = /akan/i.test(o.status || '') || isNaN(bil);
      return { nama: o.konvokesyen, tahun: o.tahun || '', bil: akan ? null : bil, akan: akan };
    }).filter(function (r) { return r.nama; });
  }

  function paintGot() {
    if (!gotHolder) return;
    gotHolder.textContent = '';
    var d = gotData;
    if (!d.length) return;
    var panel = el('section', 'panel got-panel'); panel.id = 'got';
    var head = el('div', 'panel-head'); head.appendChild(el('h2', null, 'Graduate On Time (GOT)'));
    panel.appendChild(head);
    panel.appendChild(el('p', null, 'Peratusan graduan yang menamatkan pengajian dalam tempoh yang ditetapkan, mengikut tahun.'));
    var last = d[d.length - 1];
    var hi = d.reduce(function (m, r) { return !m || r.pct > m.pct ? r : m; }, null);
    var avg = d.reduce(function (s, r) { return s + r.pct; }, 0) / d.length;
    var tiles = el('div', 'stat-tiles');
    function tile(l, v, n) {
      var t = el('div', 'stat-tile');
      t.appendChild(el('span', 'stat-tile-l', l)); t.appendChild(el('b', 'stat-tile-v', v)); t.appendChild(el('span', 'stat-tile-n', n));
      tiles.appendChild(t);
    }
    tile('Terkini', last.pct.toFixed(2) + '%', 'Tahun ' + last.tahun);
    tile('Tertinggi', hi.pct.toFixed(2) + '%', 'Tahun ' + hi.tahun);
    tile('Purata', avg.toFixed(2) + '%', d[0].tahun + ' hingga ' + last.tahun);
    panel.appendChild(tiles);
    var cols = el('ol', 'got-chart'); cols.setAttribute('role', 'list');
    var bars = [];
    d.forEach(function (r) {
      var li = el('li', 'got-col' + (r === hi ? ' is-hi' : '') + (r === last ? ' is-latest' : ''));
      var v = el('span', 'got-val', r.pct.toFixed(2));
      var area = el('span', 'got-area'); area.setAttribute('aria-hidden', 'true');
      var bar = el('span', 'got-bar'); bar.dataset.h = Math.max(Math.min(r.pct, 100), 1).toFixed(2);
      area.appendChild(bar); bars.push(bar);
      li.appendChild(v); li.appendChild(area); li.appendChild(el('span', 'got-yr', r.tahun));
      cols.appendChild(li);
    });
    panel.appendChild(cols);
    var note = el('p', 'muted-note stat-note', 'Peratus GOT mengikut tahun graduasi.');
    panel.appendChild(note);
    gotHolder.appendChild(panel);
    onView(cols, function () {
      bars.forEach(function (b, i) {
        if (reduce) { b.style.height = b.dataset.h + '%'; return; }
        setTimeout(function () { b.style.height = b.dataset.h + '%'; }, i * 60);
      });
    });
  }

  function render(data) {
    var done = data.filter(function (r) { return !r.akan; });
    var total = done.reduce(function (s, r) { return s + r.bil; }, 0);
    var latest = done[done.length - 1];
    var max = done.reduce(function (m, r) { return !m || r.bil > m.bil ? r : m; }, null);
    var first = done[0];
    root.textContent = '';

    // --- Hero ---
    var hero = el('section', 'panel stat-hero');
    hero.appendChild(el('p', 'stat-kicker', 'Jumlah graduan Politeknik Balik Pulau'));
    var big = el('div', 'stat-big'), num = el('span', 'stat-num', fmt(total));
    num.setAttribute('aria-label', fmt(total) + ' graduan');
    big.appendChild(num); big.appendChild(el('span', 'stat-unit', 'graduan'));
    hero.appendChild(big);
    hero.appendChild(el('p', 'stat-sub', first ? 'sejak ' + first.tahun + ' melalui ' + done.length + ' majlis konvokesyen dan penyampaian diploma' : ''));
    root.appendChild(hero);
    onView(hero, function () { countUp(num, total); });

    // --- Kad ---
    var tiles = el('div', 'stat-tiles');
    function tile(label, value, note) {
      var t = el('div', 'stat-tile');
      t.appendChild(el('span', 'stat-tile-l', label));
      t.appendChild(el('b', 'stat-tile-v', value));
      t.appendChild(el('span', 'stat-tile-n', note));
      tiles.appendChild(t);
    }
    if (latest) tile('Terbaharu', fmt(latest.bil), latest.nama + (latest.tahun ? ' (' + latest.tahun + ')' : ''));
    if (max) tile('Paling ramai', fmt(max.bil), max.nama + (max.tahun ? ' (' + max.tahun + ')' : ''));
    tile('Majlis diadakan', String(done.length), 'sejak ' + (first ? first.tahun : ''));
    root.appendChild(tiles);

    // --- Carta ---
    var panel = el('section', 'panel');
    var head = el('div', 'panel-head'); head.appendChild(el('h2', null, 'Graduan Mengikut Konvokesyen'));
    panel.appendChild(head);
    var list = el('ol', 'stat-chart');
    var peak = max ? max.bil : 1;
    var bars = [];
    data.forEach(function (r) {
      var li = el('li', 'stat-row' + (r === latest ? ' is-latest' : '') + (r.akan ? ' is-next' : ''));
      var lab = el('span', 'stat-lab', r.nama + (r.tahun ? ' · ' + r.tahun : ''));
      var val = el('span', 'stat-val', r.akan ? 'Akan datang' : fmt(r.bil));
      var track = el('span', 'stat-track'); track.setAttribute('aria-hidden', 'true');
      var bar = el('span', 'stat-bar');
      if (!r.akan) { bar.dataset.w = Math.max(r.bil / peak * 100, 1.5).toFixed(1); bars.push(bar); }
      track.appendChild(bar);
      li.appendChild(lab); li.appendChild(track); li.appendChild(val);
      list.appendChild(li);
    });
    panel.appendChild(list);
    var note = el('p', 'muted-note stat-note');
    note.appendChild(document.createTextNode('Bilangan graduan mengikut majlis konvokesyen. Dikemas kini: '));
    var tt = el('span', 'tt', root.getAttribute('data-kemaskini') || '');
    note.appendChild(tt);
    note.appendChild(document.createTextNode('.'));
    panel.appendChild(note);
    root.appendChild(panel);
    gotHolder = el('div', 'got-holder'); root.appendChild(gotHolder); paintGot();
    onView(list, function () {
      bars.forEach(function (b, i) {
        if (reduce) { b.style.width = b.dataset.w + '%'; return; }
        setTimeout(function () { b.style.width = b.dataset.w + '%'; }, i * 45);
      });
    });
    if (window.PBU_LOAD && window.PBU_FMT) {
      window.PBU_LOAD('Tetapan', ['kunci']).then(function (rows) {
        rows.forEach(function (r) {
          var v = r.teks || r.tarikh || r.nilai;
          if (r.kunci && v && r.kunci.toLowerCase() === 'stat_kemaskini') tt.textContent = window.PBU_FMT(v);
        });
      }).catch(function () {});
    }
  }

  render(DEFAULT);
  if (window.PBU_LOAD) {
    window.PBU_LOAD('GOT', ['tahun', 'peratus']).then(function (rows) {
      var g = rows.filter(function (o) { return !/^(tidak|no|x|0|false|n)$/i.test(o.papar || ''); }).map(function (o) {
        return { tahun: String(o.tahun).trim(), pct: parseFloat(String(o.peratus).replace('%', '').replace(',', '.')) };
      }).filter(function (r) { return r.tahun && isFinite(r.pct); });
      if (g.length) { gotData = g; paintGot(); }
    }).catch(function () { /* kekalkan data lalai */ });
    window.PBU_LOAD('Statistik', ['konvokesyen', 'bil']).then(function (rows) {
      rows = rows.filter(function (o) { return !/^(tidak|no|x|0|false|n)$/i.test(o.papar || ''); });
      var d = normalise(rows);
      if (d.length) render(d);
    }).catch(function () { /* kekalkan data lalai */ });
  }
})();
