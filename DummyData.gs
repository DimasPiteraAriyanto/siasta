/**
 * =========================================
 * SIASTA - DummyData.gs
 * Generator Data Dummy Realistis untuk SIASTA
 * Standar ANRI — Dinas Kearsipan dan Perpustakaan Daerah
 * Kabupaten Manggarai Barat
 * =========================================
 */

/**
 * Seed data dummy lengkap:
 * - Master Arsip (40 data arsip realistis berbagai jenis, asal, box, dan kurun waktu)
 * - Berita Acara (Staf & Gabungan)
 * - Log Aktivitas (25+ catatan riwayat sistem)
 * - Master Staf & Kode Asal Arsip
 * 
 * @param {boolean} force - Jika true, replace/tambahkan ulang
 * @returns {Object} Response JSON
 */
function seedFullDummyData(force) {
  try {
    // 1. Pastikan semua sheet & headers siap
    initializeAllSheets();
    seedInitialData();

    var arsipSheet = getSheet(CONFIG.SHEETS.MASTER_ARSIP);
    var existingArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP);

    if (!force && existingArsip.length >= 35) {
      return jsonResponse(true, {
        totalArsip: existingArsip.length
      }, 'Data dummy sudah ada sebelumnya (' + existingArsip.length + ' arsip). Gunakan force=true jika ingin menimpa.');
    }

    // Jika force, bersihkan baris data lama (pertahankan header baris 1)
    if (force && arsipSheet.getLastRow() > 1) {
      arsipSheet.deleteRows(2, arsipSheet.getLastRow() - 1);
    }

    var now = new Date();
    var curYear = (CONFIG.APP && CONFIG.APP.TAHUN) ? parseInt(CONFIG.APP.TAHUN) : 2026;

    // 2. Daftar 40 Arsip Realistis Kabupaten Manggarai Barat
    var dummyArsipList = [
      // --- BULAN 0: JANUARI (5 Arsip) ---
      {
        kode_unik: 'KOM-B01-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Komodo',
        kode_asal: 'KOM',
        nomor_box: 'B01',
        nomor_urut: '001',
        deskripsi: 'Keputusan Bupati Manggarai Barat Nomor 45/HK/2004 tentang Penetapan Batas Wilayah Administrasi Kecamatan Komodo dan Wilayah Konservasi Kawasan Taman Nasional Komodo',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 16,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2004',
        kurun_waktu_akhir: '2004',
        unit_pengelola: 'Bagian Hukum dan Perundang-undangan Setda',
        lokasi_simpan: 'Depot Arsip A, Lemari 01, Rak 02',
        keterangan: 'Kondisi fisik arsip asli baik, kertas HVS 70gr sedikit menguning',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 0, 10, 9, 30)
      },
      {
        kode_unik: 'KOM-B01-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Komodo',
        kode_asal: 'KOM',
        nomor_box: 'B01',
        nomor_urut: '002',
        deskripsi: 'Peta Rencana Tata Ruang Kawasan Pesisir Labuan Bajo dan Kepulauan Komodo Skala 1:50.000 Periode 2006-2016',
        jenis_arsip: 'Kartografi/Gambar Teknik',
        jumlah_lembar: 4,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2006',
        kurun_waktu_akhir: '2006',
        unit_pengelola: 'BAPPEDA Litbang Kabupaten Manggarai Barat',
        lokasi_simpan: 'Depot Arsip B, Lemari Peta Map-01',
        keterangan: 'Peta cetak kalkir dan kertas linen format A1',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 0, 15, 11, 15)
      },
      {
        kode_unik: 'LBJ-B01-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Labuan Bajo',
        kode_asal: 'LBJ',
        nomor_box: 'B01',
        nomor_urut: '001',
        deskripsi: 'Dokumen Masterplan Pembangunan Fasilitas Pelabuhan Laut dan Dermaga Marina Wisata Bahari Labuan Bajo',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 42,
        jumlah_berkas: 2,
        kurun_waktu_mulai: '2008',
        kurun_waktu_akhir: '2010',
        unit_pengelola: 'Dinas Perhubungan Kabupaten Manggarai Barat',
        lokasi_simpan: 'Depot Arsip A, Lemari 02, Rak 01',
        keterangan: 'Lengkap dengan gambar rancang bangun teknis arsitektural',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 0, 20, 14, 0)
      },
      {
        kode_unik: 'LBJ-B01-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Labuan Bajo',
        kode_asal: 'LBJ',
        nomor_box: 'B01',
        nomor_urut: '002',
        deskripsi: 'Album Foto Dokumentasi Alih Fungsi Kawasan Pantai Kampung Ujung Menjadi Pusat Wisata Kuliner Nusantara',
        jenis_arsip: 'Foto',
        jumlah_lembar: 28,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2012',
        kurun_waktu_akhir: '2013',
        unit_pengelola: 'Dinas Pariwisata dan Kebudayaan',
        lokasi_simpan: 'Depot Arsip Foto, Box F-01',
        keterangan: 'Foto cetak warna ukuran 5R dan 10R kondisi terawat',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 0, 24, 10, 45)
      },
      {
        kode_unik: 'MAC-B01-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Macang Pacar',
        kode_asal: 'MAC',
        nomor_box: 'B01',
        nomor_urut: '001',
        deskripsi: 'Berkas Berita Acara Musyawarah Pembentukan Desa Persiapan dan Batas Adat Ulayat Masyarakat Macang Pacar',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 22,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2005',
        kurun_waktu_akhir: '2005',
        unit_pengelola: 'Bagian Tata Pemerintahan Setda',
        lokasi_simpan: 'Depot Arsip A, Lemari 03, Rak 02',
        keterangan: 'Dilengkapi tanda tangan para Tua Golo dan Tua Teno',
        staf_id: 'STAF-003',
        staf_nama: 'Stefanus Rahmat, S.Sos',
        tanggal_input: new Date(curYear, 0, 29, 13, 20)
      },

      // --- BULAN 1: FEBRUARI (5 Arsip) ---
      {
        kode_unik: 'BOL-B01-001',
        status_keterbukaan: 'Tertutup',
        asal_arsip: 'Kecamatan Boleng',
        kode_asal: 'BOL',
        nomor_box: 'B01',
        nomor_urut: '001',
        deskripsi: 'Naskah Asli Perjanjian Perdamaian dan Tapal Batas Adat Antara Komunitas Adat Boleng dan Kempo',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 12,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '1998',
        kurun_waktu_akhir: '1999',
        unit_pengelola: 'Bagian Tata Pemerintahan Setda',
        lokasi_simpan: 'Khazanah Khusus Tertutup, Lemari T-01',
        keterangan: 'Arsip kategori tertutup berdasarkan pertimbangan sensitivitas adat',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 1, 5, 9, 10)
      },
      {
        kode_unik: 'LEM-B01-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Lembor',
        kode_asal: 'LEM',
        nomor_box: 'B01',
        nomor_urut: '001',
        deskripsi: 'Dokumen Perencanaan dan Gambar Detail Desain Saluran Irigasi Primer Persawahan Lembor untuk Ketahanan Pangan Daerah',
        jenis_arsip: 'Kearsitekturan',
        jumlah_lembar: 34,
        jumlah_berkas: 2,
        kurun_waktu_mulai: '2006',
        kurun_waktu_akhir: '2007',
        unit_pengelola: 'Dinas Pekerjaan Umum dan Penataan Ruang',
        lokasi_simpan: 'Depot Arsip C, Lemari Arsitektur C-02',
        keterangan: 'Gambar kalkir A2 kondisi utuh dan terbaca jelas',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 1, 12, 14, 30)
      },
      {
        kode_unik: 'LEM-B01-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Lembor',
        kode_asal: 'LEM',
        nomor_box: 'B01',
        nomor_urut: '002',
        deskripsi: 'Daftar Nominatif Warga Transmigrasi dan Penyerahan Sertifikat Hak Milik Lahan Usaha Tani Dataran Lembor Tahun 1988',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 58,
        jumlah_berkas: 3,
        kurun_waktu_mulai: '1988',
        kurun_waktu_akhir: '1989',
        unit_pengelola: 'Dinas Tenaga Kerja dan Transmigrasi',
        lokasi_simpan: 'Depot Arsip A, Lemari 04, Rak 01',
        keterangan: 'Kertas folio bergaris ketikan mesin tik manual',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 1, 18, 10, 0)
      },
      {
        kode_unik: 'WEL-B01-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Welak',
        kode_asal: 'WEL',
        nomor_box: 'B01',
        nomor_urut: '001',
        deskripsi: 'Surat Keputusan Bupati tentang Penetapan Kawasan Hutan Lindung dan Perlindungan Mata Air Bersih Kecamatan Welak',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 14,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2007',
        kurun_waktu_akhir: '2007',
        unit_pengelola: 'Dinas Lingkungan Hidup dan Kebersihan',
        lokasi_simpan: 'Depot Arsip A, Lemari 04, Rak 03',
        keterangan: 'Lengkap dengan peta sebaran titik mata air',
        staf_id: 'STAF-003',
        staf_nama: 'Stefanus Rahmat, S.Sos',
        tanggal_input: new Date(curYear, 1, 23, 15, 20)
      },
      {
        kode_unik: 'DKP-B01-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Dinas Kearsipan & Perpustakaan',
        kode_asal: 'DKP',
        nomor_box: 'B01',
        nomor_urut: '001',
        deskripsi: 'Buku Laporan Inventarisasi dan Akuisisi Khazanah Naskah Kuno dan Sejarah Lisan Kabupaten Manggarai Barat',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 84,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2009',
        kurun_waktu_akhir: '2010',
        unit_pengelola: 'Dinas Kearsipan dan Perpustakaan Daerah',
        lokasi_simpan: 'Depot Khazanah, Rak Utama K-01',
        keterangan: 'Dokumentasi penting sejarah kebudayaan daerah Manggarai Barat',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 1, 27, 11, 40)
      },

      // --- BULAN 2: MARET (5 Arsip) ---
      {
        kode_unik: 'SAT-B01-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Sano Nggoang',
        kode_asal: 'SAT',
        nomor_box: 'B01',
        nomor_urut: '001',
        deskripsi: 'Kajian Perlindungan Geowisata Danau Sano Nggoang Sebagai Sumber Air Panas Alami dan Cagar Ekologi Daerah',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 36,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2011',
        kurun_waktu_akhir: '2012',
        unit_pengelola: 'Dinas Kebudayaan dan Pariwisata',
        lokasi_simpan: 'Depot Arsip A, Lemari 05, Rak 01',
        keterangan: 'Kondisi berkas jilid lakban rapi dan bersih',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 2, 4, 9, 30)
      },
      {
        kode_unik: 'NDO-B01-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Ndoso',
        kode_asal: 'NDO',
        nomor_box: 'B01',
        nomor_urut: '001',
        deskripsi: 'Rencana Jalur Pembukaan Jalan Strategis Penghubung Kecamatan Ndoso Menuju Pusat Pemerintahan Labuan Bajo',
        jenis_arsip: 'Kartografi/Gambar Teknik',
        jumlah_lembar: 8,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2008',
        kurun_waktu_akhir: '2009',
        unit_pengelola: 'Dinas Bina Marga dan Pengairan',
        lokasi_simpan: 'Depot Arsip B, Lemari Peta Map-02',
        keterangan: 'Peta kontur topografi jalur perbukitan Ndoso',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 2, 11, 13, 15)
      },
      {
        kode_unik: 'DKP-B01-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Dinas Kearsipan & Perpustakaan',
        kode_asal: 'DKP',
        nomor_box: 'B01',
        nomor_urut: '002',
        deskripsi: 'Rekaman Audio Pidato Bersejarah Peresmian Kabupaten Manggarai Barat oleh Mendagri RI Tahun 2003',
        jenis_arsip: 'Bentuk Lain',
        jumlah_lembar: 2,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2003',
        kurun_waktu_akhir: '2003',
        unit_pengelola: 'Bagian Humas dan Protokol Setda',
        lokasi_simpan: 'Media Khusus Multimedia, Box MM-01',
        keterangan: 'Format pita kaset asli dialihmediakan ke format digital WAV/MP3',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 2, 17, 10, 0)
      },
      {
        kode_unik: 'LBJ-B02-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Labuan Bajo',
        kode_asal: 'LBJ',
        nomor_box: 'B02',
        nomor_urut: '001',
        deskripsi: 'Foto Dokumentasi Kunjungan Kerja Presiden Republik Indonesia Meninjau Kawasan Puncak Waringin Labuan Bajo',
        jenis_arsip: 'Foto',
        jumlah_lembar: 18,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2019',
        kurun_waktu_akhir: '2019',
        unit_pengelola: 'Bagian Protokol dan Komunikasi Pimpinan',
        lokasi_simpan: 'Depot Arsip Foto, Box F-02',
        keterangan: 'Foto cetak premium tajam dan beresolusi tinggi',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 2, 22, 14, 25)
      },
      {
        kode_unik: 'KOM-B02-001',
        status_keterbukaan: 'Tertutup',
        asal_arsip: 'Kecamatan Komodo',
        kode_asal: 'KOM',
        nomor_box: 'B02',
        nomor_urut: '001',
        deskripsi: 'Dokumen Warkah Tanah Hak Ulayat dan Silsilah Pemilikan Lahan Zona Penyangga Pulau Komodo',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 26,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '1995',
        kurun_waktu_akhir: '1996',
        unit_pengelola: 'Kantor Pertanahan dan Bagian Hukum',
        lokasi_simpan: 'Khazanah Khusus Tertutup, Lemari T-02',
        keterangan: 'Klasifikasi tertutup demi perlindungan data hak keperdataan',
        staf_id: 'STAF-003',
        staf_nama: 'Stefanus Rahmat, S.Sos',
        tanggal_input: new Date(curYear, 2, 28, 11, 10)
      },

      // --- BULAN 3: APRIL (4 Arsip) ---
      {
        kode_unik: 'KOM-B02-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Komodo',
        kode_asal: 'KOM',
        nomor_box: 'B02',
        nomor_urut: '002',
        deskripsi: 'Peraturan Daerah Kabupaten Manggarai Barat Nomor 2 Tahun 2005 tentang Pengelolaan Terumbu Karang dan Sumberdaya Pesisir',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 20,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2005',
        kurun_waktu_akhir: '2005',
        unit_pengelola: 'Dinas Kelautan dan Perikanan Daerah',
        lokasi_simpan: 'Depot Arsip A, Lemari 02, Rak 03',
        keterangan: 'Salinan resmi bernomor lembaran daerah',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 3, 7, 9, 20)
      },
      {
        kode_unik: 'LBJ-B02-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Labuan Bajo',
        kode_asal: 'LBJ',
        nomor_box: 'B02',
        nomor_urut: '002',
        deskripsi: 'Gambar Kerja DED Pembangunan Gedung RSUD Komodo Manggarai Barat',
        jenis_arsip: 'Kearsitekturan',
        jumlah_lembar: 45,
        jumlah_berkas: 2,
        kurun_waktu_mulai: '2013',
        kurun_waktu_akhir: '2014',
        unit_pengelola: 'Dinas Kesehatan Kabupaten Manggarai Barat',
        lokasi_simpan: 'Depot Arsip C, Lemari Arsitektur C-03',
        keterangan: 'Gambar arsitektur, struktur sipil, MEP lengkap',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 3, 14, 13, 40)
      },
      {
        kode_unik: 'MAC-B01-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Macang Pacar',
        kode_asal: 'MAC',
        nomor_box: 'B01',
        nomor_urut: '002',
        deskripsi: 'Inventarisasi Potensi Perikanan Tangkap dan Rumput Laut Masyarakat Pesisir Macang Pacar Utara',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 30,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2010',
        kurun_waktu_akhir: '2011',
        unit_pengelola: 'Dinas Perikanan dan Ketahanan Pangan',
        lokasi_simpan: 'Depot Arsip A, Lemari 03, Rak 04',
        keterangan: 'Kondisi naskah lengkap dengan data tabel statistik',
        staf_id: 'STAF-003',
        staf_nama: 'Stefanus Rahmat, S.Sos',
        tanggal_input: new Date(curYear, 3, 21, 10, 15)
      },
      {
        kode_unik: 'BOL-B01-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Boleng',
        kode_asal: 'BOL',
        nomor_box: 'B01',
        nomor_urut: '002',
        deskripsi: 'Surat Keputusan Bupati tentang Penetapan Hutan Kemasyarakatan (HKm) Desa Golo Lujang Kecamatan Boleng',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 15,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2015',
        kurun_waktu_akhir: '2015',
        unit_pengelola: 'Dinas Kehutanan dan Perkebunan',
        lokasi_simpan: 'Depot Arsip A, Lemari 05, Rak 02',
        keterangan: 'Dilengkapi lampiran peta batas kawasan HKm',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 3, 27, 14, 50)
      },

      // --- BULAN 4: MEI (5 Arsip) ---
      {
        kode_unik: 'LEM-B02-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Lembor',
        kode_asal: 'LEM',
        nomor_box: 'B02',
        nomor_urut: '001',
        deskripsi: 'Foto Panen Raya Padi Varietas Unggul Lokal Pertama Tingkat Kabupaten di Hamparan Sawah Lembor Bersama Petani',
        jenis_arsip: 'Foto',
        jumlah_lembar: 22,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2005',
        kurun_waktu_akhir: '2005',
        unit_pengelola: 'Dinas Pertanian dan Perkebunan',
        lokasi_simpan: 'Depot Arsip Foto, Box F-03',
        keterangan: 'Dokumentasi otentik kejayaan sentra beras NTT',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 4, 6, 10, 30)
      },
      {
        kode_unik: 'WEL-B01-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Welak',
        kode_asal: 'WEL',
        nomor_box: 'B01',
        nomor_urut: '002',
        deskripsi: 'Laporan Eksplorasi Potensi Bahan Galian Mineral Bukan Logam dan Batuan Gunung di Wilayah Welak',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 48,
        jumlah_berkas: 2,
        kurun_waktu_mulai: '2008',
        kurun_waktu_akhir: '2009',
        unit_pengelola: 'Dinas Pertambangan dan Energi',
        lokasi_simpan: 'Depot Arsip A, Lemari 06, Rak 01',
        keterangan: 'Lengkap dengan peta geologi skala 1:25.000',
        staf_id: 'STAF-003',
        staf_nama: 'Stefanus Rahmat, S.Sos',
        tanggal_input: new Date(curYear, 4, 13, 11, 10)
      },
      {
        kode_unik: 'SAT-B01-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Sano Nggoang',
        kode_asal: 'SAT',
        nomor_box: 'B01',
        nomor_urut: '002',
        deskripsi: 'Naskah Adat Ritual Penti dan Upacara Syukur Pascapanen Komunitas Rumah Adat Mbaru Gendang Werang',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 18,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2002',
        kurun_waktu_akhir: '2002',
        unit_pengelola: 'Dinas Pendidikan Kepemudaan dan Olahraga',
        lokasi_simpan: 'Depot Arsip A, Lemari 05, Rak 03',
        keterangan: 'Teks tertulis bahasa Manggarai dengan terjemahan Indonesia',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 4, 19, 14, 15)
      },
      {
        kode_unik: 'DKP-B02-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Dinas Kearsipan & Perpustakaan',
        kode_asal: 'DKP',
        nomor_box: 'B02',
        nomor_urut: '001',
        deskripsi: 'Pedoman Tata Kearsipan Statis dan Jadwal Retensi Arsip (JRA) Pemerintah Kabupaten Manggarai Barat',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 75,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2016',
        kurun_waktu_akhir: '2016',
        unit_pengelola: 'Dinas Kearsipan dan Perpustakaan Daerah',
        lokasi_simpan: 'Depot Khazanah, Rak Pedoman P-01',
        keterangan: 'Buku pedoman resmi berstandar ANRI',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 4, 25, 9, 45)
      },
      {
        kode_unik: 'UMM-B01-001',
        status_keterbukaan: 'Tertutup',
        asal_arsip: 'Umum/Lainnya',
        kode_asal: 'UMM',
        nomor_box: 'B01',
        nomor_urut: '001',
        deskripsi: 'Berkas Dokumen Verifikasi Ganti Kerugian Pengadaan Tanah Bandara Internasional Komodo Labuan Bajo',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 64,
        jumlah_berkas: 3,
        kurun_waktu_mulai: '2011',
        kurun_waktu_akhir: '2013',
        unit_pengelola: 'Panitia Pengadaan Tanah Pemda dan BPN',
        lokasi_simpan: 'Khazanah Khusus Tertutup, Lemari T-03',
        keterangan: 'Kategori tertutup — memuat data rekening dan bukti kepemilikan privat',
        staf_id: 'STAF-003',
        staf_nama: 'Stefanus Rahmat, S.Sos',
        tanggal_input: new Date(curYear, 4, 29, 15, 30)
      },

      // --- BULAN 5: JUNI (4 Arsip) ---
      {
        kode_unik: 'LBJ-B03-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Labuan Bajo',
        kode_asal: 'LBJ',
        nomor_box: 'B03',
        nomor_urut: '001',
        deskripsi: 'Peta Jaringan Pipa Distribusi Air Bersih SPAM Labuan Bajo Sumber Mata Air Wae Mese Skala 1:10.000',
        jenis_arsip: 'Kartografi/Gambar Teknik',
        jumlah_lembar: 6,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2014',
        kurun_waktu_akhir: '2015',
        unit_pengelola: 'Perumda Air Minum Wae Mbeliling',
        lokasi_simpan: 'Depot Arsip B, Lemari Peta Map-03',
        keterangan: 'Peta teknis sistem perpipaan wilayah Labuan Bajo',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 5, 5, 10, 0)
      },
      {
        kode_unik: 'KOM-B03-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Komodo',
        kode_asal: 'KOM',
        nomor_box: 'B03',
        nomor_urut: '001',
        deskripsi: 'Album Foto Dokumentasi Sejarah Mercusuar Peninggalan Hindia Belanda di Pulau Komodo dan Selat Sape',
        jenis_arsip: 'Foto',
        jumlah_lembar: 16,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '1985',
        kurun_waktu_akhir: '1990',
        unit_pengelola: 'Distrik Navigasi dan Kantor Syahbandar',
        lokasi_simpan: 'Depot Arsip Foto, Box F-04',
        keterangan: 'Foto hitam-putih bersejarah kondisi preservasi terjaga',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 5, 12, 13, 20)
      },
      {
        kode_unik: 'NDO-B01-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Ndoso',
        kode_asal: 'NDO',
        nomor_box: 'B01',
        nomor_urut: '002',
        deskripsi: 'Surat Penetapan Kawasan Cagar Alam Hutan Wae Wuul Sebagai Habitat Khas Ekosistem Daerah Dataran Tinggi Ndoso',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 14,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2004',
        kurun_waktu_akhir: '2004',
        unit_pengelola: 'Dinas Kehutanan dan Perkebunan',
        lokasi_simpan: 'Depot Arsip A, Lemari 06, Rak 02',
        keterangan: 'Kondisi fisik arsip baik dan lengkap',
        staf_id: 'STAF-003',
        staf_nama: 'Stefanus Rahmat, S.Sos',
        tanggal_input: new Date(curYear, 5, 18, 11, 40)
      },
      {
        kode_unik: 'DKP-B02-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Dinas Kearsipan & Perpustakaan',
        kode_asal: 'DKP',
        nomor_box: 'B02',
        nomor_urut: '002',
        deskripsi: 'Dokumentasi Alih Media Arsip Berita Acara Serah Terima Aset Daerah dari Kabupaten Induk Manggarai ke Manggarai Barat',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 52,
        jumlah_berkas: 2,
        kurun_waktu_mulai: '2003',
        kurun_waktu_akhir: '2004',
        unit_pengelola: 'Badan Pengelolaan Keuangan dan Aset Daerah',
        lokasi_simpan: 'Depot Khazanah, Rak Utama K-02',
        keterangan: 'Arsip vital pembentukan daerah otonom Manggarai Barat',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 5, 24, 15, 0)
      },

      // --- BULAN 6: JULI (4 Arsip) ---
      {
        kode_unik: 'LBJ-B03-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Labuan Bajo',
        kode_asal: 'LBJ',
        nomor_box: 'B03',
        nomor_urut: '002',
        deskripsi: 'Gambar Rancang Bangun Gedung Kantor Bupati Manggarai Barat di Jalan Karentina Labuan Bajo',
        jenis_arsip: 'Kearsitekturan',
        jumlah_lembar: 38,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2005',
        kurun_waktu_akhir: '2006',
        unit_pengelola: 'Dinas Pekerjaan Umum dan Penataan Ruang',
        lokasi_simpan: 'Depot Arsip C, Lemari Arsitektur C-04',
        keterangan: 'Cetak biru arsitektur kantor bupati',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 6, 8, 9, 15)
      },
      {
        kode_unik: 'MAC-B02-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Macang Pacar',
        kode_asal: 'MAC',
        nomor_box: 'B02',
        nomor_urut: '001',
        deskripsi: 'Buku Registrasi Pernikahan Catatan Sipil Masa Pemerintahan Swatantra Manggarai Wilayah Macang Pacar',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 70,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '1978',
        kurun_waktu_akhir: '1982',
        unit_pengelola: 'Dinas Kependudukan dan Pencatatan Sipil',
        lokasi_simpan: 'Depot Arsip A, Lemari 03, Rak 05',
        keterangan: 'Arsip bernilai kebuktian hukum perdata masyarakat',
        staf_id: 'STAF-003',
        staf_nama: 'Stefanus Rahmat, S.Sos',
        tanggal_input: new Date(curYear, 6, 15, 14, 10)
      },
      {
        kode_unik: 'KOM-B03-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Komodo',
        kode_asal: 'KOM',
        nomor_box: 'B03',
        nomor_urut: '002',
        deskripsi: 'Foto Upacara Pengibaran Bendera Merah Putih Pertama di Puncak Bukit Sylvia Labuan Bajo Tahun 2004',
        jenis_arsip: 'Foto',
        jumlah_lembar: 12,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2004',
        kurun_waktu_akhir: '2004',
        unit_pengelola: 'Bagian Humas dan Protokol Setda',
        lokasi_simpan: 'Depot Arsip Foto, Box F-05',
        keterangan: 'Kondisi foto sangat baik dan bernilai sejarah patriotisme lokal',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 6, 21, 11, 25)
      },
      {
        kode_unik: 'BOL-B02-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Boleng',
        kode_asal: 'BOL',
        nomor_box: 'B02',
        nomor_urut: '001',
        deskripsi: 'Laporan Pendataan Cagar Budaya Situs Gua Batu Cermin dan Liang Bua Wilayah Manggarai Barat',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 32,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2007',
        kurun_waktu_akhir: '2008',
        unit_pengelola: 'Balai Pelestarian Kebudayaan dan Pariwisata',
        lokasi_simpan: 'Depot Arsip A, Lemari 05, Rak 04',
        keterangan: 'Lengkap dengan sketsa denah arkeologi gua',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 6, 28, 15, 45)
      },

      // --- BULAN 7: AGUSTUS (4 Arsip) ---
      {
        kode_unik: 'DKP-B03-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Dinas Kearsipan & Perpustakaan',
        kode_asal: 'DKP',
        nomor_box: 'B03',
        nomor_urut: '001',
        deskripsi: 'Naskah Pidato Sambutan Bupati Manggarai Barat Peringatan HUT RI ke-75 Tingkat Kabupaten Manggarai Barat',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 10,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2020',
        kurun_waktu_akhir: '2020',
        unit_pengelola: 'Bagian Protokol dan Komunikasi Pimpinan',
        lokasi_simpan: 'Depot Khazanah, Rak Utama K-03',
        keterangan: 'Naskah asli bertandatangan Bupati',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 7, 16, 16, 0)
      },
      {
        kode_unik: 'LEM-B02-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Lembor',
        kode_asal: 'LEM',
        nomor_box: 'B02',
        nomor_urut: '002',
        deskripsi: 'Surat Keputusan Bersama Kelompok Tani Pemakai Air (P3A) Daerah Irigasi Wae Laku Lembor',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 18,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2012',
        kurun_waktu_akhir: '2012',
        unit_pengelola: 'Dinas Pertanian dan Perkebunan',
        lokasi_simpan: 'Depot Arsip A, Lemari 04, Rak 04',
        keterangan: 'Memuat kesepakatan pembagian giliran air irigasi',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 7, 20, 10, 10)
      },
      {
        kode_unik: 'WEL-B02-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Welak',
        kode_asal: 'WEL',
        nomor_box: 'B02',
        nomor_urut: '001',
        deskripsi: 'Peta Batas Desa dan Wilayah Konservasi Kemasyarakatan Kecamatan Welak Skala 1:20.000',
        jenis_arsip: 'Kartografi/Gambar Teknik',
        jumlah_lembar: 5,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2015',
        kurun_waktu_akhir: '2016',
        unit_pengelola: 'Dinas Pemberdayaan Masyarakat dan Desa',
        lokasi_simpan: 'Depot Arsip B, Lemari Peta Map-04',
        keterangan: 'Peta hasil delineasi batas partisipatif desa',
        staf_id: 'STAF-003',
        staf_nama: 'Stefanus Rahmat, S.Sos',
        tanggal_input: new Date(curYear, 7, 25, 14, 0)
      },
      {
        kode_unik: 'SAT-B02-001',
        status_keterbukaan: 'Tertutup',
        asal_arsip: 'Kecamatan Sano Nggoang',
        kode_asal: 'SAT',
        nomor_box: 'B02',
        nomor_urut: '001',
        deskripsi: 'Berkas Laporan Intelijen Khusus Penanganan Sengketa Tapal Batas Hutan Adat Sano Nggoang',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 24,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2008',
        kurun_waktu_akhir: '2009',
        unit_pengelola: 'Badan Kesatuan Bangsa dan Politik Daerah',
        lokasi_simpan: 'Khazanah Khusus Tertutup, Lemari T-04',
        keterangan: 'Status tertutup selama masa retensi 25 tahun sesuai regulasi',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 7, 29, 11, 30)
      },

      // --- BULAN 8: SEPTEMBER (4 Arsip — Termasuk Hari Ini!) ---
      {
        kode_unik: 'KOM-B04-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Kecamatan Komodo',
        kode_asal: 'KOM',
        nomor_box: 'B04',
        nomor_urut: '001',
        deskripsi: 'Piagam Penghargaan Internasional UNESCO Penetapan Taman Nasional Komodo Sebagai Situs Warisan Dunia (World Heritage Site)',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 8,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '1991',
        kurun_waktu_akhir: '1991',
        unit_pengelola: 'Dinas Lingkungan Hidup dan Dinas Pariwisata',
        lokasi_simpan: 'Depot Khazanah Utama, Display Kaca D-01',
        keterangan: 'Sertifikat piagam berharga sejarah dunia',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 8, 2, 9, 30)
      },
      {
        kode_unik: 'LBJ-B04-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Labuan Bajo',
        kode_asal: 'LBJ',
        nomor_box: 'B04',
        nomor_urut: '001',
        deskripsi: 'Album Foto Udara Dokumentasi Perkembangan Kota Labuan Bajo Sebelum dan Sesudah Menjadi Destinasi Pariwisata Super Prioritas (DPSP)',
        jenis_arsip: 'Foto',
        jumlah_lembar: 32,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2018',
        kurun_waktu_akhir: '2022',
        unit_pengelola: 'BAPPEDA Litbang dan Dinas Kominfo',
        lokasi_simpan: 'Depot Arsip Foto, Box F-06',
        keterangan: 'Foto udara resolusi tinggi format panorama',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        tanggal_input: new Date(curYear, 8, 6, 14, 15)
      },
      {
        kode_unik: 'DKP-B03-002',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Dinas Kearsipan & Perpustakaan',
        kode_asal: 'DKP',
        nomor_box: 'B03',
        nomor_urut: '002',
        deskripsi: 'Laporan Monitoring dan Evaluasi Kualitas Alih Media Digital Arsip Statis Berdasarkan Pedoman ANRI No. 2 Tahun 2021',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 26,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2025',
        kurun_waktu_akhir: '2025',
        unit_pengelola: 'Dinas Kearsipan dan Perpustakaan Daerah',
        lokasi_simpan: 'Depot Khazanah, Rak Pedoman P-02',
        keterangan: 'Disertai daftar rekapitulasi nilai resolusi scanner dan audit berkas',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        tanggal_input: new Date(curYear, 8, 10, 11, 0)
      },
      {
        kode_unik: 'UMM-B02-001',
        status_keterbukaan: 'Terbuka',
        asal_arsip: 'Umum/Lainnya',
        kode_asal: 'UMM',
        nomor_box: 'B02',
        nomor_urut: '001',
        deskripsi: 'Naskah Deklarasi Kesepakatan Bersama Forum Komunikasi Pimpinan Daerah (Forkopimda) Kabupaten Manggarai Barat untuk Pelestarian Arsip Sejarah Daerah',
        jenis_arsip: 'Tekstual',
        jumlah_lembar: 12,
        jumlah_berkas: 1,
        kurun_waktu_mulai: '2026',
        kurun_waktu_akhir: '2026',
        unit_pengelola: 'Dinas Kearsipan dan Perpustakaan Daerah',
        lokasi_simpan: 'Depot Khazanah Utama, Display Kaca D-02',
        keterangan: 'Arsip autentik terbaru berstempel dinas lengkap',
        staf_id: 'STAF-004',
        staf_nama: 'Admin SIASTA',
        tanggal_input: new Date() // Hari ini!
      }
    ];

    // Simpan semua arsip dummy ke sheet MASTER_ARSIP via BATCH INSERT
    var arsipHeaders = [
      'id', 'kode_unik', 'status_keterbukaan', 'asal_arsip', 'kode_asal',
      'nomor_box', 'nomor_urut', 'deskripsi', 'jenis_arsip', 'jumlah_lembar',
      'jumlah_berkas', 'kurun_waktu_mulai', 'kurun_waktu_akhir',
      'unit_pengelola', 'lokasi_simpan', 'keterangan',
      'file_pelestarian_id', 'file_akses_id', 'file_pelestarian_url', 'file_akses_url',
      'qa_checklist', 'watermark_applied',
      'staf_id', 'staf_nama', 'tanggal_input', 'tanggal_update', 'status'
    ];
    setupSheetHeaders(CONFIG.SHEETS.MASTER_ARSIP, arsipHeaders);
    
    if (arsipSheet.getLastRow() > 1) {
      arsipSheet.deleteRows(2, arsipSheet.getLastRow() - 1);
    }
    
    var arsipRows = dummyArsipList.map(function(item, idx) {
      var row = {
        id: 'ARS-' + padNumber(idx + 1, 4),
        kode_unik: item.kode_unik,
        status_keterbukaan: item.status_keterbukaan,
        asal_arsip: item.asal_arsip,
        kode_asal: item.kode_asal,
        nomor_box: item.nomor_box,
        nomor_urut: item.nomor_urut,
        deskripsi: item.deskripsi,
        jenis_arsip: item.jenis_arsip,
        jumlah_lembar: item.jumlah_lembar,
        jumlah_berkas: item.jumlah_berkas,
        kurun_waktu_mulai: item.kurun_waktu_mulai,
        kurun_waktu_akhir: item.kurun_waktu_akhir,
        unit_pengelola: item.unit_pengelola,
        lokasi_simpan: item.lokasi_simpan,
        keterangan: item.keterangan,
        file_pelestarian_id: 'dummy_file_pelestarian_' + (idx + 1),
        file_akses_id: 'dummy_file_akses_' + (idx + 1),
        file_pelestarian_url: 'https://drive.google.com/file/d/dummy_pelestarian_' + (idx + 1) + '/view',
        file_akses_url: 'https://drive.google.com/file/d/dummy_akses_' + (idx + 1) + '/view',
        qa_checklist: JSON.stringify(CONFIG.QA_CHECKLIST),
        watermark_applied: 'Ya',
        staf_id: item.staf_id,
        staf_nama: item.staf_nama,
        tanggal_input: item.tanggal_input,
        tanggal_update: item.tanggal_input,
        status: 'Aktif'
      };
      return arsipHeaders.map(function(h) {
        return row[h] !== undefined ? row[h] : '';
      });
    });

    if (arsipRows.length > 0) {
      arsipSheet.getRange(2, 1, arsipRows.length, arsipHeaders.length).setValues(arsipRows);
    }

    // 3. Seed Berita Acara via BATCH INSERT
    var baSheet = getSheet(CONFIG.SHEETS.BERITA_ACARA);
    var baHeaders = [
      'id', 'bulan', 'tahun', 'tipe', 'staf_id', 'staf_nama',
      'jumlah_arsip', 'waktu_pelaksanaan', 'tempat_pelaksanaan',
      'jenis_media', 'file_id', 'file_url', 'status', 'tanggal_dibuat'
    ];
    setupSheetHeaders(CONFIG.SHEETS.BERITA_ACARA, baHeaders);
    if (baSheet.getLastRow() > 1) {
      baSheet.deleteRows(2, baSheet.getLastRow() - 1);
    }

    var dummyBAList = [
      {
        id: 'BA-202601-001',
        bulan: 0,
        tahun: curYear,
        tipe: 'staf',
        staf_id: 'STAF-001',
        staf_nama: 'Yohanes Don Bosco, S.Kom',
        jumlah_arsip: 5,
        waktu_pelaksanaan: '31 Januari ' + curYear,
        tempat_pelaksanaan: 'Ruang Alih Media Dinas Kearsipan dan Perpustakaan Daerah Kab. Manggarai Barat',
        jenis_media: 'TIFF 300dpi (Pelestarian) & PDF/A (Akses)',
        file_id: '',
        file_url: '',
        status: 'Selesai',
        tanggal_dibuat: new Date(curYear, 0, 31)
      },
      {
        id: 'BA-202602-001',
        bulan: 1,
        tahun: curYear,
        tipe: 'staf',
        staf_id: 'STAF-002',
        staf_nama: 'Maria Theresia Nona, S.AP',
        jumlah_arsip: 5,
        waktu_pelaksanaan: '28 Februari ' + curYear,
        tempat_pelaksanaan: 'Ruang Alih Media Dinas Kearsipan dan Perpustakaan Daerah Kab. Manggarai Barat',
        jenis_media: 'TIFF 300dpi (Pelestarian) & PDF/A (Akses)',
        file_id: '',
        file_url: '',
        status: 'Selesai',
        tanggal_dibuat: new Date(curYear, 1, 28)
      },
      {
        id: 'BA-202603-001',
        bulan: 2,
        tahun: curYear,
        tipe: 'gabungan',
        staf_id: '',
        staf_nama: 'Tim Alih Media SIASTA (Yohanes, Maria, Stefanus)',
        jumlah_arsip: 15,
        waktu_pelaksanaan: '31 Maret ' + curYear,
        tempat_pelaksanaan: 'Dinas Kearsipan dan Perpustakaan Daerah Kabupaten Manggarai Barat',
        jenis_media: 'TIFF 300-600dpi, PDF Searchable, JPEG High-Res',
        file_id: '',
        file_url: '',
        status: 'Selesai',
        tanggal_dibuat: new Date(curYear, 2, 31)
      },
      {
        id: 'BA-202606-001',
        bulan: 5,
        tahun: curYear,
        tipe: 'gabungan',
        staf_id: '',
        staf_nama: 'Tim Alih Media SIASTA (Yohanes, Maria, Stefanus)',
        jumlah_arsip: 27,
        waktu_pelaksanaan: '30 Juni ' + curYear,
        tempat_pelaksanaan: 'Dinas Kearsipan dan Perpustakaan Daerah Kabupaten Manggarai Barat',
        jenis_media: 'TIFF 300-600dpi, PDF Searchable, JPEG High-Res',
        file_id: '',
        file_url: '',
        status: 'Selesai',
        tanggal_dibuat: new Date(curYear, 5, 30)
      }
    ];

    var baRows = dummyBAList.map(function(ba) {
      return baHeaders.map(function(h) { return ba[h] !== undefined ? ba[h] : ''; });
    });
    if (baRows.length > 0) {
      baSheet.getRange(2, 1, baRows.length, baHeaders.length).setValues(baRows);
    }

    // 4. Seed Log Aktivitas via BATCH INSERT
    var logSheet = getSheet(CONFIG.SHEETS.LOG_AKTIVITAS);
    var logHeaders = [
      'id', 'timestamp', 'staf_id', 'staf_nama', 'aksi',
      'modul', 'detail', 'ip_address'
    ];
    setupSheetHeaders(CONFIG.SHEETS.LOG_AKTIVITAS, logHeaders);
    if (logSheet.getLastRow() > 1) {
      logSheet.deleteRows(2, logSheet.getLastRow() - 1);
    }

    var dummyLogs = [
      { aksi: 'LOGIN', modul: 'Auth', detail: 'User Yohanes Don Bosco berhasil login ke SIASTA', staf_id: 'STAF-001', staf_nama: 'Yohanes Don Bosco, S.Kom', offsetHours: -120 },
      { aksi: 'INPUT_ARSIP', modul: 'Arsip', detail: 'Input arsip baru: KOM-B04-001 - Piagam Penghargaan UNESCO', staf_id: 'STAF-001', staf_nama: 'Yohanes Don Bosco, S.Kom', offsetHours: -110 },
      { aksi: 'VERIFIKASI', modul: 'QA Checklist', detail: 'Verifikasi kualitas alih media KOM-B04-001: 6 butir standar terpenuhi', staf_id: 'STAF-002', staf_nama: 'Maria Theresia Nona, S.AP', offsetHours: -108 },
      { aksi: 'WATERMARK', modul: 'Drive', detail: 'Pemberian cap digital watermark DKP Kab. Manggarai Barat pada arsip KOM-B04-001', staf_id: 'STAF-001', staf_nama: 'Yohanes Don Bosco, S.Kom', offsetHours: -107 },
      { aksi: 'LOGIN', modul: 'Auth', detail: 'User Maria Theresia Nona berhasil login ke SIASTA', staf_id: 'STAF-002', staf_nama: 'Maria Theresia Nona, S.AP', offsetHours: -80 },
      { aksi: 'INPUT_ARSIP', modul: 'Arsip', detail: 'Input arsip baru: LBJ-B04-001 - Album Foto Udara DPSP Labuan Bajo', staf_id: 'STAF-002', staf_nama: 'Maria Theresia Nona, S.AP', offsetHours: -72 },
      { aksi: 'LOGIN', modul: 'Auth', detail: 'User Stefanus Rahmat berhasil login ke SIASTA', staf_id: 'STAF-003', staf_nama: 'Stefanus Rahmat, S.Sos', offsetHours: -50 },
      { aksi: 'GENERATE_BA', modul: 'Berita Acara', detail: 'Generate Berita Acara Alih Media Gabungan Semester I Tahun 2026', staf_id: 'STAF-003', staf_nama: 'Stefanus Rahmat, S.Sos', offsetHours: -48 },
      { aksi: 'GENERATE_LAPORAN', modul: 'Laporan', detail: 'Generate Laporan Eksternal Alih Media ANRI Periode 2026', staf_id: 'STAF-003', staf_nama: 'Stefanus Rahmat, S.Sos', offsetHours: -35 },
      { aksi: 'LOGIN', modul: 'Auth', detail: 'User Yohanes Don Bosco berhasil login ke SIASTA', staf_id: 'STAF-001', staf_nama: 'Yohanes Don Bosco, S.Kom', offsetHours: -24 },
      { aksi: 'INPUT_ARSIP', modul: 'Arsip', detail: 'Input arsip baru: DKP-B03-002 - Laporan Monev Alih Media ANRI', staf_id: 'STAF-001', staf_nama: 'Yohanes Don Bosco, S.Kom', offsetHours: -20 },
      { aksi: 'LOGIN', modul: 'Auth', detail: 'User Admin SIASTA berhasil login ke SIASTA', staf_id: 'STAF-004', staf_nama: 'Admin SIASTA', offsetHours: -5 },
      { aksi: 'INPUT_ARSIP', modul: 'Arsip', detail: 'Input arsip baru: UMM-B02-001 - Naskah Deklarasi Forkopimda', staf_id: 'STAF-004', staf_nama: 'Admin SIASTA', offsetHours: -2 },
      { aksi: 'VERIFIKASI', modul: 'QA Checklist', detail: 'Verifikasi QA Checklist Alih Media UMM-B02-001 dinyatakan lulus', staf_id: 'STAF-004', staf_nama: 'Admin SIASTA', offsetHours: -1 }
    ];

    var logRows = dummyLogs.map(function(l, i) {
      var logTime = new Date(now.getTime() + (l.offsetHours * 3600 * 1000));
      var logRow = {
        id: 'LOG-' + padNumber(i + 1, 4),
        timestamp: logTime,
        staf_id: l.staf_id,
        staf_nama: l.staf_nama,
        aksi: l.aksi,
        modul: l.modul,
        detail: l.detail,
        ip_address: '192.168.1.' + (10 + (i % 20))
      };
      return logHeaders.map(function(h) { return logRow[h] !== undefined ? logRow[h] : ''; });
    });

    if (logRows.length > 0) {
      logSheet.getRange(2, 1, logRows.length, logHeaders.length).setValues(logRows);
    }

    // 5. Bersihkan cache sistem agar angka dan grafik terupdate seketika
    invalidateSheetCache();
    clearCache('CACHE_DASHBOARD_STATS');
    clearCache('CACHE_KODE_ASAL');
    clearCache('CACHE_STAFF_LIST');

    return jsonResponse(true, {
      totalArsip: dummyArsipList.length,
      targetTahunan: CONFIG.TARGET.ARSIP_TAHUNAN,
      totalBA: dummyBAList.length,
      totalLog: dummyLogs.length
    }, 'Berhasil membuat ' + dummyArsipList.length + ' data arsip statis realistis, ' + dummyBAList.length + ' Berita Acara, master staf, dan ' + dummyLogs.length + ' log aktivitas!');

  } catch (e) {
    return jsonResponse(false, null, 'Gagal membuat data dummy: ' + e.message);
  }
}

