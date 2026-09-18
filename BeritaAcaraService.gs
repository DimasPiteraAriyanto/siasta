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
