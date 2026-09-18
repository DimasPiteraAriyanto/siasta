# DOKUMENTASI LENGKAP PENGEMBANGAN & PERUBAHAN SISTEM SIASTA
**Sistem Informasi Alih Media Arsip Statis (SIASTA)**  
*Dinas Kearsipan dan Perpustakaan Daerah Kabupaten Manggarai Barat*

---

## 📌 Ringkasan Proyek & Status Terakhir
- **Platform**: Google Apps Script (GAS) Web Application terintegrasi Google Sheets & Google Drive
- **ID Deployment Aktif**: `AKfycbxIbcIiJY3FpeBJM9hC40_GYXNz-hIWgIcVZyvIm1NQaSj2TeJ5lxQ4VsG1OxEw077B`
- **Versi Terakhir**: **Versi 39**
- **URL Aplikasi**: [https://script.google.com/macros/s/AKfycbxIbcIiJY3FpeBJM9hC40_GYXNz-hIWgIcVZyvIm1NQaSj2TeJ5lxQ4VsG1OxEw077B/exec](https://script.google.com/macros/s/AKfycbxIbcIiJY3FpeBJM9hC40_GYXNz-hIWgIcVZyvIm1NQaSj2TeJ5lxQ4VsG1OxEw077B/exec)
- **ID Basis Data (Spreadsheet)**: `1eERa08ccRqPJp7r_iGddzcnWnI1NnYn4UDl3_60CzK0`

---

## 📜 Kronologi Riwayat Perubahan (Changelog)

### Versi 39 — Penerapan 9 Butir Revisi SIASTA (Google Docs Revision Guide)
- **Latar Belakang**: Mengimplementasikan seluruh 9 butir revisi dan penyempurnaan sistem yang tercantum pada dokumen panduan revisi SIASTA (`REVISI SIASTA — Untuk Diteruskan ke AI Programmer`).
- **Modifikasi Berkas**:
  1. `Login.html`:
     - **In-Page 2-Step Authentication**: Form login beralih mulus dari langkah 1 (input identitas/username) ke langkah 2 (input PIN/password) dalam satu halaman dinamis tanpa reload atau perpindahan URL eksternal.
     - **State & Feedback**: Dilengkapi modal loading interaktif `Swal.showLoading()`, penanganan keyboard Enter yang presisi, dan tombol kembali ("Kembali ke Input Identitas") yang mengembalikan tampilan ke langkah 1 secara instan.
  2. `DashboardBA.html` & `DaftarArsip.html`:
     - **Cetak Dokumen Anti-Popup Blocker**: Menggantikan mekanisme cetak lama dengan teknik hidden `<iframe>` (`printElement()`) yang memuat naskah dan memicu `window.print()` secara mandiri tanpa terblokir oleh fitur popup-blocker browser.
     - **Toolbar Switch Penandatangan**: Menambahkan tombol switch interaktif untuk menampilkan/menyembunyikan blok tanda tangan Kepala Dinas/Kabid maupun Pelaksana secara independen sebelum dicetak.
  3. `GenerateLaporan.html`:
     - **Toggle Pengesahan Laporan Fleksibel**: Panel konfigurasi laporan kini menyediakan master checkbox ("Gunakan Blok Pengesahan Ini") untuk Penandatangan 1 dan Penandatangan 2 secara terpisah. Jika dimatikan, seluruh blok tanda tangan terkait (termasuk "Mengetahui,", tanggal Labuan Bajo, nama pejabat, NIP, serta ruang kosongnya) benar-benar lenyap dari naskah cetak dan ekspor.
     - **Integrasi Pilihan Staf**: Pilihan penandatangan terhubung langsung dengan data staf aktif dari `master_staf`.
  4. `Config.gs` & `ClientScript.html`:
     - **Penampungan Logo Kop Manggarai Barat**: Struktur penampungan Base64 logo Manggarai Barat pada `CONFIG.LOGO_MABAR` dan `window._logoMabar` telah disiapkan dan disematkan secara konsisten ke seluruh kop naskah dinas cetak maupun generator dokumen.
  5. `InputArsip.html`, `DriveService.gs`, `ArsipService.gs`, `DashboardBA.html`, `DaftarArsip.html`, & `GenerateLaporan.html`:
     - **Watermark Riil Hanya Pada File Input**: Menghapus seluruh elemen watermark CSS overlay (`<div class="watermark-pdf-overlay">`) dari naskah cetak Berita Acara, Rekapitulasi, dan Laporan.
     - **Stempel Watermark Visual Canvas**: Pada halaman Input Arsip, saat pengguna mengunggah foto berkas, stempel watermark resmi ("ARSIP STATIS DINAS KEARSIPAN KAB. MANGGARAI BARAT - HAK AKSES TERBATAS") langsung dibubuhkan secara permanen pada canvas gambar, lalu berkas bertanda air tersebut disimpan ke folder Google Drive `Arsip Digital/Akses/` bersamaan dengan berkas asli di `Arsip Digital/Pelestarian/`.
  6. `Pengaturan.html`:
     - **Unifikasi Pejabat Penandatangan ke Kelola Staf**: Menghilangkan form input teks manual pejabat tanda tangan di Tab 3 Pengaturan yang sebelumnya menduplikasi data. Sumber data pejabat kini 100% bersumber tunggal dari `master_staf`. Tab 3 kini menampilkan kartu spesimen TTD dummy tinta biru resmi pelaksana serta shortcut cepat menuju menu Kelola Staf.
  7. `Code.gs`:
     - **Fungsi Setup Mandiri `JALANKAN_SETUP_SEKALI_SAJA()`**: Disediakan fungsi setup sekali jalan di Apps Script (`JALANKAN_SETUP_SEKALI_SAJA()` / `setupSIASTA()`) yang menginisialisasi ke-8 sheet database dengan header lengkap, menginput akun staf awal, mengisi master kode OPD, dan membangun folder Google Drive `SIASTA/Arsip Digital/` secara otomatis.
  8. `BeritaAcaraService.gs`, `LaporanService.gs`, `DashboardBA.html`, & `GenerateLaporan.html`:
     - **Ekspor Dokumen ke Google Docs Asli (Native Docs)**:
       - Menambahkan fungsi `exportBAToGoogleDoc()` dan `exportLaporanToGoogleDoc()` menggunakan `DocumentApp`.
       - Naskah Berita Acara dan Laporan Rekapitulasi dapat langsung diekspor dan disimpan ke folder Google Drive masing-masing (`Berita Acara/` dan `Laporan/`) dengan format naskah dinas, penomoran, kop surat, dan tabel rapi.
       - Menyediakan tombol `📄 Simpan sebagai Google Docs` di antarmuka frontend dengan notifikasi konfirmasi dan tautan langsung untuk membuka dokumen yang berhasil dibuat.
  9. `ArsipService.gs` & `Dashboard.html`:
     - **Grafik Dashboard Semua Tahun**:
       - `getDashboardStats()` kini mengagregasi data arsip seluruh tahun (`yearlyData`) dari sheet `master_arsip`.
       - Menambahkan tab filter `Semua Tahun` pada kartu grafik alih media di Dashboard utama, memungkinkan pengguna memantau akumulasi total berkas dan lembar arsip dari tahun ke tahun.

---

### Versi 38 — Pembersihan Data Dummy (Kecuali User), Integrasi Google Drive Aktif, & 1 TTD Dummy
- **Latar Belakang**: Memenuhi instruksi pengguna untuk mengosongkan seluruh data dummy arsip/BA/log tanpa menghapus data user, mengaktifkan alur penyimpanan berkas Google Drive untuk arsip yang diinput, serta menyematkan tepat 1 spesimen tanda tangan (TTD) dummy resmi.
- **Modifikasi Berkas**:
  1. `DummyData.gs`:
     - Menambahkan fungsi `clearAllDummyDataExceptUsers()`: mengosongkan baris data pada `master_arsip`, `berita_acara`, `log_aktivitas`, dan `log_akses` (header baris 1 tetap utuh), serta mempertahankan akun staf/user (`master_staf`) dan master kode OPD (`kode_asal_arsip`).
     - Menambahkan fungsi `inputSampleArsipToDrive()`: uji coba otomatis input 1 arsip riil dengan pengunggahan dokumen ke folder Google Drive dan pencatatan tautannya.
  2. `Code.gs`, `BeritaAcaraService.gs`, `ArsipService.gs`, & `LaporanService.gs`:
     - **Penonaktifan Auto-Seed Liar**: Menghapus seluruh pemanggilan otomatis `seedFullDummyData(false)`. Saat database kosong, sistem menampilkan status bersih (empty state) tanpa memunculkan data palsu secara tiba-tiba.
  3. `DriveService.gs`:
     - Menambahkan proteksi dan auto-fallback pada `getFolderByPath` dan `createFolderStructure`: jika ID folder Google Drive belum diisi manual, sistem secara otomatis mencari atau membuat folder `SIASTA` di Google Drive pengguna.
  4. `Config.gs` & `ClientScript.html`:
     - Menyematkan aset Base64/SVG data URI untuk **1 Tanda Tangan (TTD) Dummy Resmi Pelaksana** bertinta biru transparan (`CONFIG.PEJABAT.PELAKSANA.TTD` / `CONFIG.DUMMY_TTD` dan `window._dummyTtd`).
  5. `DashboardBA.html` & `DaftarArsip.html`:
     - Menyematkan gambar TTD dummy pada kolom tanda tangan **Pelaksana Alih Media (Muhammad Dzaky Nathanegara, A.Md)** pada naskah cetak Berita Acara dan Rekapitulasi Alih Media A4 Landscape. Kolom Kepala Dinas dan Kabid tetap berupa ruang kosong untuk tanda tangan basah fisik.
  6. `Pengaturan.html`:
     - Menambahkan tombol aksi `🧹 Hapus Seluruh Data Dummy (Kecuali User)` dan `📥 Uji Input 1 Arsip ke Google Drive` di Tab 5 (Alat & Pengujian).
     - Menampilkan kartu pratinjau spesimen 1 TTD dummy pelaksana di Tab 3 (Tanda Tangan).
  7. `InputArsip.html`:
     - Menambahkan tombol `🧪 Isi Contoh Data Riil` untuk pengujian instan.
     - Memperjelas penanda bahwa setiap berkas yang diunggah otomatis tersimpan ke Google Drive (Pelestarian & Akses).

---

### Versi 37 — Perbaikan Format Tanggal Cetak Berita Acara (Eliminasi Nilai NaN)
- **Latar Belakang**: Pada teks paragraf pembuka naskah Berita Acara cetak, format tanggal numerik di dalam kurung sebelumnya sempat menampilkan `(18-NaN-2026)` karena indeks bulan numerik belum terpetakan ke objek respon frontend.
- **Modifikasi Berkas**:
  1. `BeritaAcaraService.gs`:
     - Menyediakan nilai integer bulan resmi (`bulan: blnIndex`), nomor urut bulan 1-12 (`bulanAngka: blnAngka`), dan string tanggal lengkap siap cetak (`tanggalAngkaLengkap: "18-06-2026"`).
  2. `DashboardBA.html`:
     - Memperbaiki binding elemen `doc-tgl-angka` agar memprioritaskan `tanggalAngkaLengkap` atau fallback kalkulasi aman dengan sanitasi `padZero()` yang menjamin format selalu menghasilkan angka tanggal valid (`18-06-2026`), bebas dari nilai `NaN`.

---

### Versi 36 — Penyelesaian Revisi Ke-3 (16 Kolom Rekapitulasi, Sinkronisasi Spreadsheet, & Optimasi Berita Acara)
- **Latar Belakang**: Menerapkan seluruh instruksi dari berkas `REVISI SIASTA.docx` (Revisi Ke-3).
- **Modifikasi Berkas**:
  1. `DaftarArsip.html` & `ArsipService.gs`:
     - **Tabel Rekapitulasi Alih Media Lengkap (16 Kolom)**: Menggantikan tabel 9 kolom menjadi 16 kolom penuh sesuai dengan atribut formulir input arsip:
       `No | No. Box | Kode Unik | Nomor Arsip Asli | Kode Klasifikasi | Uraian Informasi Arsip | Kurun Waktu | Jenis Arsip | Kategori Urusan | Unit Pengolah | Jumlah Berkas | Jumlah Lembar | Lokasi Simpan | Kondisi Fisik | Status Keterbukaan | Kesesuaian Standar`.
     - **Format Dokumen Cetak Dinas**: Tabel A4 landscape disesuaikan dengan proporsi kolom dan font yang presisi serta garis hitam tegas.
     - **Ekspor Excel (.csv)**: Menyertakan seluruh 16 kolom dengan UTF-8 BOM untuk kompatibilitas penuh dengan Microsoft Excel.
  2. `Database.gs` & `Code.gs`:
     - **Auto-Migration Kolom Spreadsheet (`ensureAllHeadersExist`)**: Menambahkan mekanisme sinkronisasi otomatis kolom pada baris 1 sheet `master_arsip`. Kolom-kolom baru (`nomor_asli`, `kode_klasifikasi_asli`, `kategori_urusan`, `kondisi_fisik`, `rangkap_ke`, dll.) kini otomatis disisipkan ke Google Sheets pengguna tanpa menghapus atau menggeser data yang sudah tersimpan.
     - `appendData()` dan `updateData()` kini secara dinamis mendeteksi dan membuat kolom baru di Google Sheets jika ada field baru yang disetor form.
  3. `DashboardBA.html`:
     - **Perbaikan Dropdown Staf Pelaksana**: Memperbaiki pemanggilan data staf aktif (`getAllStaf()`) dan caching instan sehingga pilihan staf pelaksana pada modal *➕ Terbitkan Berita Acara Baru* selalu terisi lengkap dan tidak pernah kosong lagi.
     - **Pembersihan Tombol Header**: Menghapus tombol redundan `👤 Form BA Per Staf` dan `👥 Form BA Gabungan`, cukup tombol utama `➕ Buat BA Baru` dan `🔄 Refresh`.
  4. `Layout.html`:
     - **Penyederhanaan Navigasi Sidebar**: Menghapus submenu `BA Per Staf` dan `BA Gabungan` dari navigasi sidebar. Menu Berita Acara kini berupa satu pintu masuk tunggal: **`📋 Berita Acara`**.

---

### Versi 35 — Penyesuaian Kurun Waktu Menjadi Tahun Tunggal
- **Latar Belakang**: Sesuai instruksi pengguna (*"kurun waktu akhir tidak digunakan tolong sesuaikan"*), konsep kurun waktu arsip yang awalnya berupa rentang tahun (`mulai s.d. akhir`) disederhanakan menjadi entri tahun pembuatan tunggal (contoh: `2004`).
- **Modifikasi Berkas**:
  1. `DetailArsip.html`:
     - Tampilan informasi arsip diubah dari `[tahun_mulai] s.d. [tahun_akhir]` menjadi hanya `[tahun_mulai]`.
     - Modal Edit Arsip: disederhanakan dari dua kolom input (*Kurun Waktu Mulai* & *Kurun Waktu Akhir*) menjadi 1 kolom tunggal **"Kurun Waktu (Tahun Pembuatan)"**.
     - Handler simpan edit otomatis mengosongkan parameter `kurun_waktu_akhir`.
  2. `InputArsip.html`:
     - Placeholder input disesuaikan menjadi `Contoh: 2004`.
     - Payload penyimpanan formulir menyetorkan `kurunWaktuMulai` sebagai tahun tunggal dan mengosongkan `kurunWaktuAkhir`.
  3. `LaporanService.gs`:
     - Kolom `kurun_waktu` pada Laporan Internal dan Laporan Eksternal ANRI menyajikan tahun pembuatan tunggal tanpa format `s.d.`.
  4. `ArsipService.gs`:
     - Fungsi penyimpanan dan ekspor Rekapitulasi Alih Media (Excel `.csv` maupun format cetak dokumen resmi dinas) menyajikan `kurunWaktu` murni dari tahun pembuatan tunggal.
  5. `BeritaAcaraService.gs`:
     - Perhitungan rentang periode kurun waktu arsip yang terhimpun dalam naskah Berita Acara dihitung secara otomatis dan akurat dari tahun pembuatan masing-masing arsip terpilih.

---

### Versi 34 — Penggantian Logo Pemkab Manggarai Barat & Watermark 3 Baris Seragam
- **Latar Belakang**: Sesuai instruksi pengguna (*"ganti logo jadi logo kabupaten manggarai barat berlaku untuk semua export pdf dan juga berikan watermark kesemua export pdf seperti Contoh_hasilalihmedia_watermark (1).pdf"*).
- **Modifikasi Berkas**:
  1. `Config.gs`:
     - Memasang aset Base64 PNG resolusi tinggi untuk **Lambang Resmi Kabupaten Manggarai Barat** (Komodo, rumah adat Mbaru Niang, bintang, padi & kapas, pita resmi) menggantikan placeholder generik.
     - Menyediakan konstanta dan style watermark seragam 3 baris diagonal.
  2. Dokumen Cetak & PDF Seragam:
     - **Berita Acara Alih Media** (`DashboardBA.html`): Memuat logo resmi Pemkab dan stempel watermark diagonal di latar belakang.
     - **Daftar Rekapitulasi Alih Media** (`DaftarArsip.html`): Kop surat resmi Pemkab Mabar dengan logo daerah dan watermark 3 baris saat dicetak / diekspor ke PDF.
     - **Laporan Alih Media Internal & Eksternal** (`GenerateLaporan.html`): Kop surat resmi Pemkab Mabar dengan logo daerah dan watermark pengaman.
     - Format Watermark Resmi:
       ```
       ARSIP HASIL ALIH MEDIA
       DINAS KEARSIPAN DAN PERPUSTAKAAN DAERAH
       KABUPATEN MANGGARAI BARAT
       ```
     - Dilengkapi aturan CSS cetak `@media print` dengan `print-color-adjust: exact` sehingga hasil cetak atau unduhan PDF mempertahankan logo tajam dan watermark transparan tanpa menutupi teks dokumen.

---

### Versi 33 — Penyelesaian Komprehensif Revisi SIASTA Lanjutan (Revisi Dokumen docx)
- **Latar Belakang**: Menerapkan seluruh butir revisi dari berkas `REVISI SIASTA (1).docx` beserta 2 referensi visual (Mockup Pengaturan & Berita Acara Fisik Resmi).
- **Modifikasi Berkas**:
  1. `DashboardBA.html`:
     - Pembuatan **Dashboard Berita Acara Terpadu**:
       - Ringkasan statistik (Total BA, BA Per Staf, BA Gabungan, Total Arsip).
       - Tabel riwayat dokumen BA terbit beserta tombol cetak format resmi dan hapus.
       - Tabel rekapitulasi bulanan 12 bulan (Januari - Desember) dengan badge status dan tombol penerbitan cepat.
       - Modal pembuatan BA cepat tanpa reload halaman.
  2. `BeritaAcaraService.gs`:
     - Format naskah Berita Acara Resmi persis sesuai dokumen fisik Pemkab Manggarai Barat:
       - Paragraf pembuka dengan hari, tanggal angka dan **terbilang**, bulan, tahun terbilang dan angka.
       - 5 poin rincian pelaksanaan (Jenis Kegiatan, Jenis Arsip, Jumlah Berkas/Lembar, Asal Arsip, Dasar Pelaksanaan Perbup No. 31 Tahun 2024).
       - Klausul UU No. 43 Tahun 2009 & Perka ANRI No. 9 Tahun 2018.
       - Pengesahan 2 kolom: Kepala Dinas (**Augustinus Rinus, S.Pd**) & Pelaksana Alih Media (**Muhammad Dzaky Nathanegara, A.Md**).
  3. `Pengaturan.html`:
     - Rekonstruksi halaman pengaturan menjadi 5 tab modern:
       - **Tab 1 - Profil Instansi**: Profil dinas, alamat kop, target tahunan, watermark default.
       - **Tab 2 - Template Dokumen**: Grid 6 kartu template dokumen kearsipan.
       - **Tab 3 - Tanda Tangan**: Pengelolaan data pejabat penandatangan dinas (Kadis, Kabid, Pelaksana) yang tersimpan persisten ke database sheet.
       - **Tab 4 - Asal Arsip**: Pengelolaan kode asal arsip OPD.
       - **Tab 5 - Alat & Pengujian**: Panel pemeliharaan teknis IT.
  4. `DaftarArsip.html` & `ArsipService.gs`:
     - Tombol **Export Rekapitulasi**:
       - Fitur unduh Excel (`.csv` dengan BOM UTF-8) ramah Microsoft Excel.
       - Fitur cetak Dokumen Rekapitulasi Resmi A4 Landscape ber-kop dinas lengkap dengan pengesahan Kepala Bidang (**Stefanus Rahmat, S.Sos**) dan Pelaksana Alih Media.

---

### Versi 30 - 32 — Optimasi SPA (Single Page Application) Tanpa Perlu Refresh Halaman
- **Latar Belakang**: Pengguna menanyakan mengapa semua proses harus di-refresh dan meminta agar sistem berjalan lancar tanpa reload halaman (*"semua prosesnya kenapa harus di refresh ya? jadi kamu bisa bikin tidak perlu di refresh atau gimana? iya terapkan"*).
- **Penyempurnaan**:
  1. `ClientScript.html`:
     - Arsitektur routing internal SPA: fungsi `navigateTo(page, param)` memuat halaman dan menginisialisasi controller secara dinamis tanpa merefresh browser window (`window.location.reload()` dihilangkan).
     - In-memory data store caching dengan auto-invalidation saat ada create/update/delete.
     - Indikator proses modern menggunakan SweetAlert2 proses tanpa mengganggu alur UI.
  2. `InputArsip.html`:
     - Setelah sukses input arsip, form di-reset bersih secara dinamis, cache daftar arsip di-update di latar belakang, dan pengguna langsung dapat melihat pratinjau atau kembali ke daftar arsip tanpa refresh browser.
  3. `DetailArsip.html`:
     - Edit arsip dan hapus arsip mengeksekusi callback JavaScript langsung dan memperbarui DOM seketika.
  4. Multi-Akun Login Session:
     - Dukungan sesi staf mandiri (`siasta`, `yohanes`, `dzaky`, dll.) tersimpan rapi di `sessionStorage` sehingga data arsip yang diinput otomatis terhubung ke staf yang sedang bertugas tanpa tertukar.

---

## 📂 Peta Struktur Berkas Proyek

| Nama Berkas | Jenis | Fungsi Utama |
|-------------|-------|--------------|
| `Code.gs` | Backend | Router HTTP (`doGet`), handler inisialisasi aplikasi, dan dispatcher API |
| `Config.gs` | Backend | Konfigurasi global, ID Spreadsheet, logo resmi Pemkab Base64, dan styling dokumen cetak |
| `Database.gs` | Backend | Abstraksi ORM untuk operasi CRUD pada Google Sheets |
| `Auth.gs` | Backend | Manajemen otentikasi login pengguna, hash password, dan session validation |
| `ArsipService.gs` | Backend | Logika bisnis master arsip, penomoran kode unik, CRUD arsip, dan ekspor rekapitulasi |
| `BeritaAcaraService.gs` | Backend | Logika penerbitan Berita Acara resmi, konversi angka terbilang, dan format cetak dinas |
| `LaporanService.gs` | Backend | Generator laporan berkala internal dan eksternal standar ANRI |
| `DriveService.gs` | Backend | Integrasi Google Drive (folder pelestarian & folder akses), watermarking digital |
| `LogService.gs` | Backend | Audit trail pencatatan aktivitas pengguna ke sheet log |
| `Utils.gs` | Backend | Fungsi utilitas tanggal, format string, respon JSON standar |
| `Layout.html` | Frontend | Kerangka induk antarmuka (Sidebar navigasi, Header, Modal container) |
| `Styles.html` | Frontend | Desain CSS komprehensif, tema modern, dan styling cetak media print |
| `ClientScript.html` | Frontend | Router SPA dinamis, state management, komunikasi client-server `google.script.run` |
| `Login.html` | Frontend | Halaman autentikasi login dengan visual branding Pemkab Manggarai Barat |
| `Dashboard.html` | Frontend | Halaman ringkasan eksekutif, grafik alih media, dan statistik ketercapaian target |
| `DashboardBA.html` | Frontend | Dashboard pusat kendali penerbitan dan riwayat Berita Acara alih media |
| `DaftarArsip.html` | Frontend | Tabel data arsip alih media, filter cepat, pratinjau, dan ekspor rekapitulasi |
| `InputArsip.html` | Frontend | Formulir input arsip statis dengan auto-watermark canvas dan kalkulasi otomatis |
| `DetailArsip.html` | Frontend | Halaman rincian arsip, pratinjau dokumen alih media, dan modal edit data |
| `GenerateLaporan.html` | Frontend | Modul cetak laporan periodik dinas internal & eksternal |
| `KelolaStaf.html` | Frontend | Manajemen pengguna dan staf arsiparis |
| `Pengaturan.html` | Frontend | Pengaturan profil dinas, template dokumen, tanda tangan pejabat, dan OPD asal arsip |
| `LogAktivitas.html` | Frontend | Log aktivitas sistem untuk pemantauan audit trail |

---

## 📋 Pejabat Resmi Terkonfigurasi (Sesuai Naskah Dinas Pemkab Mabar)
1. **Kepala Dinas Kearsipan dan Perpustakaan Daerah**:
   - Nama: **AUGUSTINUS RINUS, S.Pd**
   - Pangkat/Golongan: Pembina Utama Muda / IV c
   - NIP: `19720219 199903 1 008`
2. **Kepala Bidang Layanan, Alih Media dan Perlindungan Arsip**:
   - Nama: **STEFANUS RAHMAT, S.Sos**
   - Pangkat/Golongan: Pembina / IV a
   - NIP: `19850215 201001 1 018`
3. **Pelaksana Alih Media Arsip**:
   - Nama: **MUHAMMAD DZAKY NATHANEGARA, A.Md**
   - Jabatan: Pengelola Kearsipan / Pelaksana Alih Media
   - NIP: `19980508 202506 1 004`
