# DOKUMENTASI LENGKAP PENGEMBANGAN & PERUBAHAN SISTEM SIASTA
**Sistem Informasi Alih Media Arsip Statis (SIASTA)**  
*Dinas Kearsipan dan Perpustakaan Daerah Kabupaten Manggarai Barat*

---

## 📌 Ringkasan Proyek & Status Terakhir
- **Platform**: Google Apps Script (GAS) Web Application terintegrasi Google Sheets & Google Drive
- **ID Deployment Aktif**: `AKfycbx27qHUjbvuxreI-aTb5ZDX6WXALdFbNM1im9-sHlU-zE9AXvrhxK2EOjNzEYiUVfod3g`
- **Versi Terakhir**: **Versi 53 (Deployment @12 Baru)**
- **URL Aplikasi**: [https://script.google.com/macros/s/AKfycbx27qHUjbvuxreI-aTb5ZDX6WXALdFbNM1im9-sHlU-zE9AXvrhxK2EOjNzEYiUVfod3g/exec](https://script.google.com/macros/s/AKfycbx27qHUjbvuxreI-aTb5ZDX6WXALdFbNM1im9-sHlU-zE9AXvrhxK2EOjNzEYiUVfod3g/exec)
- **ID Proyek GAS Baru**: `1BA5rFvxRcszqyltzolfb8zp0xzC5vWwe1v1UqTI7FE4deBjT-cnSQt9I`
- **ID Basis Data (Spreadsheet Baru)**: `1c3caYKmVd1nt46lmqxxAEm8wVPQWwMsybqrz4OzBoSM`
- **Cadangan Konfigurasi Lama**: Tersimpan di file [CONFIG_OLD_BACKUP.md](file:///d:/Antigravity/GAS/CONFIG_OLD_BACKUP.md)

---

## 📜 Kronologi Riwayat Perubahan (Changelog)

### Versi 53 — Sinkronisasi Penghapusan Fisik Permanen (Hard Delete) dari Google Sheets (Deployment @12)
- **Latar Belakang**: Permintaan pengguna agar saat data arsip dihapus di aplikasi SIASTA, baris datanya di Google Spreadsheet juga benar-benar ikut terhapus secara fisik (`sheet.deleteRow()`) dan berkas digital di Google Drive dibersihkan.
- **Rincian Perubahan yang Diimplementasikan**:
  1. **Penghapusan Fisik Baris Data (`deleteArsip` di `ArsipService.gs`)**:
     - Mengubah mekanisme dari *soft-delete* (yang sebelumnya hanya menandai status `"Dihapus"`) menjadi **Hard Delete** langsung menggunakan `sheet.deleteRow(rowIndex)`.
     - Baris data pada sheet `master_arsip` langsung terhapus bersih seketika dari Google Sheets.
  2. **Pembersihan Berkas Fisik di Google Drive**:
     - Sistem otomatis mencari ID berkas digital terkait (`file_pelestarian_id`, `file_akses_id`, dan `file_id`), kemudian memindahkannya ke tong sampah / Trash (`DriveApp.getFileById(fid).setTrashed(true)`) agar tidak meninggalkan berkas yatim (*orphaned files*).
  3. **Penyempurnaan Berita Acara (`deleteBeritaAcara` di `BeritaAcaraService.gs`)**:
     - Memastikan berkas dokumen Berita Acara di Drive (`target.file_id`) juga dipindahkan ke tong sampah saat BA dihapus dari sheet `berita_acara`.
  4. **Pembaruan Dialog Antarmuka Pengguna (`DetailArsip.html`)**:
     - Dialog konfirmasi SweetAlert diperjelas: *"⚠️ Baris data arsip akan dihapus permanen dari spreadsheet dan Google Drive. Tindakan ini tidak dapat dibatalkan."*
     - Setelah penghapusan, cache halaman dibersihkan (`delete _pageHtmlCache['daftar-arsip']` & `delete _pageHtmlCache['dashboard']`) sehingga data yang telah terhapus langsung hilang seketika saat kembali ke Daftar Arsip.
  5. **Helper Fungsi Database Baru (`Database.gs`)**:
     - Menambahkan fungsi `hardDeleteRow(sheetName, rowNumber)` dan `purgeDeletedRows(sheetName)`.

### Versi 52 — Penyesuaian Batas Waktu Sesi Inaktif Menjadi 1 Jam (60 Menit) (Deployment @10)
- **Latar Belakang**: Permintaan pengguna untuk menyesuaikan durasi timeout sesi dari 5 menit menjadi **1 jam (60 menit)** agar staf memiliki waktu yang cukup leluasa dalam menginput data arsip panjang atau mengunggah berkas tanpa terputus sesi login secara mendadak.
- **Rincian Perubahan yang Diimplementasikan**:
  1. **Konfigurasi Server & Sesi (`Config.gs` & `Auth.gs`)**:
     - Memperbarui `CONFIG.SESSION.TIMEOUT_MINUTES: 60` dan `CONFIG.SESSION.TIMEOUT_HOURS: 1`.
     - Logika verifikasi keaktifan sesi di `getCurrentUser()` pada `Auth.gs` kini mengizinkan jeda inaktivitas hingga 60 menit.
     - Pesan penolakan akses di `Code.gs` (`getPageContent`) diperbarui menjadi: *"Sesi Anda telah berakhir (inaktif 1 jam) atau Anda belum login ke SIASTA."*
  2. **Pengatur Sesi & Waktu Client (`ClientScript.html`)**:
     - Konstanta batas sesi browser disesuaikan menjadi `SIASTA_SESSION_TIMEOUT_MS = 60 * 60 * 1000` (3.600.000 ms / 1 jam).
     - Seluruh pengecekan `navigateTo`, inisialisasi sesi awal `initSessionOnPageLoad`, peringatan SweetAlert, serta toast notifikasi diselaraskan ke batas 1 jam.
  3. **Tampilan Countdown Badge Header (`Layout.html`)**:
     - Badge countdown waktu sesi (`#session-timer-badge`) kini mengawali hitungan dari `⏱️ Sesi: 60:00` dan menghitung mundur secara dinamis.
     - Tooltip disesuaikan: *"Sesi login aktif. Otomatis reset setelah 1 jam tidak ada aktivitas."*

### Versi 51 — Wajib Autentikasi Login Seluruh Halaman & Timeout Sesi Inaktif 5 Menit (Deployment @8)
- **Latar Belakang**: Permintaan pengguna agar seluruh halaman aplikasi wajib login (tidak dapat diakses tanpa autentikasi) dan sistem menerapkan manajemen sesi dengan reset / logout otomatis jika tidak ada aktivitas selama 5 menit.
- **Rincian Perubahan yang Diimplementasikan**:
  1. **Pembatasan Akses Wajib Login (Zero-Bypass Security)**:
     - **Inisialisasi Awal**: Saat halaman pertama kali dibuka, sistem langsung memeriksa status sesi client-side (`sessionStorage`) dan server-side. Jika pengguna belum login, antarmuka aplikasi utama (`#main-app-container`) disembunyikan total (`display: none`), dan hanya layar login (`#auth-view`) yang ditampilkan.
     - **Proteksi Navigasi (`navigateTo`)**: Setiap permintaan perpindahan halaman (Dashboard, Input Arsip, Daftar Arsip, BA, Laporan, dll.) wajib memverifikasi sesi login aktif. Jika belum login atau sesi telah kedaluwarsa, navigasi dibatalkan seketika dan dialihkan ke login.
     - **Proteksi Server (`getPageContent`)**: Di sisi backend Google Apps Script, fungsi `getPageContent` kini memverifikasi `getCurrentUser()`. Jika belum terautentikasi, backend menolak pengiriman konten halaman dan mengembalikan pesan akses dibatasi.
  2. **Implementasi Manajemen Sesi Inaktif 5 Menit (300.000 ms)**:
     - Mengubah konfigurasi batas waktu sesi pada `Config.gs` (`CONFIG.SESSION.TIMEOUT_MINUTES: 5`) dan `Auth.gs`.
     - Memasang pemantau aktivitas global di browser (`startSessionWatcher()`): mendeteksi klik, ketikan keyboard, pergerakan mouse (dithrottle), sentuhan layar ponsel, dan scroll halaman untuk terus memperbarui `siasta_last_activity`.
     - Jika pengguna tidak melakukan aktivitas apapun selama **5 menit penuh**:
       - Seluruh data sesi dibersihkan dari browser (`sessionStorage`).
       - Sesi server dihapus via `google.script.run.logout()`.
       - Tampilan antarmuka langsung dikunci dan dialihkan ke layar login (`transitionToAuth(true)`).
       - Menampilkan dialog peringatan SweetAlert: *"Sesi Anda telah berakhir secara otomatis karena tidak ada aktivitas selama 5 menit. Silakan login kembali untuk melanjutkan."*
  3. **Badge Indikator Sisa Waktu Sesi Interaktif**:
     - Menambahkan badge countdown interaktif di bagian header atas (`#session-timer-badge`: `⏱️ Sesi: 05:00`) yang terus menghitung mundur sisa waktu inaktivitas secara *real-time* dan otomatis ter-reset kembali ke `05:00` saat pengguna berinteraksi.
     - Badge berubah warna menjadi merah peringatan jika sisa waktu tinggal kurang dari 60 detik.

### Versi 50 — Pembersihan & Perapian Layout Formulir Input Data Arsip (Deployment @5)
- **Latar Belakang**: Permintaan pengguna untuk merapikan layout visual formulir input data arsip (`InputArsip.html`) tanpa mengubah logic yang ada (seluruh ID elemen, nama field, validasi, dan alur JavaScript dipertahankan 100%).
- **Rincian Perubahan yang Diimplementasikan**:
  1. **Perbaikan Syntax Tag HTML & Struktur Grid**:
     - Memperbaiki tag pembuka `<div class="form-row">` yang sebelumnya tidak tertutup pada baris 31 sehingga menyebabkan struktur grid CSS bertumpuk dan rusak secara vertikal.
  2. **Modernisasi Desain Antarmuka Berbasis Kartu Terpadu (Modular Step Cards)**:
     - Mengubah formulir panjang monolitik menjadi 5 seksi kartu visual bertahap dengan header bergradien biru navy khas Pemkab Manggarai Barat, badge langkah, ikon khusus, dan pembagi bidang yang rapi:
       - **Langkah 1**: Identifikasi Petugas & Klasifikasi Pokok (Petugas, Tanggal Input, Status Keterbukaan, Jenis Arsip, Kategori Urusan, Kode Klasifikasi Asli, Nomor Asli).
       - **Langkah 2**: Penomoran, Sumber & Kondisi Fisik (Asal Arsip Select2, Nomor Box, Kode Unik Otomatis beraksen emas, Unit Pengelola, Kurun Waktu, Kondisi Fisik, Lokasi Simpan, Jumlah Lembar, Jumlah Berkas, Rangkap Ke).
       - **Langkah 3**: Uraian & Deskripsi Isi Arsip (Uraian teks lengkap & Keterangan tambahan).
       - **Langkah 4**: Unggah Berkas & Watermark Digital (Area *drag & drop* modern dengan tag berkas `PDF`, `TIFF`, `JPG`, `PNG`, notifikasi waktu unggah otomatis, dan tombol pratinjau cap watermark).
       - **Langkah 5**: Verifikasi Kualitas Mutu (Kartu checklist interaktif Standar Perka ANRI No. 2 Tahun 2021).
  3. **Penyempurnaan Responsivitas Layar (Mobile & Desktop)**:
     - Menggunakan sistem grid dinamis (`ia-grid-2` dan `ia-grid-3`) yang otomatis runtuh (*collapse*) secara rapi menjadi 1 kolom saat dibuka di layar tablet maupun ponsel.
  4. **Integritas Logic & ID 100% Terjaga**:
     - Seluruh 37 ID elemen, pemanggilan fungsi (`submitArsip`, `autoFillSampleInput`, `resetForm`, `onAsalBoxChange`, `onFileScanSelected`, dll.), serta pembacaan sesi petugas login dan proses watermark tetap bekerja persis sebagaimana mestinya.

### Versi 49 — Migrasi Lingkungan ke Proyek Google Apps Script, Spreadsheet, & Google Drive Baru
- **Latar Belakang**: Permintaan pengguna untuk memigrasikan sistem SIASTA ke akun Google baru dengan Google Apps Script project dan Google Spreadsheet mandiri baru, serta memastikan Google Drive dan perizinan berjalan di bawah akun pemilik baru (`USER_DEPLOYING`).
- **Rincian Perubahan yang Diimplementasikan**:
  1. **Pencadangan Konfigurasi Lama**:
     - Seluruh ID proyek lama, Spreadsheet lama (`1eERa08ccRqPJp7r_iGddzcnWnI1NnYn4UDl3_60CzK0`), script ID lama (`1S_DgdN2c_bdesSZfSSx_n3OL420shlikdsxEWMTF-_8B06y8PrPLnJD4`), dan URL deployment lama dicadangkan secara permanen ke file `CONFIG_OLD_BACKUP.md`.
  2. **Penyelarasan Proyek GAS Baru**:
     - Memperbarui `.clasp.json` ke script ID baru: `1BA5rFvxRcszqyltzolfb8zp0xzC5vWwe1v1UqTI7FE4deBjT-cnSQt9I`.
     - Mengunggah seluruh 28 file kode SIASTA (termasuk fitur terbaru yang ditarik dari GAS) ke proyek Google Apps Script baru via `clasp push -f`.
  3. **Penyelarasan Basis Data Spreadsheet Baru**:
     - Memperbarui `CONFIG.SPREADSHEET_ID` pada `Config.gs` ke Spreadsheet baru: `1c3caYKmVd1nt46lmqxxAEm8wVPQWwMsybqrz4OzBoSM`.
  4. **Google Drive Otomatis Mengikuti Akun Baru**:
     - Memastikan `CONFIG.DRIVE_FOLDER_ID` kosong (`''`), sehingga `DriveService.gs` secara otomatis mendeteksi atau membuat folder root `SIASTA` dan seluruh subfolder (`Arsip Digital`, `Berita Acara`, `Laporan`, `Tanda Tangan`) di Google Drive milik akun pemilik baru.
     - Konfigurasi `appsscript.json` menggunakan `"executeAs": "USER_DEPLOYING"`, menjamin setiap operasi Drive dan Spreadsheet dieksekusi atas nama akun pemilik baru.
  5. **Deployment Web App Baru**:
     - Berhasil membuat deployment baru: `AKfycbxbtorKFRZJwGc9ON3SpC1ezzBXKTqdVbH7XK4mX61UHXscReMgVyOYjogGgrZAwF0U5Q` (Versi @2).

### Versi 48 — Perbaikan Kebocoran Tag HTML TTD pada Generate Laporan & Cetak Tab Baru Standalone (Deployment @69)
- **Latar Belakang**: Pada menu **Generate Laporan**, ketika laporan dibuat, bagian tanda tangan kanan memunculkan teks mentah `" alt="TTD" style="max-height:65px; max-width:150px; object-fit:contain;">` di sebelah kanan tanggal dan memunculkan gambar rusak (*broken image*). Hal ini disebabkan oleh string SVG `window._dummyTtd` yang mengandung tanda petik ganda (`"`) tanpa encoding sehingga memutus atribut `src` HTML, menutup tag `<img>` sebelum waktunya, dan memuntahkan sisa kode sebagai teks mentah di layar.
- **Rincian Perubahan yang Diimplementasikan**:
  1. **Konversi SVG Data URI ke Base64 Standar**:
     - Mengubah seluruh definisi data URI SVG tanda tangan dummy (`window._dummyTtd` pada `ClientScript.html`, `CONFIG.PEJABAT.PELAKSANA.TTD` & `CONFIG.PEJABAT.DUMMY_TTD` pada `Config.gs`, serta seed data `Database.gs`) menjadi string Base64 murni tanpa tanda petik, kurung sudut, ataupun karakter khusus lainnya.
  2. **Dukungan Tanda Tangan Dinamis per Staf pada Laporan**:
     - Memperbarui fungsi `renderLaporanPreview()` pada `GenerateLaporan.html` agar membaca tanda tangan asli staf terpilih (`_activeSigner1Data.tanda_tangan_url` dan `_activeSigner2Data.tanda_tangan_url`).
     - Jika staf yang dipilih (misal: Kabid atau Kadis) belum mengunggah tanda tangan di menu Pengaturan, sistem secara otomatis menyediakan ruang kosong 70px yang bersih untuk tanda tangan basah (tanpa memaksakan tanda tangan dummy orang lain dan tanpa memunculkan gambar rusak).
  3. **Sinkronisasi Otomatis Jabatan Pengesah & Pelaksana**:
     - Memperbarui `syncSigner1Details()` dan `syncSigner2Details()` agar kolom teks jabatan otomatis berganti mengikuti nama pejabat/staf yang dipilih pada dropdown.
     - Menambahkan event `oninput` pada kedua field jabatan sehingga perubahan kustom langsung ter-update secara *real-time* pada lembar preview laporan.
  4. **Fitur Cetak Dokumen Laporan (Tab Baru Standalone A4 Portrait)**:
     - Menggantikan cetak biasa dengan `printLaporanDoc()` yang membuka lembar naskah dinas di tab baru terisolasi dengan toolbar cetak resmi, margin presisi A4 Portrait (15mm), dan tombol pintas `🖨️ Cetak / Simpan PDF`.

### Versi 47 — Penyelarasan Judul Kolom & Format Tabel Rekapitulasi Alih Media Sesuai Master Arsip
- **Latar Belakang**: Menindaklanjuti permintaan revisi pada dokumen instruksi (Google Docs `1Nma2GuO4o0uC10wVuWSSws35fRhYFj932u198Mq2D_s`) mengenai tampilan format cetak rekapitulasi pada menu **Daftar Arsip -> Export -> Cetak Rekap Resmi**, di mana sebelumnya terdapat ketidaksinkronan jumlah kolom antara header (14 kolom) dan baris data (16 kolom) sehingga terdapat kolom yang tidak memiliki judul, serta mengoptimalkan proses cetak agar tidak terpotong dengan membuka lembar dokumen cetak di tab baru.
- **Rincian Perubahan yang Diimplementasikan**:
  1. **Struktur Kolom Tabel Lengkap (20 Kolom)**:
     - Menyelaraskan susunan judul kolom `<thead>`, baris data `<tbody>`, dan ekspor CSV agar persis mengikuti urutan 19 field dari sheet `master_arsip` (mulai dari `kode_unik` hingga `keterangan`) ditambah kolom `No` di kolom pertama:
       1. `No`
       2. `Kode Unik` (`kode_unik`)
       3. `Status Keterbukaan` (`status_keterbukaan`)
       4. `Asal Arsip` (`asal_arsip`)
       5. `Kode Asal` (`kode_asal`)
       6. `Nomor Box` (`nomor_box`)
       7. `Nomor Urut` (`nomor_urut`)
       8. `Deskripsi` (`deskripsi`)
       9. `Jenis Arsip` (`jenis_arsip`)
       10. `Kategori Urusan` (`kategori_urusan`)
       11. `Kode Klasifikasi` (`kode_klasifikasi`)
       12. `Nomor Asli` (`nomor_asli`)
       13. `Jumlah Lembar` (`jumlah_lembar`)
       14. `Jumlah Berkas` (`jumlah_berkas`)
       15. `Rangkap Ke` (`rangkap_ke`)
       16. `Kondisi Fisik` (`kondisi_fisik`)
       17. `Kurun Waktu (Tahun Pembuatan)` (`kurun_waktu`)
       18. `Unit Pengelola` (`unit_pengelola`)
       19. `Lokasi Simpan` (`lokasi_simpan`)
       20. `Keterangan` (`keterangan`)
  2. **Backend (`ArsipService.gs`)**:
     - Memperbarui fungsi `getRekapitulasiArsipExport(params)` agar memetakan seluruh 19 properti dengan fallback data yang aman (`kodeUnik`, `statusKeterbukaan`, `asalArsip`, `kodeAsal`, `nomorBox`, `nomorUrut`, `deskripsi`, `jenisArsip`, `kategoriUrusan`, `kodeKlasifikasi`, `nomorAsli`, `jumlahLembar`, `jumlahBerkas`, `rangkapKe`, `kondisiFisik`, `kurunWaktu`, `unitPengelola`, `lokasiSimpan`, `keterangan`).
  3. **Antarmuka Pratinjau & Cetak (`DaftarArsip.html`)**:
     - Memperbarui elemen tabel `#rekap-print-sheet` dengan 20 `<th>` yang memiliki judul jelas dan proporsional.
     - Memperbarui `<tfoot>` dengan `colspan="12"` untuk label total, sel total lembar, sel total berkas, dan `colspan="6"` penutup sehingga total kolom pas 20 kolom.
     - Memperbarui fungsi `populateRekapPrintModal(d)` untuk merender 20 elemen `<td>` per baris sesuai urutan field tanpa pembatasan nowrap kaku.
     - Memperbarui fungsi `generateAndDownloadCSV(d)` agar header dan baris CSV ekspor Excel juga selaras dengan ke-20 kolom tersebut.
  4. **Tata Letak Cetak A4 Landscape (`Styles.html`)**:
     - Mengatur styling cetak `#siasta-print-section.siasta-print-section-rekap` dengan font 6.5pt dan padding 2px–2.5px agar seluruh 20 kolom tercetak secara rapi, proporsional, dan tidak meluap di lembar A4 Landscape.
  5. **Mekanisme Cetak di Tab Baru Khusus (`printRekapDoc`)**:
     - Mengubah alur cetak dokumen rekapitulasi agar otomatis membuka jendela/tab baru (`window.open('', '_blank')`) dengan dokumen standalone A4 Landscape ber-margin 6mm.
     - Menyelesaikan tuntas kendala dokumen terpotong akibat batasan viewport/iframe aplikasi web Google Apps Script.
     - Menyediakan floating toolbar khusus non-cetak pada tab baru (tombol *🖨️ Cetak / Simpan PDF* dan *✕ Tutup Tab*) serta otomatis memicu dialog cetak browser (`window.print()`).

---

### Versi 46 — Pengelolaan & Upload Spesimen Tanda Tangan Digital Individual Masing-Masing Pegawai
- **Latar Belakang**: Memenuhi kebutuhan agar setiap staf/petugas alih media kearsipan dapat mengunggah dan memiliki spesimen tanda tangan digital yang berbeda-beda, bukan hanya satu tanda tangan default. Tanda tangan ini tersimpan otomatis di Google Drive dan langsung terhubung dengan profil pegawai di basis data `master_staf`, serta otomatis disematkan saat pegawai yang bersangkutan membuat atau mengesahkan Berita Acara maupun Laporan Alih Media.
- **Rincian Fitur yang Diimplementasikan**:
  1. **Backend & Cloud Drive (`LaporanService.gs` & `DriveService.gs`)**:
     - Menambahkan fungsi `uploadTandaTanganStaf(stafId, base64Data, fileName, mimeType)` yang mengunggah gambar tanda tangan ke folder Google Drive `Tanda Tangan` dan memperbarui kolom `tanda_tangan_id` serta `tanda_tangan_url` pada sheet `master_staf`.
     - Menambahkan fungsi `deleteTandaTanganStaf(stafId)` untuk menghapus spesimen tanda tangan pegawai secara aman (termasuk memindahkan file lama di Drive ke tong sampah/trash).
     - Menambahkan helper `processTandaTanganUpload()` dan mengintegrasikannya ke `saveStaf()` agar tanda tangan juga dapat diunggah bersamaan saat menambah atau mengedit pegawai.
  2. **Galeri Spesimen Tanda Tangan di Menu Pengaturan (`Pengaturan.html`)**:
     - Mengubah Tab *✍️ Tanda Tangan* menjadi antarmuka katalog/galeri spesimen tanda tangan seluruh pegawai aktif.
     - Menampilkan kartu masing-masing staf lengkap dengan Nama, Jabatan, NIP, status Aktif/Nonaktif, kotak pratinjau tanda tangan, tombol *📤 Upload/Ganti TTD* instan, dan tombol *🗑️ Hapus TTD*.
  3. **Antarmuka Kelola Staf (`KelolaStaf.html`)**:
     - Menambahkan kolom **Tanda Tangan** pada tabel data staf dengan thumbnail gambar mini dan badge status (*Ada TTD* / *Belum Ada*).
     - Menambahkan opsi upload file tanda tangan beserta kotak pratinjau langsung pada modal Tambah / Edit Staf.
  4. **Koneksi Dinamis Berita Acara (`BeritaAcaraService.gs`)**:
     - Fungsi `getBeritaAcaraFormalDetail()` otomatis mencocokkan staf pelaksana alih media dan mengambil `tanda_tangan_url` milik staf yang bersangkutan untuk disematkan pada dokumen Berita Acara.

---

### Versi 45 — Penerapan Template Resmi Berita Acara Alih Media DOCX (Dinas Kearsipan Kab. Manggarai Barat)
- **Latar Belakang**: Menerapkan berkas template naskah dinas resmi kearsipan `Tempate Berita Acara untuk SIASTA.docx` secara penuh ke dalam sistem SIASTA dengan data dinamis yang terintegrasi langsung dengan database arsip dan riwayat Berita Acara.
- **Hasil Analisis & Penerapan Format Template**:
  1. **Kop Surat Resmi Naskah Dinas**:
     - Logo Pemkab Manggarai Barat di sebelah kiri.
     - Teks instansi: `PEMERINTAH KABUPATEN MANGGARAI BARAT`, `DINAS KEARSIPAN DAN PERPUSTAKAAN`, `Jl. Samping Bank NTT, Kelurahan Wae Kelambu, Labuan Bajo - Flores - NTT`.
     - Garis ganda pembatas kop surat (tebal 3px dan 1px).
  2. **Judul Dokumen & Nomor Dinamis**:
     - `BERITA ACARA ALIH MEDIA ARSIP` (Center, Bold, Underline).
     - `Nomor: [NOMOR_BA]` (menggunakan format penomoran resmi naskah dinas otomatis atau nomor tersimpan).
  3. **Paragraf Pembuka**:
     - Format: `Pada hari ini, [HARI], tanggal [TANGGAL] [BULAN] [TAHUN], bertempat di Dinas Kearsipan dan Perpustakaan Daerah Kabupaten Manggarai Barat, telah dilaksanakan kegiatan alih media arsip dari media fisik ke media digital dengan keterangan sebagai berikut:`
  4. **Tabel 1: Ringkasan Kegiatan (Table Grid Ber-border 1px Solid Hitam)**:
     - Header: `Uraian` | `Keterangan`
     - Baris 1: `Jenis Kegiatan` -> `Alih Media Arsip dari media kertas (fisik) ke media digital (softcopy/PDF)`
     - Baris 2: `Periode Pelaksanaan` -> Dinamis (`Bulan [Bulan] [Tahun]`)
     - Baris 3: `Jenis Arsip` -> Dinamis (`Arsip Statis Terbuka`)
     - Baris 4: `Jumlah Berkas` -> Dinamis (`[N] berkas`)
     - Baris 5: `Jumlah Lembar` -> Dinamis (`[N] lembar`, akumulasi total lembar fisik arsip)
     - Baris 6: `Pelaksana Alih Media` -> Dinamis (`Muhammad Dzaky Nathanegara, A.Md` / nama pelaksana tim)
     - Baris 7: `Lokasi Simpan Fisik` -> Dinamis (`Depo Arsip DKP Kab. Manggarai Barat`)
  5. **Paragraf Pengantar Rincian Arsip**:
     - Format: `Arsip yang telah dilaksanakan alih media pada periode sebagaimana tersebut di atas adalah sebagai berikut:`
  6. **Tabel 2: Daftar Arsip Hasil Alih Media (Table Grid Ber-border 1px Solid Hitam)**:
     - Kolom: `No` | `Kode Unik` | `Jenis Arsip` | `Uraian Arsip` | `Kurun Waktu` | `Jumlah Lembar`
     - Baris data dinamis hasil mapping per item arsip periode terkait (`d.arsipList`).
     - Baris Footer Total: Kolom 1-5 `TOTAL`, Kolom 6 `[TOTAL_LEMBAR] lembar`.
  7. **Klausul Hukum ANRI & UU 43/2009 (2 Paragraf) + Penutup**:
     - Paragraf 1: *"Kegiatan alih media dilaksanakan dengan tujuan untuk menjamin keselamatan dan kemudahan akses informasi arsip, serta sebagai pengganti fungsi arsip fisik/asli sesuai dengan ketentuan peraturan perundang-undangan yang berlaku, khususnya Undang-Undang Nomor 43 Tahun 2009 tentang Kearsipan serta Peraturan Kepala ANRI yang mengatur tentang pedoman alih media arsip."*
     - Paragraf 2: *"Arsip hasil alih media (reproduksi) disimpan secara terpisah dari arsip aslinya dan diperlakukan sesuai dengan kaidah pengelolaan arsip yang berlaku, sedangkan arsip asli tetap disimpan sebagai arsip pendukung/pembanding."*
     - Paragraf 3: *"Demikian Berita Acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya."*
  8. **Tanda Tangan 2 Kolom (Sesuai Pejabat Resmi)**:
     - Kolom Kiri: Mengetahui, Kepala Dinas Kearsipan dan Perpustakaan Kab. Manggarai Barat (**Augustinus Rinus, S.Pd** / Pembina Utama Muda / NIP. 19720219 199903 1 008).
     - Kolom Kanan: `Labuan Bajo, [Tanggal]`, Pelaksana Alih Media (**Muhammad Dzaky Nathanegara, A.Md** / NIP. 19980508 202506 1 004).
- **Modifikasi Berkas**:
  1. `BeritaAcaraService.gs`:
     - Memperbarui `getBeritaAcaraFormalDetail()` agar memetakan seluruh data dinamis (`periodePelaksanaan`, `jumlahBerkas`, `jumlahLembar`, `totalLembar`, `namaPetugas`, `nipPetugas`, `lokasiSimpan`, `arsipList`).
     - Memperbarui `exportBAToGoogleDoc()` agar menghasilkan berkas Google Docs berstruktur identik (Kop surat, Tabel 1 ber-border, Paragraf pengantar, Tabel 2 rincian arsip ber-border lengkap dengan footer TOTAL, 2 klausul hukum ANRI & penutup, dan tabel TTD 2 kolom).
  2. `DashboardBA.html`:
     - Memperbarui elemen dokumen cetak `#ba-print-sheet` dengan markup Tabel 1 (Ringkasan) dan Tabel 2 (Daftar Rincian Arsip) ber-border hitam rapi dan klausul hukum ANRI persis template DOCX.
     - Memperbarui `populateFormalBAModal(d)` untuk merender baris-baris arsip dinamis ke `#doc-ba-arsip-tbody` serta menghitung total lembar dan mengisi seluruh parameter Tabel 1.
  3. `Styles.html`:
     - Memastikan styling cetak `@media print` untuk Berita Acara memiliki batas garis tabel yang tegas (`border: 1px solid #000; border-collapse: collapse;`) dan terpaginasi dengan rapi (`page-break-inside: avoid;`).

---

### Versi 44 — Penghapusan Watermark pada Dokumen Berita Acara Alih Media

---

### Versi 43 — Penambahan Watermark Resmi pada Dokumen Berita Acara & Rekapitulasi Alih Media
- **Latar Belakang**: Menindaklanjuti instruksi penambahan cap watermark visual resmi pada dokumen Berita Acara Alih Media agar memiliki autentikasi lembaga yang sah dan selaras dengan standar dokumen kearsipan Kabupaten Manggarai Barat baik saat pratinjau maupun saat dicetak fisik/disimpan sebagai PDF.
- **Modifikasi Berkas**:
  1. `DashboardBA.html`:
     - Menyematkan layer cap watermark digital diagonal (`#doc-ba-watermark`) tepat di tengah kertas dokumen A4 Berita Acara:
       `ARSIP HASIL ALIH MEDIA` / `DINAS KEARSIPAN DAN PERPUSTAKAAN DAERAH` / `KABUPATEN MANGGARAI BARAT`.
     - Menambahkan kontrol checkbox `Watermark Resmi` pada toolbar pratinjau Berita Acara (aktif secara default), beserta fungsi kendali instan `toggleBAWatermark(show)`.
  2. `DaftarArsip.html`:
     - Menyematkan layer cap watermark digital diagonal (`#doc-rekap-watermark`) pada lembar cetak Rekapitulasi Hasil Alih Media (A4 Landscape) dan menambahkan checkbox toggle kendali pada toolbar rekapitulasi.
  3. `BeritaAcaraService.gs`:
     - Mengirimkan data konfigurasi teks watermark resmi 3 baris (`watermarkLine1`, `watermarkLine2`, `watermarkLine3`) dari backend ke fungsi pratinjau frontend.
  4. `Styles.html`:
     - Menyesuaikan aturan `@media print` untuk wadah `#siasta-print-section` menjadi `position: relative !important; overflow: hidden !important;`, sehingga layer watermark diagonal tetap terpusat di dalam batas lembar cetak A4 dan otomatis tercetak dengan pewarnaan transparan resmi (`-webkit-print-color-adjust: exact !important`).

---

### Versi 42 — Perbaikan Fitur Cetak Berita Acara & Rekapitulasi (Universal Direct Print Engine)
- **Latar Belakang**: Menuntaskan kendala pada proses pencetakan Berita Acara dan Rekapitulasi Alih Media di mana dialog print browser muncul namun halaman pratinjau cetak kosong/tidak muncul apa-apa ("saat dicetak tidak muncul apa apa"), serta error saat penerbitan Berita Acara baru.
- **Akar Masalah & Solusi**:
  1. **DOM ID Mismatch di `populateFormalBAModal` (`DashboardBA.html`)**:
     - *Masalah*: JavaScript memanggil `.textContent` pada elemen `doc-bulan`, `doc-tempat`, `doc-jenis-arsip`, dll. yang tidak ada di HTML (di HTML bernama `doc-bln-nama`, `doc-jenis-arsip-desc`, `doc-jml-angka`, dll.). Hal ini menimbulkan `TypeError: Cannot set properties of null (setting 'textContent')` yang memutus eksekusi modal sebelum data terisi atau dialog cetak terbuka.
     - *Solusi*: Menggunakan fungsi `safeSetText(id, val)` dengan proteksi null-safety dan menyesuaikan seluruh ID target ke elemen DOM yang valid.
  2. **Eliminasi Hidden Iframe 0x0 / Offscreen `-9999px`**:
     - *Masalah*: Fungsi cetak lama menggunakan iframe tersembunyi berukuran 0x0 atau diposisikan di `left: -9999px`. Pada browser Chromium (Chrome/Edge) di lingkungan sandbox Google Apps Script, browser menganggap dokumen tersebut berada di luar batas pandang (out-of-bounds/0-pixel layout area), sehingga print preview me-render halaman kosong (0 halaman / kertas putih polos).
     - *Solusi*: Mengembangkan mesin cetak terpadu `siastaPrint(target, options)` di `ClientScript.html`. Kloning lembar dokumen disematkan langsung di root `document.body`, dan menggunakan aturan `@media print` murni (`body.siasta-is-printing`) untuk menyembunyikan semua antarmuka sistem (sidebar, top-header, modal backdrop, tombol) dan hanya menampilkan lembar dokumen A4 resmi beresolusi tinggi dengan gambar kop dan tanda tangan utuh.
  3. **Pengaturan Orientasi Cetak Otomatis (`@page`)**:
     - Menyuntikkan CSS `@page` dinamis secara otomatis: **A4 Portrait (15mm 18mm)** untuk Berita Acara, dan **A4 Landscape (12mm 10mm)** untuk Rekapitulasi Daftar Arsip.
  4. **Perbaikan Backend Database & Berita Acara (`BeritaAcaraService.gs` & `Database.gs`)**:
     - Memperbaiki `namaHari is not defined` pada `getBeritaAcaraFormalDetail()` dengan mendeklarasikan kamus nama hari dan menghitung hari dari tanggal dokumen.
     - Memperbaiki `Database.gs` saat memanggil `appendData()`, `updateData()`, `getHeaders()`, dan `readAllData()` agar terlindung dari error rentang kolom kurang dari 1 pada sheet kosong.
  5. **Penetapan Pegawai & Redirect Input Arsip (`InputArsip.html`)**:
     - Nilai staf input otomatis diisi sesuai akun yang sedang login dan setelah pengunggahan arsip baru berhasil, sistem otomatis melakukan navigasi dan penyegaran ke halaman Daftar Arsip.

---

### Versi 41 — Watermark Visual Otomatis Berkas PDF (pdf-lib) & Perbaikan Alur Input Arsip
- **Latar Belakang**: Memenuhi instruksi agar setiap berkas arsip yang diunggah (baik Gambar maupun Dokumen PDF) otomatis memiliki cap watermark visual permanen resmi, serta mengatasi kendala dropdown Asal Arsip kosong dan menyelaraskan field rincian metadata arsip.
- **Modifikasi Berkas**:
  1. `Layout.html` & `InputArsip.html`:
     - **Integrasi `pdf-lib`**: Menyematkan pustaka `pdf-lib` via CDN dan fungsi `watermarkPdfBase64`. Setiap berkas PDF yang diunggah otomatis dibuka dan dibubuhi stempel watermark teks diagonal 3 baris resmi pada seluruh halamannya secara transparan.
     - **Pemisahan Berkas Google Drive Otomatis**: Berkas PDF asli tanpa watermark disimpan ke folder `Arsip Digital / Pelestarian`, sedangkan salinan PDF ber-watermark permanen disimpan ke folder `Arsip Digital / Akses` (`akses_[nama_file]`).
     - **Eliminasi Bug Canvas Watermark**: Mendefinisikan `_defaultWatermarkText` dan menambahkan proteksi instan pada pratinjau canvas.
  2. `ArsipService.gs`:
     - **Auto-Fallback & Normalisasi Asal Arsip (`getKodeAsalList`)**: Menangani variasi penamaan kolom huruf besar/kecil (`Kode`, `Nama`, dll.) dan menyediakan fallback 10 unit/wilayah resmi Pemkab Manggarai Barat jika sheet referensi kosong.
     - **Sanitasi Nomor Box**: Menjamin parsing nomor box (`String(nomorBox).replace(/\D/g, '')`) selalu valid sekalipun ada format prefix huruf.
  3. `DetailArsip.html`:
     - **Kelengkapan Kolom Metadata**: Menambahkan 5 field (*Kode Klasifikasi Asli, Nomor Asli/Referensi, Kategori Urusan, Kondisi Fisik, dan Rangkap Ke*) pada tabel informasi awal server pre-render agar data arsip langsung terlihat lengkap saat dibuka.
  4. `DriveService.gs`:
     - **Proteksi Sharing Google Workspace**: Membungkus `file.setSharing` dalam blok `try-catch` agar tidak gagal jika domain organisasi membatasi hak akses link publik.
  5. `DaftarArsip.html`:
     - **Sinkronisasi ID Modal Rekapitulasi**: Menyelaraskan target ID elemen periode dan tbody tabel rekapitulasi cetak dinas.

---

### Versi 40 — Perbaikan Navigasi Tab Halaman Pengaturan Sistem
- **Latar Belakang**: Memperbaiki kendala tombol tab pada halaman Pengaturan (*Profil Instansi, Template Dokumen, Tanda Tangan, Asal Arsip, Alat & Pengujian*) yang sebelumnya tidak merespons saat diklik akibat kesalahan penutupan kurung kurawal fungsi internal pada skrip frontend.
- **Modifikasi Berkas**:
  1. `Pengaturan.html`:
     - Menutup kurung kurawal fungsi `runSetup` yang sebelumnya menyebabkan kegagalan kompilasi skrip lokal.
     - Menyematkan `window.switchPengaturanTab = switchPengaturanTab` secara eksplisit pada scope global `window`.
     - Menambahkan proteksi null-safety pada fungsi `loadPejabatSettings` dan `savePejabatSettings`.
  2. `ClientScript.html`:
     - Menyediakan fungsi global fallback `window.switchPengaturanTab` pada shell utama aplikasi agar seluruh tab navigasi pengaturan dapat selalu diakses dan diklik secara instan dalam kondisi apa pun.

---

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

### Versi 36 — Perbaikan Error "namaHari is not defined" Saat Cetak/Pratinjau Berita Acara
- **Latar Belakang Permintaan**:
  - Pengguna melaporkan error (*"Terjadi Kesalahan - Error getBeritaAcaraFormalDetail: namaHari is not defined"*) saat hendak mencetak atau mempratinjau Berita Acara Alih Media.
- **Penyebab**:
  - Di dalam fungsi `getBeritaAcaraFormalDetail()` pada `BeritaAcaraService.gs`, objek respons mencoba mengakses variabel `namaHari` pada properti `hariNama: namaHari` dan `tanggalPelaksanaanFormatted`, namun variabel `namaHari` belum dideklarasikan sebelumnya.
- **Modifikasi Berkas**:
  1. `BeritaAcaraService.gs`:
     - Menambahkan deklarasi dan kalkulasi hari pelaksanaan formal `daftarNamaHari` berdasarkan tanggal dokumen `tglPelaksanaan.getDay()` (Minggu - Sabtu).
     - Menjadikan tanggal Berita Acara dinamis mengikuti `tanggal_dibuat` dokumen aktual jika tersedia.
- **Deployment**:
  - Berhasil di-deploy ke deployment aktif `AKfycbxIbcIiJY3FpeBJM9hC40_GYXNz-hIWgIcVZyvIm1NQaSj2TeJ5lxQ4VsG1OxEw077B` (@59).

---

### Versi 35 — Perbaikan Error "Jumlah kolom dalam rentang setidaknya harus 1" Saat Pembuatan Berita Acara
- **Latar Belakang Permintaan**:
  - Pengguna melaporkan pesan error (*"Terjadi Kesalahan - Error: Jumlah kolom dalam rentang setidaknya harus 1"*) saat menerbitkan Berita Acara Alih Media baru.
- **Penyebab**:
  - Pada sheet `berita_acara` yang masih kosong (0 kolom), pemanggilan `appendData()` di `Database.gs` memanggil `sheet.getRange(1, 1, 1, sheet.getLastColumn())` di mana `getLastColumn() == 0`. Dalam Google Apps Script, parameter jumlah kolom rentang harus $\ge 1$, sehingga fungsi melempar exception `Jumlah kolom dalam rentang setidaknya harus 1`.
  - Fungsi inisialisasi awal `syncAllDatabaseHeaders()` sebelumnya hanya mendaftarkan sheet `master_arsip`, sehingga sheet `berita_acara` tidak memiliki header saat pertama kali diakses.
- **Modifikasi Berkas**:
  1. `Database.gs`:
     - Menambahkan proteksi otomatis pada `appendData()`: jika sheet memiliki 0 kolom (`lastCol < 1`), sistem secara otomatis memasang baris header resmi dan menata format header sebelum data dimasukkan.
     - Melindungi `updateData()`, `getHeaders()`, dan `readAllData()` agar kebal dari sheet kosong.
     - Memperluas `syncAllDatabaseHeaders()` agar secara otomatis mensinkronkan kolom seluruh sheet sistem (`BERITA_ACARA`, `MASTER_ARSIP`, `MASTER_STAF`, `LOG_AKTIVITAS`, `LOG_AKSES`, `TARGET_REALISASI`, `PENGATURAN`, `KODE_ASAL`).
  2. `BeritaAcaraService.gs`:
     - Fungsi `generateBeritaAcara()` kini secara otomatis menghasilkan Nomor Berita Acara resmi (contoh: `000.4.1/DAP/BA-AM/01/IX/2026`).
     - Otomatis menghitung jumlah arsip aktual dari `master_arsip` untuk bulan dan staf bersangkutan jika belum terisi.
     - Menghubungkan identitas pembuat ke log aktivitas audit trail.
  3. `Utils.gs`:
     - Menambahkan fungsi pembantu `getBulanRomawi(monthIndex)` untuk penomoran naskah dinas resmi.
- **Deployment**:
  - Berhasil di-deploy ke deployment aktif `AKfycbxIbcIiJY3FpeBJM9hC40_GYXNz-hIWgIcVZyvIm1NQaSj2TeJ5lxQ4VsG1OxEw077B` (@58).

---

### Versi 34 — Penguncian Staf Penginput dari Sesi Login & Auto-Redirect ke Daftar Arsip
- **Latar Belakang Permintaan**:
  1. Pegawai yang menginputkan arsip baru harus 100% terkunci sesuai identitas staf yang dipilih saat login (`select-staff`).
  2. Setelah form input arsip baru berhasil disimpan, halaman otomatis dialihkan (reload/redirect SPA) langsung ke halaman **Daftar Arsip** (`daftar-arsip`).
- **Modifikasi Berkas**:
  1. `InputArsip.html`:
     - Sinkronisasi otomatis field `stafNama` dan `stafId` dari multi-level session (`sessionStorage['siasta_user']`, `window._currentUser`, dan DOM `#user-name`).
     - Di `processSaveArsip()`, payload `formData` menyertakan `stafId`, `stafNama`, dan objek `activeUser` lengkap.
     - Setelah sukses simpan, form di-reset, cache template di-clear, dan dialog SweetAlert otomatis memicu navigasi langsung ke `navigateTo('daftar-arsip')` dalam 1.6 detik atau melalui tombol 'Buka Daftar Arsip'.
  2. `ArsipService.gs`:
     - Logika `saveArsip(data)` memprioritaskan identitas staf dari klien (`data.activeUser` / `data.stafNama` / `data.stafId`) sebelum fallback ke server session `getCurrentUser()`.
     - Data `staf_id` dan `staf_nama` tersimpan akurat di Google Sheet `master_arsip`.
     - `logActivity('INPUT_ARSIP', ...)` mencatat nama staf penginput aktual.
  3. `LogService.gs`:
     - Menambahkan parameter opsional `stafObj` pada fungsi `logActivity(aksi, modul, detail, stafObj)` agar pencatatan audit trail aktivitas selaras dengan staf yang bertugas.
- **Deployment**:
  - Berhasil di-deploy ke deployment aktif `AKfycbxIbcIiJY3FpeBJM9hC40_GYXNz-hIWgIcVZyvIm1NQaSj2TeJ5lxQ4VsG1OxEw077B` (@57).

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

---

## 🧹 Pembersihan Basis Data Google Spreadsheet (v1.0.0 - Rev 67 / 19 September 2026)

### Latar Belakang & Masalah
Sesuai arahan pengguna untuk menghilangkan sheet dan field/kolom yang tidak terpakai ("wadah kosong") yang membingungkan, dilakukan audit basis data menyeluruh terhadap Google Spreadsheet SIASTA (`1eERa08ccRqPJp7r_iGddzcnWnI1NnYn4UDl3_60CzK0`). Ditemukan 13 sheet peninggalan versi uji coba lama yang kosong/duplikat serta beberapa kolom kosong pada sheet utama.

### Rincian Tindakan Pembersihan
1. **Pemberhentian & Penghapusan 13 Sheet Tidak Terpakai**:
   - `Sheet1` (sheet default kosong bawaan Google Sheets)
   - `DataArsip`, `data_arsip`, `arsip` (wadah lama bekas inisialisasi awal)
   - `BeritaAcara`, `LogAktivitas`, `LogAkses` (duplikat huruf besar yang tidak dipakai)
   - `log_akses` (wadah kosong; audit trail aktif sepenuhnya menggunakan `log_aktivitas`)
   - `MasterSumberArsip` (duplikat lama dari `kode_asal_arsip`)
   - `MasterStaff` (duplikat lama dari `master_staf`)
   - `Target`, `target_realisasi` (wadah kosong; modul target & realisasi dikalkulasi secara dinamis dari `master_arsip`)
   - `Login` (wadah statis lama; autentikasi aktif menggunakan kredensial `master_staf` & `CONFIG.AUTH`)

2. **Pembersihan Kolom Wadah Kosong pada Sheet Aktif**:
   - **`master_arsip`**: Dihapus kolom kosong `kurun_waktu_akhir` dan kolom duplikat `kurun_waktu` (AH). Nilai tahun dinormalisasi ke satu kolom bersih `kurun_waktu`. Total kolom tepat 32 kolom terstruktur rapi.
   - **`pengaturan`**: Dihapus kolom kosong E (`kunci`) dan F (`nilai`). Total kolom tepat 4 kolom (`key`, `value`, `deskripsi`, `tanggal_update`).
   - **`kode_asal_arsip`**: Dihapus kolom kosong E-H (`kode`, `nama`, `deskripsi`, `status` duplikat). Standardisasi header menjadi 4 kolom bersih (`kode`, `nama`, `deskripsi`, `status`).
   - **`master_staf`**, **`berita_acara`**, **`log_aktivitas`**: Merapikan pembatasan kolom dan pemformatan header (background navy `#1B2A4A`, teks putih tebal, baris pertama dibekukan/frozen).

3. **Hasil Akhir Basis Data (Hanya Tersisa 6 Sheet Utama Aktif)**:
   - `master_arsip` (32 kolom) - Seluruh data arsip riil aman 100%.
   - `master_staf` (9 kolom) - Profil 6 staf & tanda tangan digital aman 100%.
   - `berita_acara` (15 kolom) - Riwayat dokumen BA resmi aman 100%.
   - `log_aktivitas` (8 kolom) - Catatan audit aktivitas aman 100%.
   - `pengaturan` (4 kolom) - Konfigurasi pejabat, watermark, dan target aman 100%.
   - `kode_asal_arsip` (4 kolom) - 10 daftar referensi unit/kecamatan asal arsip aman 100%.

---

## 🖨️ Perbaikan Cetak Rekapitulasi Alih Media Anti-Terpotong (v1.0.0 - Rev 68 / 19 September 2026)

### Latar Belakang & Masalah
Pada dokumen cetak rekapitulasi alih media arsip statis di menu **Daftar Arsip -> Export -> Cetak Rekap Resmi**, ditemukan masalah tampilan saat dicetak/dipratinjau:
1. **Kata-kata terpotong menjadi dua baris**: Nilai sel seperti *Tekstual* terpotong menjadi *Tekstu* / *al*, *Pemerintahan* terpotong menjadi *Pemerinta* / *han*, *Klasifikasi* terpotong menjadi *Klasifika* / *si*, dan *Status Keterbukaan* terpotong karena tidak ada lebar kolom yang proporsional serta penggunaan `word-break: break-word`.
2. **Duplikasi Kata Judul**: Muncul tulisan `Periode: Tahun Tahun 2026` akibat string filter tahun digabung berulang.
3. **Margin & Pemotongan Halaman**: Padding ganda (`padding: 20mm 18mm` + `8mm`) mempersempit area tabel 20 kolom sehingga terdesak ke batas kanan kertas.

### Rincian Perbaikan
1. **Lebar Kolom Proporsional & Presisi (100% Total Table Width)**:
   - Diterapkan `table-layout: fixed !important;` dengan persentase lebar yang presisi untuk ke-20 kolom (No: 2.2%, Kode Unik: 5.5%, Status: 4.8%, Asal: 7%, Kode Asal: 2.5%, Box: 2.5%, Urut: 2.2%, Deskripsi: 16.5%, Jenis: 3.8%, Urusan: 5.5%, Klasifikasi: 4.2%, Nomor Asli: 5.5%, Lbr: 2.5%, Bks: 2.5%, Rkp: 2.2%, Fisik: 3.2%, Tahun: 3.7%, Unit: 7.5%, Lokasi: 8%, Ket: 8.8%).
   - Diterapkan `white-space: nowrap !important;` pada sel kode unik, status, nomor box, tanggal, angka lembar/berkas, jenis arsip, dan kondisi fisik sehingga kata tidak akan pernah terbelah dua.
   - Kolom deskripsi naratif tetap memecah baris secara alami per kata (`word-break: normal; line-height: 1.2;`).
2. **Kop Surat & Header Kompak**:
   - Memperkecil tinggi Kop Surat dan margin bawah secara proporsional.
   - Judul periode dinormalisasi menjadi `Periode: Tahun 2026`.
3. **Pengatur Skala Cetak Interaktif**:
   - Menambahkan tombol pilihan skala pada toolbar cetak di tab baru:
     - `100% (Normal)`
     - `95% (Pas)`
     - `90% (Kompak)`
   - Disertai tips pengaturan dialog cetak browser (*Landscape* & *Margin Minimum*).