/**
 * Hapus seluruh data dummy pada SIASTA, KECUALI master user (staf)
 * - master_arsip: baris data dihapus (header baris 1 dipertahankan)
 * - berita_acara: baris data dihapus (header baris 1 dipertahankan)
 * - log_aktivitas: baris data dihapus & diset 1 log inisialisasi bersih
 * - log_akses: baris data dihapus
 * - master_staf: DIPERTAHANKAN
 * - kode_asal_arsip: DIPERTAHANKAN
 * - pengaturan: DIPERTAHANKAN
 */
function clearAllDummyDataExceptUsers() {
  try {
    var clearedSheets = [];

    // 1. Bersihkan master_arsip
    var arsipSheet = getSheet(CONFIG.SHEETS.MASTER_ARSIP);
    if (arsipSheet && arsipSheet.getLastRow() > 1) {
      arsipSheet.deleteRows(2, arsipSheet.getLastRow() - 1);
      clearedSheets.push('master_arsip');
    }

    // 2. Bersihkan berita_acara
    var baSheet = getSheet(CONFIG.SHEETS.BERITA_ACARA);
    if (baSheet && baSheet.getLastRow() > 1) {
      baSheet.deleteRows(2, baSheet.getLastRow() - 1);
      clearedSheets.push('berita_acara');
    }

    // 3. Bersihkan log_aktivitas & buat 1 log inisialisasi sistem
    var logSheet = getSheet(CONFIG.SHEETS.LOG_AKTIVITAS);
    if (logSheet && logSheet.getLastRow() > 1) {
      logSheet.deleteRows(2, logSheet.getLastRow() - 1);
      clearedSheets.push('log_aktivitas');
    }

    // 4. Bersihkan log_akses
    var aksesSheet = getSheet(CONFIG.SHEETS.LOG_AKSES);
    if (aksesSheet && aksesSheet.getLastRow() > 1) {
      aksesSheet.deleteRows(2, aksesSheet.getLastRow() - 1);
      clearedSheets.push('log_akses');
    }

    // Inisialisasi 1 log pencatatan sistem baru
    logActivity('SYSTEM_RESET', 'Database', 'Pembersihan data dummy berhasil. Sistem SIASTA siap digunakan untuk pencatatan arsip riil.');

    // 5. Pastikan master_staf, kode_asal, dan pengaturan tetap terisi di sheet
    seedInitialData();

    // 6. Invalidate runtime & script cache
    invalidateSheetCache();
    clearCache('CACHE_DASHBOARD_STATS');
    clearCache('CACHE_KODE_ASAL');
    clearCache('CACHE_STAFF_LIST');

    return jsonResponse(true, {
      clearedSheets: clearedSheets,
      status: 'Clean'
    }, 'Seluruh data dummy (arsip, berita acara, log) berhasil dihapus! Data user dan master referensi tetap aman dipertahankan.');
  } catch (e) {
    return jsonResponse(false, null, 'Gagal menghapus data dummy: ' + e.message);
  }
}

