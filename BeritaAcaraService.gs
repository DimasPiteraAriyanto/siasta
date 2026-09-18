/**
 * =========================================
 * SIASTA - BeritaAcaraService.gs
 * Berita Acara Generation
 * =========================================
 */

/**
 * Get data untuk dashboard berita acara
 */
function getBeritaAcaraDashboard() {
  try {
    var allBA = readAllData(CONFIG.SHEETS.BERITA_ACARA);
    var allArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP);
    
    allArsip = allArsip || [];
    allBA = allBA || [];
    
    var allStaf = readAllData(CONFIG.SHEETS.MASTER_STAF).filter(function(s) { return s.status === 'Aktif'; });
    
    var now = new Date();
    var currentYear = (CONFIG.APP && CONFIG.APP.TAHUN) ? parseInt(CONFIG.APP.TAHUN) : now.getFullYear();
    
    // Summary per bulan
    var monthlyData = [];
    for (var m = 0; m < 12; m++) {
      var arsipBulan = allArsip.filter(function(a) {
        var d = a.tanggal_input ? new Date(a.tanggal_input) : null;
        return d && !isNaN(d.getTime()) && d.getMonth() === m && d.getFullYear() === currentYear && a.status !== 'Dihapus';
      });
      
      var baExists = allBA.filter(function(ba) {
        return parseInt(ba.bulan) === m && parseInt(ba.tahun) === currentYear;
      });
      
      // Get unique staf yang input di bulan itu
      var stafSet = {};
      arsipBulan.forEach(function(a) { stafSet[a.staf_nama] = true; });
      
      monthlyData.push({
        bulan: m,
        namaBulan: getNamaBulan(m),
        jumlahArsip: arsipBulan.length,
        jumlahStaf: Object.keys(stafSet).length,
        stafList: Object.keys(stafSet),
        statusBA: baExists.length > 0 ? 'Sudah Dibuat' : (arsipBulan.length > 0 ? 'Belum Dibuat' : '-'),
        baList: baExists
      });
    }

    // Riwayat Dokumen BA Terbit
    var historyBA = allBA.map(function(ba) {
      var d = ba.tanggal_dibuat ? parseDate(ba.tanggal_dibuat) : null;
      var bln = parseInt(ba.bulan);
      var thn = parseInt(ba.tahun) || currentYear;
      return {
        id: ba.id,
        nomorBA: ba.nomor_ba || '-',
        bulan: bln,
        tahun: thn,
        periode: getNamaBulan(bln) + ' ' + thn,
        tipe: ba.tipe,
        tipeLabel: ba.tipe === 'per_staf' ? 'Per Staf' : 'Gabungan',
        stafId: ba.staf_id,
        stafNama: ba.staf_nama,
        jumlahArsip: parseInt(ba.jumlah_arsip) || 0,
        status: ba.status || 'Final',
        tanggalDibuatFormatted: d ? formatDateIndo(d) : '-'
      };
    });
    historyBA.reverse();

    var totalBAStaf = 0;
    var totalBAGabungan = 0;
    var totalArsipTeralih = 0;
    allBA.forEach(function(ba) {
      if (ba.tipe === 'per_staf') totalBAStaf++;
      else totalBAGabungan++;
      totalArsipTeralih += (parseInt(ba.jumlah_arsip) || 0);
    });

    return jsonResponse(true, {
      monthlyData: monthlyData,
      historyBA: historyBA,
      stats: {
        totalBA: allBA.length,
        totalBAStaf: totalBAStaf,
        totalBAGabungan: totalBAGabungan,
        totalArsipTeralih: totalArsipTeralih
      },
      tahun: currentYear,
      totalStaf: allStaf.length
    });
    
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Get data berita acara per staf
 * @param {number} bulan - Index bulan (0-11)
 * @param {number} tahun
 * @param {string} stafId
 */
function getBeritaAcaraPerStaf(bulan, tahun, stafId) {
  try {
    var allArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP);
    
    var arsipStaf = allArsip.filter(function(a) {
      var d = a.tanggal_input ? new Date(a.tanggal_input) : null;
      return d && !isNaN(d.getTime()) &&
             d.getMonth() === parseInt(bulan) &&
             d.getFullYear() === parseInt(tahun) &&
             a.staf_id === stafId &&
             a.status !== 'Dihapus';
    });
    
    var staf = findOneByColumn(CONFIG.SHEETS.MASTER_STAF, 'id', stafId);
    
    // Group by jenis arsip
    var jenisCount = {};
    arsipStaf.forEach(function(a) {
      if (!jenisCount[a.jenis_arsip]) jenisCount[a.jenis_arsip] = 0;
      jenisCount[a.jenis_arsip]++;
    });
    
    return jsonResponse(true, {
      staf: staf,
      arsipList: arsipStaf,
      jumlahArsip: arsipStaf.length,
      jenisBreakdown: jenisCount,
      bulan: parseInt(bulan),
      tahun: parseInt(tahun),
      namaBulan: getNamaBulan(parseInt(bulan)),
      periode: getNamaBulan(parseInt(bulan)) + ' ' + tahun
    });
    
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Get data berita acara gabungan (seluruh staf)
 * @param {number} bulan
 * @param {number} tahun
 */
function getBeritaAcaraGabungan(bulan, tahun) {
  try {
    var allArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP);
    var allStaf = readAllData(CONFIG.SHEETS.MASTER_STAF);
    
    var arsipBulan = allArsip.filter(function(a) {
      var d = a.tanggal_input ? new Date(a.tanggal_input) : null;
      return d && !isNaN(d.getTime()) &&
             d.getMonth() === parseInt(bulan) &&
             d.getFullYear() === parseInt(tahun) &&
             a.status !== 'Dihapus';
    });
    
    // Breakdown per staf
    var perStaf = {};
    arsipBulan.forEach(function(a) {
      if (!perStaf[a.staf_id]) {
        var stafData = allStaf.find(function(s) { return s.id === a.staf_id; });
        perStaf[a.staf_id] = {
          stafId: a.staf_id,
          stafNama: a.staf_nama,
          stafNip: stafData ? stafData.nip : '-',
          stafJabatan: stafData ? stafData.jabatan : '-',
          jumlah: 0,
          arsipList: []
        };
      }
      perStaf[a.staf_id].jumlah++;
      perStaf[a.staf_id].arsipList.push(a);
    });
    
    return jsonResponse(true, {
      perStaf: Object.values(perStaf),
      totalArsip: arsipBulan.length,
      totalStaf: Object.keys(perStaf).length,
      bulan: parseInt(bulan),
      tahun: parseInt(tahun),
      namaBulan: getNamaBulan(parseInt(bulan)),
      periode: getNamaBulan(parseInt(bulan)) + ' ' + tahun
    });
    
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Generate dan simpan berita acara
 */
function generateBeritaAcara(data) {
  try {
    var user = getCurrentUser() || (data && data.activeUser ? data.activeUser : null) || { id: 'STAF-001', nama: 'Siprianus Mbemba', jabatan: 'Arsiparis Ahli Pertama' };
    
    var baData = {
      id: generateId('BA'),
      bulan: data.bulan,
      tahun: data.tahun,
      tipe: data.tipe, // 'per_staf' atau 'gabungan'
      staf_id: data.stafId || 'ALL',
      staf_nama: data.stafNama || 'Seluruh Staf',
      jumlah_arsip: data.jumlahArsip || 0,
      waktu_pelaksanaan: data.waktuPelaksanaan || getNamaBulan(parseInt(data.bulan)) + ' ' + data.tahun,
      tempat_pelaksanaan: data.tempatPelaksanaan || 'Dinas Kearsipan dan Perpustakaan Daerah Kab. Manggarai Barat',
      jenis_media: data.jenisMedia || 'Arsip Statis',
      file_id: '',
      file_url: '',
      status: 'Draft',
      tanggal_dibuat: new Date()
    };
    
    appendData(CONFIG.SHEETS.BERITA_ACARA, baData);
    
    logActivity('GENERATE_BA', 'BeritaAcara',
      'Generate BA ' + data.tipe + ': ' + getNamaBulan(parseInt(data.bulan)) + ' ' + data.tahun);
    
    return jsonResponse(true, { id: baData.id }, 'Berita acara berhasil dibuat.');
    
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Ambil data detail formal Berita Acara siap cetak sesuai format resmi Kab. Manggarai Barat
 * @param {Object} params - { baId, bulan, tahun, stafId, tipe }
 */
function getBeritaAcaraFormalDetail(params) {
  try {
    params = params || {};
    var allArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP);
    var allStaf = readAllData(CONFIG.SHEETS.MASTER_STAF);
    var allBA = readAllData(CONFIG.SHEETS.BERITA_ACARA);
    
    var baRecord = null;
    if (params.baId) {
      baRecord = allBA.find(function(b) { return b.id === params.baId; });
      if (baRecord) {
        params.bulan = baRecord.bulan;
        params.tahun = baRecord.tahun;
        params.tipe = baRecord.tipe;
        params.stafId = baRecord.staf_id;
      }
    }
    
    var bln = parseInt(params.bulan !== undefined ? params.bulan : new Date().getMonth());
    var thn = parseInt(params.tahun || (CONFIG.APP ? CONFIG.APP.TAHUN : 2026));
    var tipe = params.tipe || 'gabungan';
    var stafId = params.stafId || '';
    
    // Filter arsip untuk BA ini
    var filteredArsip = allArsip.filter(function(a) {
      if (a.status === 'Dihapus') return false;
      var d = a.tanggal_input ? parseDate(a.tanggal_input) : null;
      if (!d || isNaN(d.getTime())) return false;
      if (d.getMonth() !== bln || d.getFullYear() !== thn) return false;
      if (tipe === 'per_staf' && stafId && stafId !== 'ALL' && a.staf_id !== stafId) return false;
      return true;
    });
    
    filteredArsip.sort(function(a, b) {
      return (a.kode_unik || '').localeCompare(b.kode_unik || '');
    });
    
    // Asal arsip unik & kurun waktu
    var asalSet = {};
    var boxSet = {};
    var minTahun = 9999;
    var maxTahun = 0;
    var totalLembar = 0;
    
    filteredArsip.forEach(function(a) {
      if (a.asal_arsip) asalSet[a.asal_arsip] = true;
      if (a.nomor_box) boxSet[a.nomor_box] = true;
      totalLembar += (parseInt(a.jumlah_lembar) || 1);
      
      var thnArsip = parseInt(a.kurun_waktu_mulai);
      if (thnArsip && thnArsip < minTahun) minTahun = thnArsip;
      if (thnArsip && thnArsip > maxTahun) maxTahun = thnArsip;
    });
    
    var asalSummary = Object.keys(asalSet).join(', ') || 'Pemerintah Daerah Kabupaten Manggarai Barat';
    var boxSummary = Object.keys(boxSet).join(', ') || 'Box Terpilih';
    var kurunWaktuSummary = (minTahun !== 9999 && maxTahun !== 0) ? (minTahun === maxTahun ? minTahun.toString() : minTahun + '-' + maxTahun) : '1983-2000';
    
    // Staf pelaksana
    var pelaksana = null;
    if (tipe === 'per_staf' && stafId && stafId !== 'ALL') {
      pelaksana = allStaf.find(function(s) { return s.id === stafId; });
    }
    if (!pelaksana) {
      pelaksana = {
        nama: (baRecord && baRecord.staf_nama && baRecord.staf_nama !== 'Seluruh Staf') ? baRecord.staf_nama : 'Muhammad Dzaky N修正egan A.Md',
        nip: (baRecord && baRecord.staf_nip) ? baRecord.staf_nip : '19980508 202506 1 004',
        jabatan: 'Pelaksana Alih Media'
      };
      // Jika nama sampel typo, pakai nama resmi staf yang ada atau default yang rapi
      if (pelaksana.nama.indexOf('N修正egan') !== -1) {
        pelaksana.nama = 'Muhammad Dzaky Nathanegara, A.Md';
      }
    }
    
    // Tanggal formal pelaksanaan
    var tglPelaksanaan = new Date(thn, bln, 18);
    var blnIndex = (bln !== undefined && !isNaN(bln)) ? bln : 5;
    var blnAngka = blnIndex + 1;
    var tglAngka = tglPelaksanaan.getDate();
    var blnStr = (blnAngka < 10 ? '0' : '') + blnAngka;
    var tglStr = (tglAngka < 10 ? '0' : '') + tglAngka;
    var tglTerbilang = angkaTerbilang(tglAngka);
    var thnTerbilang = angkaTerbilang(thn);
    var jumlahArsip = filteredArsip.length;
    var jumlahArsipTerbilang = angkaTerbilang(jumlahArsip);
    
    var dataFormal = {
      baId: baRecord ? baRecord.id : '',
      nomorBA: (baRecord && baRecord.nomor_ba) ? baRecord.nomor_ba : '....................................................',
      hariNama: namaHari,
      tanggalAngka: tglAngka,
      tanggalTerbilang: tglTerbilang,
      bulan: blnIndex,
      bulanAngka: blnAngka,
      bulanNama: getNamaBulan(blnIndex),
      tahun: thn,
      tahunAngka: thn,
      tahunTerbilang: thnTerbilang,
      tanggalAngkaLengkap: tglStr + '-' + blnStr + '-' + thn,
      tanggalPelaksanaanFormatted: namaHari + ', ' + tglAngka + ' ' + getNamaBulan(blnIndex) + ' ' + thn,
      jenisKegiatan: 'Alih Media Arsip dari media kertas (fisik) ke media digital (softcopy/PDF)',
      jenisArsip: 'Arsip Statis berupa berkas administrasi pemerintahan (antara lain berkas administrasi, keputusan, dan laporan terkait) periode tahun ' + kurunWaktuSummary + ', sebagaimana rincian pada Daftar Arsip Hasil Alih Media Tahun ' + thn + ' terlampir',
      jumlahArsip: jumlahArsip,
      jumlahArsipTerbilang: jumlahArsipTerbilang,
      totalLembar: totalLembar,
      asalArsip: boxSummary + ' ' + asalSummary,
      dasarPelaksanaan: (CONFIG.TEMPLATE_BA && CONFIG.TEMPLATE_BA.DASAR_HUKUM) ? CONFIG.TEMPLATE_BA.DASAR_HUKUM : 'Peraturan Bupati Manggarai Barat Nomor 31 Tahun 2024 tentang Pedoman Alih Media Arsip di Lingkungan Pemerintah Daerah Kabupaten Manggarai Barat',
      tempatPelaksanaan: (CONFIG.TEMPLATE_BA && CONFIG.TEMPLATE_BA.TEMPAT) ? CONFIG.TEMPLATE_BA.TEMPAT : 'Dinas Kearsipan dan Perpustakaan Kabupaten Manggarai Barat',
      kota: (CONFIG.TEMPLATE_BA && CONFIG.TEMPLATE_BA.KOTA) ? CONFIG.TEMPLATE_BA.KOTA : 'Labuan Bajo',
      kadis: (CONFIG.PEJABAT && CONFIG.PEJABAT.KADIS) ? CONFIG.PEJABAT.KADIS : {
        NAMA: 'Augustinus Rinus, S.Pd',
        PANGKAT: 'Pembina Utama Muda',
        NIP: '19720219 199903 1 008',
        JABATAN: 'Kepala Dinas Kearsipan dan Perpustakaan Kabupaten Manggarai Barat'
      },
      kabid: (CONFIG.PEJABAT && CONFIG.PEJABAT.KABID) ? CONFIG.PEJABAT.KABID : {
        NAMA: 'Stefanus Rahmat, S.Sos',
        PANGKAT: 'Pembina / IV a',
        NIP: '19850215 201001 1 018',
        JABATAN: 'Kepala Bidang Layanan, Alih Media dan Perlindungan Arsip'
      },
      alamatKop: (CONFIG.PEJABAT && CONFIG.PEJABAT.ALAMAT_KOP) ? CONFIG.PEJABAT.ALAMAT_KOP : 'Jl. Samping Bank NTT, Kelurahan Wae Kelambu, Labuan Bajo - Flores - NTT',
      pelaksana: pelaksana,
      pelaksanaTtd: (CONFIG.PEJABAT && CONFIG.PEJABAT.PELAKSANA && CONFIG.PEJABAT.PELAKSANA.TTD) ? CONFIG.PEJABAT.PELAKSANA.TTD : (CONFIG.PEJABAT ? CONFIG.PEJABAT.DUMMY_TTD : ''),
      tipe: tipe,
      tipeLabel: tipe === 'per_staf' ? 'Per Staf (' + pelaksana.nama + ')' : 'Gabungan (Seluruh Tim Alih Media)',
      arsipList: filteredArsip
    };
    
    return jsonResponse(true, dataFormal);
  } catch (e) {
    return jsonResponse(false, null, 'Error getBeritaAcaraFormalDetail: ' + e.message);
  }
}

/**
 * Hapus berita acara
 */
function deleteBeritaAcara(baId) {
  try {
    var allBA = readAllData(CONFIG.SHEETS.BERITA_ACARA);
    var target = allBA.find(function(b) { return b.id === baId; });
    if (!target) {
      return jsonResponse(false, null, 'Berita acara tidak ditemukan.');
    }
    
    var sheet = getSheet(CONFIG.SHEETS.BERITA_ACARA);
    var rowIndex = target._rowIndex;
    if (rowIndex && rowIndex > 1) {
      sheet.deleteRow(rowIndex);
      invalidateSheetCache(CONFIG.SHEETS.BERITA_ACARA);
      logActivity('DELETE_BA', 'BeritaAcara', 'Menghapus Berita Acara: ' + baId);
      return jsonResponse(true, null, 'Berita acara berhasil dihapus.');
    }
    return jsonResponse(false, null, 'Baris data tidak ditemukan.');
  } catch (e) {
    return jsonResponse(false, null, 'Error deleteBeritaAcara: ' + e.message);
  }
}

/**
 * Export Berita Acara ke Google Docs (DocumentApp)
 * @param {Object} payload
 * @returns {Object} jsonResponse with doc URL
 */
function exportBAToGoogleDoc(payload) {
  try {
    if (!payload) return jsonResponse(false, null, 'Payload Berita Acara kosong.');
    
    var docName = 'Berita Acara Alih Media - ' + (payload.nomorBA ? payload.nomorBA.replace(/[/\\?%*:|"<>]/g, '_') : ('Tahun_' + (payload.tahunAngka || 2026)));
    var doc = DocumentApp.create(docName);
    var body = doc.getBody();
    
    // Page setup (A4 Portrait, margin)
    body.setPageWidth(595.28);
    body.setPageHeight(841.89);
    body.setMarginTop(54);
    body.setMarginBottom(54);
    body.setMarginLeft(54);
    body.setMarginRight(54);
    
    // 1. Kop Surat
    var p1 = body.appendParagraph('PEMERINTAH KABUPATEN MANGGARAI BARAT');
    p1.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p1.setFontFamily('Times New Roman').setFontSize(13).setBold(true);
    
    var p2 = body.appendParagraph('DINAS KEARSIPAN DAN PERPUSTAKAAN');
    p2.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p2.setFontFamily('Times New Roman').setFontSize(15).setBold(true);
    
    var p3 = body.appendParagraph(payload.alamatKop || 'Jl. Samping Bank NTT, Kelurahan Wae Kelambu, Labuan Bajo - Flores - NTT');
    p3.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p3.setFontFamily('Times New Roman').setFontSize(9.5).setItalic(true);
    
    var pDivider = body.appendParagraph('____________________________________________________________________');
    pDivider.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pDivider.setFontFamily('Times New Roman').setFontSize(10).setBold(true);
    
    body.appendParagraph('');
    
    // 2. Judul
    var pJudul = body.appendParagraph('BERITA ACARA ALIH MEDIA ARSIP');
    pJudul.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pJudul.setFontFamily('Times New Roman').setFontSize(13).setBold(true).setUnderline(true);
    
    var pNomor = body.appendParagraph('Nomor: ' + (payload.nomorBA || '....................................................'));
    pNomor.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pNomor.setFontFamily('Times New Roman').setFontSize(11);
    
    body.appendParagraph('');
    
    // 3. Paragraf Pembuka
    var pBuka = body.appendParagraph(
      'Pada hari ini, ' + (payload.hariNama || 'Kamis') + ', tanggal ' + (payload.tanggalTerbilang || 'delapan belas') + 
      ' bulan ' + (payload.bulanNama || 'Desember') + ' tahun ' + (payload.tahunTerbilang || 'dua ribu dua puluh lima') + 
      ' (' + (payload.tanggalAngkaLengkap || '18-12-2025') + '), bertempat di Dinas Kearsipan dan Perpustakaan Kabupaten Manggarai Barat, ' +
      'kami yang bertanda tangan di bawah ini telah melaksanakan kegiatan alih media arsip dengan keterangan sebagai berikut:'
    );
    pBuka.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pBuka.setFontFamily('Times New Roman').setFontSize(11.5).setLineSpacing(1.3);
    
    // 4. Tabel Rincian
    var tableData = [
      ['Jenis Kegiatan', ':', 'Alih Media Arsip dari media kertas (fisik) ke media digital (softcopy/PDF)'],
      ['Jenis Arsip', ':', payload.jenisArsip || 'Arsip Statis berupa berkas administrasi pemerintahan periode tahun 1983-2000'],
      ['Jumlah Arsip', ':', (payload.jumlahArsip || '0') + ' (' + (payload.jumlahArsipTerbilang || 'nol') + ') item arsip'],
      ['Asal Arsip', ':', payload.asalArsip || 'Box 5 Kecamatan Komodo'],
      ['Dasar Pelaksanaan', ':', payload.dasarPelaksanaan || 'Peraturan Bupati Manggarai Barat Nomor 31 Tahun 2024 tentang Pedoman Alih Media Arsip di Lingkungan Pemerintah Daerah Kabupaten Manggarai Barat']
    ];
    
    var table = body.appendTable(tableData);
    table.setBorderWidth(0);
    for (var r = 0; r < tableData.length; r++) {
      var row = table.getRow(r);
      row.getCell(0).setWidth(130).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(11);
      row.getCell(1).setWidth(15).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(11);
      row.getCell(2).setWidth(340).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(11);
    }
    
    body.appendParagraph('');
    
    // 5. Klausul Penutup
    var pTutup = body.appendParagraph(
      'Demikian Berita Acara Alih Media Arsip ini dibuat dengan sesungguhnya rangkap 2 (dua) untuk dipergunakan sebagaimana mestinya dan memiliki kekuatan hukum yang sah sesuai ketentuan Undang-Undang Nomor 43 Tahun 2009 tentang Kearsipan serta Peraturan Kepala Arsip Nasional Republik Indonesia Nomor 9 Tahun 2018 tentang Pedoman Pemeliharaan Arsip Dinamis.'
    );
    pTutup.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pTutup.setFontFamily('Times New Roman').setFontSize(11.5).setLineSpacing(1.3);
    
    body.appendParagraph('');
    
    // 6. Tanda Tangan (2 Kolom Tabel Tanpa Border)
    var useKadis = payload.useKadis !== false;
    var usePelaksana = payload.usePelaksana !== false;
    
    if (useKadis || usePelaksana) {
      var ttdTable = body.appendTable();
      ttdTable.setBorderWidth(0);
      var ttdRow = ttdTable.appendTableRow();
      
      // Kolom Kadis (Kiri)
      var cellKadis = ttdRow.appendTableCell();
      cellKadis.setWidth(240);
      if (useKadis) {
        var pK1 = cellKadis.getChild(0).asParagraph();
        pK1.setText('Mengetahui,').setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11);
        var pK2 = cellKadis.appendParagraph('Kepala Dinas Kearsipan dan Perpustakaan\nKabupaten Manggarai Barat');
        pK2.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11).setBold(true);
        cellKadis.appendParagraph('\n\n\n');
        var pK3 = cellKadis.appendParagraph(payload.kadis ? (payload.kadis.NAMA || 'AUGUSTINUS RINUS, S.Pd') : 'AUGUSTINUS RINUS, S.Pd');
        pK3.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11).setBold(true).setUnderline(true);
        var pK4 = cellKadis.appendParagraph(payload.kadis ? (payload.kadis.PANGKAT || 'Pembina Utama Muda') : 'Pembina Utama Muda');
        pK4.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5);
        var pK5 = cellKadis.appendParagraph('NIP. ' + (payload.kadis ? (payload.kadis.NIP || '19720219 199903 1 008') : '19720219 199903 1 008'));
        pK5.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5);
      } else {
        cellKadis.getChild(0).asParagraph().setText('');
      }
      
      // Kolom Pelaksana (Kanan)
      var cellPelaksana = ttdRow.appendTableCell();
      cellPelaksana.setWidth(245);
      if (usePelaksana) {
        var tglSurat = 'Labuan Bajo, ' + (payload.tanggalAngka || '18') + ' ' + (payload.bulanNama || 'Desember') + ' ' + (payload.tahunAngka || '2025');
        var pP1 = cellPelaksana.getChild(0).asParagraph();
        pP1.setText(tglSurat).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11);
        var pP2 = cellPelaksana.appendParagraph((payload.tipe === 'gabungan' ? 'Koordinator Pelaksana Alih Media,' : 'Pelaksana Alih Media,'));
        pP2.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11).setBold(true);
        cellPelaksana.appendParagraph('\n\n\n');
        var pP3 = cellPelaksana.appendParagraph(payload.pelaksana ? (payload.pelaksana.nama || 'MUHAMMAD DZAKY NATHANEGARA, A.Md') : 'MUHAMMAD DZAKY NATHANEGARA, A.Md');
        pP3.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11).setBold(true).setUnderline(true);
        var pP4 = cellPelaksana.appendParagraph(payload.pelaksana ? (payload.pelaksana.jabatan || 'Pengelola Kearsipan') : 'Pengelola Kearsipan');
        pP4.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5);
        var pP5 = cellPelaksana.appendParagraph('NIP. ' + (payload.pelaksana ? (payload.pelaksana.nip || '19980508 202506 1 004') : '19980508 202506 1 004'));
        pP5.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5);
      } else {
        cellPelaksana.getChild(0).asParagraph().setText('');
      }
    }
    
    doc.saveAndClose();
    
    // Pindahkan ke folder Berita Acara di Google Drive
    var file = DriveApp.getFileById(doc.getId());
    var targetFolder = getFolderByPath(CONFIG.DRIVE_FOLDERS.BERITA_ACARA);
    if (targetFolder) {
      targetFolder.addFile(file);
      try {
        DriveApp.getRootFolder().removeFile(file);
      } catch (eRemove) {}
    }
    
    logActivity('EXPORT_BA_GDOC', 'BeritaAcara', 'Export Berita Acara ke Google Docs: ' + docName);
    
    return jsonResponse(true, {
      id: doc.getId(),
      url: doc.getUrl(),
      name: docName
    }, 'Dokumen Google Docs Berita Acara berhasil dibuat.');
  } catch (e) {
    Logger.log('exportBAToGoogleDoc error: ' + e.message);
    return jsonResponse(false, null, 'Gagal membuat Google Docs: ' + e.message);
  }
}
