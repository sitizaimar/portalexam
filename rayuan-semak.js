/* Semakan status rayuan - membaca Apps Script (URL dalam config.js: RAYUAN_API) */
(function () {
  var API = (window.PBU_CONFIG && window.PBU_CONFIG.RAYUAN_API) || "";
  var wrap = document.getElementById("rs-wrap");
  if (!wrap || !API) return;               // tiada URL = bahagian ini kekal tersembunyi
  var HARI_LANJUT = 14;                    // paparan kekal sekian hari selepas tarikh keputusan rayuan
  var BM = { jan: 0, feb: 1, mac: 2, apr: 3, mei: 4, jun: 5, jul: 6, ogo: 7, ogos: 7, sep: 8, sept: 8, okt: 9, nov: 10, dis: 11 };
  function tarikhBM(s) {
    s = String(s || "").trim(); var m;
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return new Date(+m[1], +m[2] - 1, +m[3]);
    if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s))) return new Date(+m[3], +m[2] - 1, +m[1]);
    if ((m = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/.exec(s)) && BM[m[2].toLowerCase()] !== undefined) return new Date(+m[3], BM[m[2].toLowerCase()], +m[1]);
    var d = new Date(s); return isNaN(d) ? null : d;
  }
  function buka() { wrap.hidden = false; }
  // Paparan mengikut tarikh dalam Sheet (Tetapan): rayuan_mula hingga rayuan_keputusan + 14 hari.
  // Boleh dipaksa: kunci semak_rayuan, ruang Teks = Ya (sentiasa buka) / Tidak (sentiasa tutup) / kosong (automatik).
  // Pilihan: kunci semak_rayuan_hingga, ruang Tarikh = tarikh akhir paparan.
  if (typeof window.PBU_LOAD !== "function") { buka(); }
  else {
    window.PBU_LOAD("Tetapan", ["kunci"]).then(function (rows) {
      var k = {}; rows.forEach(function (r) { k[(r.kunci || "").toLowerCase()] = r; });
      var mod = ((k.semak_rayuan && k.semak_rayuan.teks) || "").trim().toLowerCase();
      if (mod === "ya") return buka();
      if (mod === "tidak") return;
      var mula = k.rayuan_mula && tarikhBM(k.rayuan_mula.tarikh || k.rayuan_mula.teks);
      var hingga = k.semak_rayuan_hingga && tarikhBM(k.semak_rayuan_hingga.tarikh || k.semak_rayuan_hingga.teks);
      if (!hingga) {
        var kep = k.rayuan_keputusan && tarikhBM(k.rayuan_keputusan.tarikh || k.rayuan_keputusan.teks);
        if (kep) hingga = new Date(kep.getFullYear(), kep.getMonth(), kep.getDate() + HARI_LANJUT);
      }
      var kini = new Date();
      if (!mula || !hingga) return buka();          // tarikh tidak lengkap: jangan sembunyikan
      hingga = new Date(hingga.getFullYear(), hingga.getMonth(), hingga.getDate() + 1);   // termasuk hari akhir
      if (kini >= mula && kini < hingga) buka();
    }).catch(buka);                                 // Sheet tidak dapat dibaca: paparkan
  }

  var BLN = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
  function tkh(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
    return m ? (+m[3]) + " " + BLN[+m[2] - 1] + " " + m[1] : "";
  }
  var STATUS = {
    "diterima": { c: "ok", t: "Telah diterima dan sedang diproses",
      p: "Permohonan anda telah diterima dan sedang diproses." },
    "tiada resit": { c: "bad", t: "Dokumen tidak lengkap (tiada resit bayaran)",
      p: "Resit bayaran tidak disertakan. Sila hubungi Unit Peperiksaan." },
    "tiada surat rayuan": { c: "bad", t: "Dokumen tidak lengkap (tiada surat rayuan)",
      p: "Surat rayuan tidak disertakan. Sila hubungi Unit Peperiksaan." },
    "ditolak lewat": { c: "bad", t: "Ditolak (dihantar selepas tarikh tutup)",
      p: "Permohonan anda ditolak kerana diterima selepas tarikh tutup rayuan." },
    "selesai": { c: "done", t: "Selesai",
      p: "Sila rujuk Penasihat Akademik untuk keputusan rayuan atau semak Modul i-Exam SPMP. Jika tiada perubahan, bermakna permohonan anda tidak berjaya." }
  };

  var form = document.getElementById("rs-form"), inp = document.getElementById("rs-m"),
      out = document.getElementById("rs-out"), btn = form.querySelector("button");

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  function mesej(cls, tajuk, teks) {
    out.textContent = "";
    var b = el("div", "rs-res " + cls); b.appendChild(el("b", "", tajuk)); if (teks) b.appendChild(el("p", "", teks));
    out.appendChild(b); return b;
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var m = inp.value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,20}$/.test(m)) { mesej("bad", "Nombor matrik tidak sah", "Taip nombor matrik tanpa jarak atau simbol."); return; }
    btn.disabled = true; mesej("wait", "Menyemak...", "");
    var tamat = new AbortController(), t = setTimeout(function () { tamat.abort(); }, 15000);
    fetch(API + (API.indexOf("?") < 0 ? "?" : "&") + "m=" + encodeURIComponent(m), { signal: tamat.signal })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) {
          if (d.ralat === "sibuk") return mesej("bad", "Sistem sibuk", "Terlalu banyak semakan serentak. Cuba semula seminit lagi.");
          if (d.ralat === "format") return mesej("bad", "Nombor matrik tidak sah", "Taip nombor matrik tanpa jarak atau simbol.");
          return mesej("bad", "Semakan tidak dapat dilakukan", "Cuba semula kemudian atau hubungi Unit Peperiksaan.");
        }
        if (!d.rekod.length) {
          return mesej("none", "Tiada permohonan direkodkan",
            "Rekod dikemas kini dalam tempoh 2 hari bekerja selepas surat rayuan diterima. Jika anda sudah menghantar surat rayuan, rekod mungkin belum dikemas kini" +
            (d.kemaskini ? " (kemas kini terakhir: " + tkh(d.kemaskini) + ")" : "") +
            ". Sila semak semula selepas 2 hari bekerja atau hubungi Unit Peperiksaan.");
        }
        out.textContent = "";
        d.rekod.forEach(function (r) {
          var s = STATUS[r.status]; if (!s) return;
          var b = el("div", "rs-res " + s.c);
          var top = el("div", "rs-top");
          top.appendChild(el("span", "rs-badge", s.t));
          var meta = [r.jenis, r.kursus].filter(Boolean).join(" · ");
          if (meta) top.appendChild(el("span", "rs-meta", meta));
          b.appendChild(top); b.appendChild(el("p", "", s.p));
          if (r.kemaskini) b.appendChild(el("small", "", "Dikemas kini: " + tkh(r.kemaskini)));
          out.appendChild(b);
        });
      })
      .catch(function () { mesej("bad", "Semakan tidak dapat dilakukan", "Sila semak sambungan internet dan cuba semula."); })
      .then(function () { clearTimeout(t); btn.disabled = false; });
  });
})();