/**
 * Implementasi input contoh arsip nyata yang tersimpan ke Google Drive
 * Mengunggah file dokumen alih media ke Google Drive (Pelestarian & Akses)
 * dan menerapkan 1 spesimen TTD dummy pelaksana.
 */
function inputSampleArsipToDrive(params) {
  try {
    params = params || {};
    var activeUser = params.activeUser || getCurrentUser() || {
      id: 'STAF-001',
      nama: 'Muhammad Dzaky Nathanegara, A.Md',
      jabatan: 'Pengelola Kearsipan'
    };

    var kodeAsal = params.kodeAsal || 'KOM';
    var nomorBox = params.nomorBox || '1';
    var boxFormatted = 'B' + padNumber(parseInt(nomorBox), 2);
    var kode = generateKodeUnik(kodeAsal, nomorBox);
    var kodeUnikFinal = params.kodeUnik || kode.kodeUnik;

    // Buat file dokumen alih media perdana di Google Drive
    var sampleDocText = 
      "PEMERINTAH KABUPATEN MANGGARAI BARAT\n" +
      "DINAS KEARSIPAN DAN PERPUSTAKAAN DAERAH\n" +
      "=========================================================\n" +
      "DOKUMEN HASIL ALIH MEDIA ARSIP STATIS\n" +
      "Kode Unik: " + kodeUnikFinal + "\n" +
      "Deskripsi: " + (params.deskripsi || "Keputusan Bupati Manggarai Barat tentang Penetapan Batas Wilayah Administrasi Kecamatan Komodo") + "\n" +
      "Kurun Waktu: " + (params.kurunWaktu || "2004") + "\n" +
      "Asal Arsip: " + (params.asalArsip || "Kecamatan Komodo") + "\n" +
      "Unit Pengolah: " + (params.unitPengelola || "Bagian Tata Pemerintahan Setda") + "\n" +
      "Pelaksana Alih Media: " + activeUser.nama + "\n" +
      "Tanggal Alih Media: " + formatDateIndo(new Date()) + "\n" +
      "Status Keterbukaan: Terbuka\n" +
      "=========================================================\n" +
      "[ARSIP HASIL ALIH MEDIA — DINAS KEARSIPAN DAN PERPUSTAKAAN DAERAH KABUPATEN MANGGARAI BARAT]\n";

    var docBlob = Utilities.newBlob(sampleDocText, 'text/plain', kodeUnikFinal + '_alih_media.txt');
    var base64Sample = Utilities.base64Encode(docBlob.getBytes());

    // Upload ke Google Drive via uploadArsipFile
    var fileResult = uploadArsipFile(
      base64Sample,
      kodeUnikFinal + '_alih_media.txt',
      'text/plain',
      kodeAsal,
      boxFormatted
    );

    // Apply watermark metadata
    if (fileResult.pelestarian) applyWatermark(fileResult.pelestarian.id);
    if (fileResult.akses) applyWatermark(fileResult.akses.id);

    // Simpan data ke sheet master_arsip
    var arsipData = {
      id: generateId('ARS'),
      kode_unik: kodeUnikFinal,
      status_keterbukaan: params.statusKeterbukaan || 'Terbuka',
      asal_arsip: params.asalArsip || 'Kecamatan Komodo',
      kode_asal: kodeAsal,
      nomor_box: boxFormatted,
      nomor_urut: padNumber(kode.nomorUrut, 3),
      deskripsi: params.deskripsi || 'Keputusan Bupati Manggarai Barat tentang Penetapan Batas Wilayah Administrasi Kecamatan Komodo',
      jenis_arsip: params.jenisArsip || 'Tekstual',
      kategori_urusan: params.kategoriUrusan || 'Pemerintahan',
      kode_klasifikasi_asli: params.kodeKlasifikasiAsli || '045.2',
      nomor_asli: params.nomorAsli || '180/HK/2004',
      jumlah_lembar: parseInt(params.jumlahLembar) || 16,
      jumlah_berkas: parseInt(params.jumlahBerkas) || 1,
      rangkap_ke: 1,
      kondisi_fisik: 'Baik',
      kurun_waktu_mulai: params.kurunWaktu || '2004',
      kurun_waktu_akhir: '',
      unit_pengelola: params.unitPengelola || 'Bagian Tata Pemerintahan Setda',
      lokasi_simpan: 'Depot Arsip A, Rak B-01, Box 1',
      keterangan: 'File digital tersimpan aman di Google Drive folder Pelestarian & Akses.',
      file_pelestarian_id: fileResult.pelestarian ? fileResult.pelestarian.id : '',
      file_akses_id: fileResult.akses ? fileResult.akses.id : '',
      file_pelestarian_url: fileResult.pelestarian ? fileResult.pelestarian.viewUrl : '',
      file_akses_url: fileResult.akses ? fileResult.akses.viewUrl : '',
      waktu_unggah: new Date().toISOString(),
      qa_checklist: JSON.stringify([
        { item: 'Resolusi sesuai standar (min. 300dpi)', checked: true },
        { item: 'Format file sesuai standar ANRI', checked: true },
        { item: 'Seluruh fisik arsip tercakup lengkap', checked: true },
        { item: 'Hasil alih media terbaca jelas', checked: true }
      ]),
      watermark_applied: 'Ya',
      staf_id: activeUser.id || 'STAF-001',
      staf_nama: activeUser.nama || 'Muhammad Dzaky Nathanegara, A.Md',
      tanggal_input: new Date(),
      tanggal_update: new Date(),
      status: 'Aktif'
    };

    appendData(CONFIG.SHEETS.MASTER_ARSIP, arsipData);
    logActivity('INPUT_ARSIP', 'Arsip', 'Input arsip riil via Google Drive: ' + kodeUnikFinal);
    clearCache('CACHE_DASHBOARD_STATS');

    return jsonResponse(true, {
      arsip: arsipData,
      driveFiles: fileResult
    }, 'Arsip ' + kodeUnikFinal + ' berhasil diinput dan berkas tersimpan langsung di Google Drive!');
  } catch (e) {
    return jsonResponse(false, null, 'Gagal input arsip ke Drive: ' + e.message);
  }
}

