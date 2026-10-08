/* Tarikh-tarikh Penting (tab Pensyarah): kad tarikh tutup + garis masa.
   Data lalai (Memo Sesi I : 2026/2027) ada di bawah supaya halaman sentiasa berfungsi.
   Jika tab "Tarikh" dalam Google Sheet boleh dibaca, data Sheet menggantikannya.
   Lajur Sheet: fasa, aktiviti, tarikh, tanggungjawab, papar
   Fasa bernama "Key-in" dipaparkan sebagai kad tarikh tutup; fasa lain sebagai garis masa. */
(function () {
  var root = document.querySelector('[data-tp]');
  if (!root) return;

  var DEFAULT = [
    ['Key-in', 'Key-in Markah PB (Semua Kursus)', '13 Oktober 2026 (Selasa)', 'Pensyarah Kursus'],
    ['Key-in', 'Key-in Markah PA (Semua Kursus)', '19 November 2026 (Khamis)', 'Pensyarah Kursus'],
    ['Sebelum Peperiksaan', 'Menerima Senarai Nama Pelajar Tidak Layak Menduduki Peperiksaan / Dimansuhkan Markah PB (Kehadiran Kurang 80%)', 'Sebelum atau pada 5 Okt 2026 (Isnin)', 'KJ / KPro / KK'],
    ['Sebelum Peperiksaan', 'Mengeluarkan Memo Kepada Pelajar Tidak Layak / Dimansuhkan Markah PB (Kehadiran Kurang 80%)', '6 Okt 2026 (Selasa)', 'KUPep / Penasihat Akademik'],
    ['Sebelum Peperiksaan', 'Menerima Senarai Nama Pelajar Tidak Layak Menduduki Peperiksaan Akhir (PB Kurang 40%)', '14 Okt 2026 (Rabu)', 'KJ / KPro / KK'],
    ['Sebelum Peperiksaan', 'Mengeluarkan Memo Kepada Pelajar Tidak Layak Menduduki Peperiksaan Akhir (PB Kurang 40%)', '15 Okt 2026 (Khamis)', 'KUPep / Penasihat Akademik'],
    ['Tempoh Peperiksaan', 'Tempoh Pentaksiran Akhir (Institusi)', '14 Okt (Rabu) – 5 Nov 2026 (Khamis)', 'Penyelaras FA / PK'],
    ['Tempoh Peperiksaan', 'Tempoh Peperiksaan Akhir (Selaras)', '18 Okt 2026 (Ahad) – 4 Nov 2026 (Rabu)', 'UPep / PPJ / Pengawas'],
    ['Selepas Peperiksaan', 'Proses dan Semak Lembaran Markah', '20 Nov 2026 (Jumaat)', 'UPep / PPJ'],
    ['Selepas Peperiksaan', 'Mesyuarat Peperiksaan Peringkat Jabatan', '23 Nov 2026 (Isnin)', 'KJ / PPJ'],
    ['Selepas Peperiksaan', 'Mesyuarat Jawatankuasa Peperiksaan Politeknik', '24 Nov 2026 (Selasa)', 'KUPep / JKPEP'],
    ['Selepas Peperiksaan', 'Tarikh Keputusan Rasmi Sesi I : 2026/2027', '26 Nov 2026 (Khamis)', 'KUPep'],
    ['Rayuan', 'Tarikh Tutup Rayuan Keputusan / Semakan Semula Penilaian', '7 Dis 2026 (Isnin)', 'KUPep / Penasihat Akademik'],
    ['Rayuan', 'Mesyuarat Jawatankuasa Peperiksaan Politeknik untuk Kes Rayuan', '11 Dis 2026 (Jumaat)', 'KUPep / JKPEP'],
    ['Rayuan', 'Keputusan Rayuan Dimaklumkan Kepada Pelajar', '14 Dis 2026 (Isnin)', 'KUPep / Penasihat Akademik'],
    ['Penilaian Khas', 'Penilaian Khas Sesi I : 2026/2027', '14 Dis 2026 (Isnin) – 7 Jan 2027 (Khamis)', 'Pensyarah Kursus / UPep'],
    ['Penilaian Khas', 'Mesyuarat Jawatankuasa Peperiksaan Politeknik untuk Penilaian Khas', '8 Jan 2027 (Jumaat)', 'KUPep / JKPEP'],
    ['Penilaian Khas', 'Keputusan Penilaian Khas Dimaklumkan Kepada Pelajar', '11 Jan 2027 (Isnin)', 'KUPep / Penasihat Akademik']
  ].map(function (r) { return { fasa: r[0], aktiviti: r[1], tarikh: r[2], tg: r[3] }; });

  var ABBR = [['KJ', 'Ketua Jabatan'], ['KPro', 'Ketua Program'], ['KK', 'Ketua Kursus'], ['PK', 'Pensyarah Kursus'], ['FA', 'Final Assessment'], ['KUPep', 'Ketua Unit Peperiksaan'], ['UPep', 'Unit Peperiksaan'],
    ['PPJ', 'Penyelaras Peperiksaan Jabatan'], ['JKPEP', 'Jawatankuasa Peperiksaan Politeknik'],
    ['PB', 'Pentaksiran Berterusan'], ['PA', 'Penilaian Akhir']];
  var BLN = { jan: 0, feb: 1, mac: 2, apr: 3, mei: 4, jun: 5, jul: 6, ogo: 7, sep: 8, okt: 9, nov: 10, dis: 11 };

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  // Ambil tarikh mula & tamat daripada teks (contoh "14 Okt (Rabu) – 5 Nov 2026 (Khamis)")
  function range(t) {
    var re = /(\d{1,2})\s+([A-Za-z]{3,})[a-z]*\.?(?:\s*\([^)]*\))?(?:\s+(\d{4}))?/g, m, out = [];
    while ((m = re.exec(t || ''))) {
      var mo = BLN[m[2].slice(0, 3).toLowerCase()];
      if (mo !== undefined) out.push({ d: +m[1], m: mo, y: m[3] ? +m[3] : null });
    }
    if (!out.length) return null;
    var yr = null;
    for (var i = out.length - 1; i >= 0; i--) { if (out[i].y) yr = out[i].y; else if (yr) out[i].y = yr; }
    if (out.some(function (o) { return !o.y; })) return null;
    var f = out[0], l = out[out.length - 1];
    return { s: new Date(f.y, f.m, f.d), e: new Date(l.y, l.m, l.d, 23, 59, 59) };
  }

  function normalise(rows) {
    return rows.map(function (o) {
      return { fasa: (o.fasa || '').trim(), aktiviti: o.aktiviti, tarikh: o.tarikh, tg: o.tanggungjawab || '' };
    }).filter(function (r) { return r.aktiviti && r.tarikh; });
  }

  function chips(tg) {
    var w = el('div', 'tp-tg');
    String(tg).split(/\s*\/\s*/).filter(Boolean).forEach(function (x) { w.appendChild(el('span', 'tp-chip', x)); });
    return w;
  }

  function render(data) {
    root.textContent = '';
    var now = new Date();
    var dl = data.filter(function (r) { return /^key-?in$/i.test(r.fasa); });
    var rest = data.filter(function (r) { return !/^key-?in$/i.test(r.fasa); });

    if (dl.length) {
      var dg = el('div', 'tp-deadlines');
      dl.forEach(function (r) {
        var c = el('div', 'tp-dl');
        var rg = range(r.tarikh);
        var left = rg ? Math.ceil((rg.e - now) / 864e5) : null;
        c.appendChild(el('span', 'tp-dl-k', 'Tarikh tutup'));
        c.appendChild(el('b', 'tp-dl-t', r.aktiviti));
        var dt = r.tarikh.replace(/\s*\(([^)]*)\)\s*$/, '');
        var hr = (r.tarikh.match(/\(([^)]*)\)\s*$/) || [])[1];
        c.appendChild(el('span', 'tp-dl-d', dt));
        if (hr) c.appendChild(el('span', 'tp-dl-h', hr));
        if (left !== null) {
          c.appendChild(el('span', 'tp-dl-c' + (left < 0 ? ' past' : ''),
            left < 0 ? 'Telah tamat' : left === 0 ? 'Hari ini' : left + ' hari lagi'));
        }
        if (r.tg) c.appendChild(chips(r.tg));
        dg.appendChild(c);
      });
      root.appendChild(dg);
    }

    var phases = [], map = {};
    rest.forEach(function (r) {
      var k = r.fasa || 'Lain-lain';
      if (!map[k]) { map[k] = { n: k, items: [] }; phases.push(map[k]); }
      map[k].items.push(r);
    });
    var nextSet = false;
    phases.forEach(function (ph) {
      var sec = el('section', 'tp-phase');
      sec.appendChild(el('h3', 'tp-ph', ph.n));
      var ol = el('ol', 'tp-list');
      ph.items.forEach(function (r) {
        var rg = range(r.tarikh), cls = 'tp-item', tag = '';
        if (rg) {
          if (rg.e < now) { cls += ' is-past'; tag = 'Selesai'; }
          else if (rg.s <= now) { cls += ' is-now'; tag = 'Sedang berjalan'; nextSet = true; }
          else if (!nextSet) { cls += ' is-next'; tag = 'Seterusnya'; nextSet = true; }
        }
        var li = el('li', cls);
        li.appendChild(el('span', 'tp-date', r.tarikh));
        var b = el('div', 'tp-body');
        var top = el('div', 'tp-top');
        top.appendChild(el('b', null, r.aktiviti));
        if (tag) top.appendChild(el('span', 'tp-tag', tag));
        b.appendChild(top);
        if (r.tg) b.appendChild(chips(r.tg));
        li.appendChild(b);
        ol.appendChild(li);
      });
      sec.appendChild(ol);
      root.appendChild(sec);
    });

    var det = el('details', 'tp-abbr');
    det.appendChild(el('summary', null, 'Singkatan'));
    var ul = el('p', 'muted-note');
    ul.textContent = ABBR.map(function (a) { return a[0] + ' = ' + a[1]; }).join(' · ');
    det.appendChild(ul);
    root.appendChild(det);
  }

  render(DEFAULT);
  if (window.PBU_LOAD) {
    window.PBU_LOAD('Tarikh', ['aktiviti', 'tarikh']).then(function (rows) {
      rows = rows.filter(function (o) { return !/^(tidak|no|x|0|false|n)$/i.test(o.papar || ''); });
      var d = normalise(rows);
      if (d.length) render(d);
    }).catch(function () { /* kekalkan data lalai */ });
  }
})();
