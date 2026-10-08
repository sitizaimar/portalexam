/**
 * SEMAKAN STATUS RAYUAN - Unit Peperiksaan dan Penilaian PBU
 *
 * Skrip ini mesti dibuat DARIPADA Google Sheet rayuan (Extensions > Apps Script),
 * supaya ia terikat kepada Sheet tersebut. Sheet mesti ada tab bernama "Rayuan"
 * dengan lajur:  A No. Matrik | B Jenis | C Kursus | D Status | E Tarikh Terima | F Tarikh Kemas Kini
 *
 * Nilai lajur Status (hanya lima): Diterima | Tiada resit | Tiada surat rayuan | Ditolak lewat | Selesai
 *
 * DEPLOY:  Deploy > New deployment > Web app
 *          Execute as: Me
 *          Who has access: Anyone
 * Salin URL yang berakhir dengan /exec, tampal ke RAYUAN_API dalam config.js portal.
 * Setiap kali kod ini diubah: Deploy > Manage deployments > Edit > New version.
 */
var NAMA_TAB = 'Rayuan';
var STATUS_SAH = ['diterima', 'tiada resit', 'tiada surat rayuan', 'ditolak lewat', 'selesai'];
var HAD_CARIAN_SEMINIT = 90;   // jumlah carian dibenarkan seminit (semua pengguna)

function doGet(e) {
  var m = String((e && e.parameter && e.parameter.m) || '').trim().toUpperCase();

  // 1. Format nombor matrik mesti munasabah (huruf besar dan nombor sahaja)
  if (!/^[A-Z0-9]{6,20}$/.test(m)) return keluar_({ ok: false, ralat: 'format' });

  // 2. Had kadar carian, untuk mengelakkan imbasan beramai-ramai
  if (!benarkan_()) return keluar_({ ok: false, ralat: 'sibuk' });

  var sh = SpreadsheetApp.getActive().getSheetByName(NAMA_TAB);
  if (!sh) return keluar_({ ok: false, ralat: 'sistem' });
  var akhir = sh.getLastRow();
  var rekod = [];
  var kemaskiniTerakhir = '';

  if (akhir >= 2) {
    var data = sh.getRange(2, 1, akhir - 1, 6).getValues();
    for (var i = 0; i < data.length; i++) {
      var tkr = tarikh_(data[i][5]);
      if (tkr && tkr > kemaskiniTerakhir) kemaskiniTerakhir = tkr;
      if (String(data[i][0]).trim().toUpperCase() !== m) continue;
      var st = String(data[i][3]).trim().toLowerCase();
      if (STATUS_SAH.indexOf(st) < 0) continue;   // abaikan baris tanpa status sah
      // Hanya medan minimum dipulangkan. Nama, gred dan keputusan TIDAK dipulangkan.
      rekod.push({ jenis: String(data[i][1]).trim(), kursus: String(data[i][2]).trim(),
                   status: st, kemaskini: tkr });
    }
  }
  rekod.sort(function (a, b) { return a.kemaskini < b.kemaskini ? 1 : -1; });
  return keluar_({ ok: true, rekod: rekod, kemaskini: kemaskiniTerakhir });
}

function tarikh_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
  return String(v || '').trim();
}

function benarkan_() {
  var c = CacheService.getScriptCache();
  var k = 'rl_' + Math.floor(Date.now() / 60000);
  var n = Number(c.get(k) || 0) + 1;
  c.put(k, String(n), 120);
  return n <= HAD_CARIAN_SEMINIT;
}

function keluar_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
