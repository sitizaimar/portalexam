PORTAL UNIT PEPERIKSAAN DAN PENILAIAN - POLITEKNIK BALIK PULAU

Kandungan:
  index.html        - halaman utama
  pelajar.html, pensyarah.html, graduan.html, borang.html, keputusan.html,
  jadual.html, gradeguard.html, faq.html, mengenai.html, hebahan.html
  pbu-gradeguard.html - sistem semakan lembaran markah (dibuka melalui butang di halaman PBU GradeGuard)
  style.css, script.js - reka bentuk dan fungsi yang dikongsi semua halaman
  images/           - gambar kampus dan logo

Semua fail dan folder mesti kekal dalam satu tempat (satu folder yang sama).

Cara letak di GitHub Pages:
  1. Di github.com, buat repositori baharu (Public), contoh: pbu-portal.
  2. Klik Add file > Upload files. Ekstrak zip ini, kemudian seret SEMUA fail
     dan folder images ke dalam GitHub. Klik Commit changes.
  3. Pergi ke Settings > Pages. Pilih Deploy from a branch, branch main,
     folder / (root), kemudian Save.
  4. Selepas 1 hingga 2 minit, alamat portal muncul di halaman yang sama:
     https://nama-akaun.github.io/pbu-portal/

Mengemas kini kandungan (versi Google Sheet):
  Hebahan, dokumen/borang dan FAQ dibaca dari Google Sheet. Anda hanya edit Sheet,
  tidak perlu sentuh HTML.
  1. Buka Google Drive > Baharu > Muat naik fail > pilih templat-portal-pbu.xlsx.
     Klik dua kali fail, pilih Open with Google Sheets, kemudian Fail > Simpan sebagai Google Sheets.
  2. Dalam Google Sheets: Kongsi > Akses am > Sesiapa yang mempunyai pautan > Viewer.
  3. Salin SHEET_ID dari alamat Sheet (bahagian antara /d/ dan /edit).
  4. Buka config.js di GitHub (ikon pensel), tampal ke SHEET_ID: "...", Commit changes.
  5. Selepas itu, edit hanya Google Sheet. Perubahan muncul dalam beberapa minit.
  Semak sambungan: tambah ?semak=1 pada alamat portal, contoh .../index.html?semak=1
  Jika Sheet gagal dibaca, portal masih memaparkan kandungan tetap dalam fail HTML.
  Jangan letak maklumat sulit dalam Sheet.

Teks lain (langkah, notis, hubungi kami): edit fail .html, cari perkataan GANTI.
