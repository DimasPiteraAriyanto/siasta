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
    data = data || {};
    var bulanInt = parseInt(data.bulan);
    if (isNaN(bulanInt) || bulanInt < 0 || bulanInt > 11) {
      bulanInt = new Date().getMonth();
    }
    var tahunInt = parseInt(data.tahun) || new Date().getFullYear();
    var tipe = data.tipe === 'per_staf' ? 'per_staf' : 'gabungan';

    // Resolusi staf pelaksana
    var stafIdFinal = (data.stafId && data.stafId !== 'ALL') ? data.stafId : (tipe === 'per_staf' ? 'STAF-005' : 'ALL');
    var stafNamaFinal = data.stafNama || (tipe === 'per_staf' ? 'Muhammad Dzaky Nathanegara, A.Md' : 'Seluruh Staf Tim Alih Media');
    
    // Jika tipe per_staf dan nama belum lengkap atau masih ALL, coba ambil dari master_staf
    if (tipe === 'per_staf' && stafIdFinal !== 'ALL') {
      try {
        var stafRecord = findOneByColumn(CONFIG.SHEETS.MASTER_STAF, 'id', stafIdFinal);
        if (stafRecord && stafRecord.nama) {
          stafNamaFinal = stafRecord.nama;
        }
      } catch (errStaf) {}
    }

    // Hitung jumlah arsip riil jika belum disediakan atau 0
    var jumlahArsipFinal = parseInt(data.jumlahArsip) || 0;
    if (jumlahArsipFinal <= 0) {
      try {
        var allArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP) || [];
        var matchingArsip = allArsip.filter(function(a) {
          var d = a.tanggal_input ? new Date(a.tanggal_input) : null;
          if (!d || isNaN(d.getTime())) return false;
          if (a.status === 'Dihapus') return false;
          var matchDate = d.getMonth() === bulanInt && d.getFullYear() === tahunInt;
          if (!matchDate) return false;
          if (tipe === 'per_staf' && stafIdFinal !== 'ALL') {
            return a.staf_id === stafIdFinal;
          }
          return true;
        });
        jumlahArsipFinal = matchingArsip.length;
      } catch (errCount) {}
    }

    // Hitung nomor urut BA dalam tahun berjalan
    var allBA = readAllData(CONFIG.SHEETS.BERITA_ACARA) || [];
    var urut = allBA.length + 1;
    var urutPadded = padNumber(urut, 2);
    var romawiBulan = getBulanRomawi(bulanInt);
    var generatedNomorBA = data.nomorBA || ('000.4.1/DAP/BA-AM/' + urutPadded + '/' + romawiBulan + '/' + tahunInt);

    var user = (data && data.activeUser) ? data.activeUser : (getCurrentUser() || { id: stafIdFinal, nama: stafNamaFinal });

    var baData = {
      id: generateId('BA'),
      nomor_ba: generatedNomorBA,
      bulan: bulanInt,
      tahun: tahunInt,
      tipe: tipe,
      staf_id: stafIdFinal,
      staf_nama: stafNamaFinal,
      jumlah_arsip: jumlahArsipFinal,
      waktu_pelaksanaan: data.waktuPelaksanaan || (getNamaBulan(bulanInt) + ' ' + tahunInt),
      tempat_pelaksanaan: data.tempatPelaksanaan || 'Dinas Kearsipan dan Perpustakaan Daerah Kab. Manggarai Barat',
      jenis_media: data.jenisMedia || 'Arsip Statis',
      file_id: '',
      file_url: '',
      status: 'Final',
      tanggal_dibuat: new Date()
    };
    
    appendData(CONFIG.SHEETS.BERITA_ACARA, baData);
    
    logActivity('GENERATE_BA', 'BeritaAcara',
      'Generate BA ' + tipe + ' ' + generatedNomorBA + ' (' + getNamaBulan(bulanInt) + ' ' + tahunInt + ' - ' + jumlahArsipFinal + ' arsip)', user);
    
    return jsonResponse(true, {
      id: baData.id,
      nomorBA: generatedNomorBA
    }, 'Berita Acara ' + generatedNomorBA + ' berhasil diterbitkan.');
    
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
        nama: (baRecord && baRecord.staf_nama && baRecord.staf_nama !== 'Seluruh Staf') ? baRecord.staf_nama : 'Muhammad Dzaky Nathanegara, A.Md',
        nip: (baRecord && baRecord.staf_nip) ? baRecord.staf_nip : '19980508 202506 1 004',
        jabatan: 'Pelaksana Alih Media',
        tanda_tangan_url: ''
      };
      // Jika staf nama cocok di master_staf, ambil tanda tangannya
      try {
        var matchStaf = allStaf.find(function(s) { return s.nama === pelaksana.nama || s.id === (baRecord && baRecord.staf_id); });
        if (matchStaf) {
          if (matchStaf.tanda_tangan_url) pelaksana.tanda_tangan_url = matchStaf.tanda_tangan_url;
          if (matchStaf.nip) pelaksana.nip = matchStaf.nip;
        }
      } catch (eMatch) {}
    }
    
    // Tanggal formal pelaksanaan
    var tglPelaksanaan = null;
    if (baRecord && baRecord.tanggal_dibuat) {
      tglPelaksanaan = parseDate(baRecord.tanggal_dibuat);
    }
    if (!tglPelaksanaan || isNaN(tglPelaksanaan.getTime())) {
      tglPelaksanaan = new Date(thn, bln, 18);
    }

    var daftarNamaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    var namaHari = daftarNamaHari[tglPelaksanaan.getDay()] || 'Kamis';

    var blnIndex = (bln !== undefined && !isNaN(bln)) ? bln : tglPelaksanaan.getMonth();
    var blnAngka = blnIndex + 1;
    var tglAngka = tglPelaksanaan.getDate();
    var blnStr = (blnAngka < 10 ? '0' : '') + blnAngka;
    var tglStr = (tglAngka < 10 ? '0' : '') + tglAngka;
    var tglTerbilang = angkaTerbilang(tglAngka);
    var thnTerbilang = angkaTerbilang(thn);
    var jumlahArsip = filteredArsip.length;
    var jumlahArsipTerbilang = angkaTerbilang(jumlahArsip);
    
    var mappedArsipList = filteredArsip.map(function(a, idx) {
      var kurunWaktu = a.kurun_waktu || '';
      if (!kurunWaktu && a.kurun_waktu_mulai) {
        kurunWaktu = a.kurun_waktu_akhir ? (a.kurun_waktu_mulai + ' - ' + a.kurun_waktu_akhir) : a.kurun_waktu_mulai;
      }
      return {
        no: idx + 1,
        kode_unik: a.kode_unik || '-',
        jenis_arsip: a.jenis_arsip || 'Arsip Statis Terbuka',
        uraian: a.deskripsi || a.uraian || a.judul || 'Berkas Arsip Alih Media',
        kurun_waktu: kurunWaktu || '-',
        jumlah_lembar: parseInt(a.jumlah_lembar) || 1
      };
    });

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
      tanggalSurat: tglAngka + ' ' + getNamaBulan(blnIndex) + ' ' + thn,
      tanggalPelaksanaanFormatted: namaHari + ', ' + tglAngka + ' ' + getNamaBulan(blnIndex) + ' ' + thn,
      jenisKegiatan: 'Alih Media Arsip dari media kertas (fisik) ke media digital (softcopy/PDF)',
      periodePelaksanaan: 'Bulan ' + getNamaBulan(blnIndex) + ' ' + thn,
      jenisArsip: 'Arsip Statis Terbuka',
      jumlahBerkas: jumlahArsip,
      jumlahArsip: jumlahArsip,
      jumlahArsipTerbilang: jumlahArsipTerbilang,
      jumlahLembar: totalLembar,
      totalLembar: totalLembar,
      namaPetugas: pelaksana.nama,
      nipPetugas: pelaksana.nip,
      lokasiSimpan: (boxSummary ? (boxSummary + ', ') : '') + 'Depo Arsip DKP Kab. Manggarai Barat',
      asalArsip: boxSummary + ' ' + asalSummary,
      dasarPelaksanaan: (CONFIG.TEMPLATE_BA && CONFIG.TEMPLATE_BA.DASAR_HUKUM) ? CONFIG.TEMPLATE_BA.DASAR_HUKUM : 'Peraturan Bupati Manggarai Barat Nomor 31 Tahun 2024 tentang Pedoman Alih Media Arsip di Lingkungan Pemerintah Daerah Kabupaten Manggarai Barat',
      tempatPelaksanaan: (CONFIG.TEMPLATE_BA && CONFIG.TEMPLATE_BA.TEMPAT) ? CONFIG.TEMPLATE_BA.TEMPAT : 'Dinas Kearsipan dan Perpustakaan Daerah Kabupaten Manggarai Barat',
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
      pelaksanaTtd: (pelaksana && pelaksana.tanda_tangan_url) ? pelaksana.tanda_tangan_url : ((CONFIG.PEJABAT && CONFIG.PEJABAT.PELAKSANA && CONFIG.PEJABAT.PELAKSANA.TTD) ? CONFIG.PEJABAT.PELAKSANA.TTD : (CONFIG.PEJABAT ? CONFIG.PEJABAT.DUMMY_TTD : '')),
      tipe: tipe,
      tipeLabel: tipe === 'per_staf' ? 'Per Staf (' + pelaksana.nama + ')' : 'Gabungan (Seluruh Tim Alih Media)',
      arsipList: mappedArsipList
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
 * Export Berita Acara ke Google Docs (DocumentApp) sesuai Template DOCX Resmi
 * @param {Object} payload
 * @returns {Object} jsonResponse with doc URL
 */
function exportBAToGoogleDoc(payload) {
  try {
    if (!payload) return jsonResponse(false, null, 'Payload Berita Acara kosong.');
    
    var docName = 'Berita Acara Alih Media - ' + (payload.nomorBA ? payload.nomorBA.replace(/[/\\?%*:|"<>]/g, '_') : ('Tahun_' + (payload.tahunAngka || 2026)));
    var doc = DocumentApp.create(docName);
    var body = doc.getBody();
    
    // Page setup (A4 Portrait, margin 2cm / ~56.7pt)
    body.setPageWidth(595.28);
    body.setPageHeight(841.89);
    body.setMarginTop(54);
    body.setMarginBottom(54);
    body.setMarginLeft(54);
    body.setMarginRight(54);
    
    // 1. Kop Surat Resmi
    var p1 = body.appendParagraph('PEMERINTAH KABUPATEN MANGGARAI BARAT');
    p1.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p1.setFontFamily('Times New Roman').setFontSize(13).setBold(true);
    
    var p2 = body.appendParagraph('DINAS KEARSIPAN DAN PERPUSTAKAAN');
    p2.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p2.setFontFamily('Times New Roman').setFontSize(15).setBold(true);
    
    var p3 = body.appendParagraph(payload.alamatKop || 'Jl. Samping Bank NTT, Kelurahan Wae Kelambu\nLabuan Bajo - Flores - NTT');
    p3.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p3.setFontFamily('Times New Roman').setFontSize(9.5).setItalic(true);
    
    var pDivider = body.appendParagraph('____________________________________________________________________');
    pDivider.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pDivider.setFontFamily('Times New Roman').setFontSize(10).setBold(true);
    
    body.appendParagraph('');
    
    // 2. Judul Dokumen
    var pJudul = body.appendParagraph('BERITA ACARA ALIH MEDIA ARSIP');
    pJudul.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pJudul.setFontFamily('Times New Roman').setFontSize(13).setBold(true).setUnderline(true);
    
    var pNomor = body.appendParagraph('Nomor: ' + (payload.nomorBA || '....................................................'));
    pNomor.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pNomor.setFontFamily('Times New Roman').setFontSize(11);
    
    body.appendParagraph('');
    
    // 3. Paragraf Pembuka
    var pBuka = body.appendParagraph(
      'Pada hari ini, ' + (payload.hariNama || 'Rabu') + ', tanggal ' + (payload.tanggalAngka || '31') + ' ' + 
      (payload.bulanNama || 'Desember') + ' ' + (payload.tahunAngka || 2025) + 
      ', bertempat di Dinas Kearsipan dan Perpustakaan Daerah Kabupaten Manggarai Barat, telah dilaksanakan kegiatan alih media arsip dari media fisik ke media digital dengan keterangan sebagai berikut:'
    );
    pBuka.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pBuka.setFontFamily('Times New Roman').setFontSize(11).setLineSpacing(1.25);
    
    // 4. Tabel 1: Ringkasan Kegiatan (Table Grid ber-border)
    var jmlBerkas = payload.jumlahBerkas || (payload.arsipList ? payload.arsipList.length : 0);
    var jmlLembar = payload.totalLembar || payload.jumlahLembar || 0;
    var pelaksanaNama = payload.pelaksana ? payload.pelaksana.nama : (payload.namaPetugas || 'Muhammad Dzaky Nathanegara, A.Md');
    
    var t1Data = [
      ['Uraian', 'Keterangan'],
      ['Jenis Kegiatan', payload.jenisKegiatan || 'Alih Media Arsip dari media kertas (fisik) ke media digital (softcopy/PDF)'],
      ['Periode Pelaksanaan', payload.periodePelaksanaan || ('Bulan ' + (payload.bulanNama || 'Desember') + ' ' + (payload.tahunAngka || 2025))],
      ['Jenis Arsip', payload.jenisArsip || 'Arsip Statis Terbuka'],
      ['Jumlah Berkas', jmlBerkas + ' berkas'],
      ['Jumlah Lembar', jmlLembar + ' lembar'],
      ['Pelaksana Alih Media', pelaksanaNama],
      ['Lokasi Simpan Fisik', payload.lokasiSimpan || 'Depo Arsip DKP Kab. Manggarai Barat']
    ];
    
    var table1 = body.appendTable(t1Data);
    table1.setBorderWidth(1);
    table1.setBorderColor('#000000');
    
    // Format Header Tabel 1
    var t1HeaderRow = table1.getRow(0);
    t1HeaderRow.getCell(0).setWidth(150).setBackgroundColor('#F1F5F9').getChild(0).asParagraph()
      .setFontFamily('Times New Roman').setFontSize(10.5).setBold(true);
    t1HeaderRow.getCell(1).setWidth(337).setBackgroundColor('#F1F5F9').getChild(0).asParagraph()
      .setFontFamily('Times New Roman').setFontSize(10.5).setBold(true);
      
    // Format Isi Tabel 1
    for (var r1 = 1; r1 < t1Data.length; r1++) {
      var row1 = table1.getRow(r1);
      row1.getCell(0).setWidth(150).getChild(0).asParagraph()
        .setFontFamily('Times New Roman').setFontSize(10.5).setBold(true);
      row1.getCell(1).setWidth(337).getChild(0).asParagraph()
        .setFontFamily('Times New Roman').setFontSize(10.5);
    }
    
    body.appendParagraph('');
    
    // 5. Paragraf Pengantar Rincian Arsip
    var pPengantar = body.appendParagraph('Arsip yang telah dilaksanakan alih media pada periode sebagaimana tersebut di atas adalah sebagai berikut:');
    pPengantar.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pPengantar.setFontFamily('Times New Roman').setFontSize(11).setLineSpacing(1.25);
    
    // 6. Tabel 2: Daftar Rincian Arsip (Table Grid ber-border)
    var arsipList = payload.arsipList || [];
    var t2Data = [
      ['No', 'Kode Unik', 'Jenis Arsip', 'Uraian Arsip', 'Kurun Waktu', 'Jumlah Lembar']
    ];
    
    if (arsipList.length === 0) {
      t2Data.push(['1', '-', 'Arsip Statis Terbuka', 'Berkas Arsip Alih Media Periode ' + (payload.periodePelaksanaan || ''), '-', jmlLembar + ' lembar']);
    } else {
      for (var aIdx = 0; aIdx < arsipList.length; aIdx++) {
        var item = arsipList[aIdx];
        t2Data.push([
          String(item.no || (aIdx + 1)),
          item.kode_unik || '-',
          item.jenis_arsip || 'Arsip Statis Terbuka',
          item.uraian || '-',
          item.kurun_waktu || '-',
          (item.jumlah_lembar || 1) + ' lembar'
        ]);
      }
    }
    // Baris Total
    t2Data.push(['', '', '', '', 'TOTAL', jmlLembar + ' lembar']);
    
    var table2 = body.appendTable(t2Data);
    table2.setBorderWidth(1);
    table2.setBorderColor('#000000');
    
    // Format Header Tabel 2
    var t2HeaderRow = table2.getRow(0);
    var colWidths = [30, 90, 85, 155, 65, 62];
    for (var c = 0; c < 6; c++) {
      var hCell = t2HeaderRow.getCell(c);
      hCell.setWidth(colWidths[c]).setBackgroundColor('#F1F5F9');
      var pHead = hCell.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(9.5).setBold(true);
      pHead.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    }
    
    // Format Baris Data Tabel 2
    for (var r2 = 1; r2 < t2Data.length - 1; r2++) {
      var row2 = table2.getRow(r2);
      for (var c2 = 0; c2 < 6; c2++) {
        var bCell = row2.getCell(c2);
        bCell.setWidth(colWidths[c2]);
        var pBody = bCell.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(9);
        if (c2 === 0 || c2 === 1 || c2 === 4 || c2 === 5) {
          pBody.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
        } else {
          pBody.setAlignment(DocumentApp.HorizontalAlignment.LEFT);
        }
      }
    }
    
    // Format Baris Total Tabel 2
    var lastRowIdx = t2Data.length - 1;
    var rowTotal = table2.getRow(lastRowIdx);
    for (var ct = 0; ct < 6; ct++) {
      var totCell = rowTotal.getCell(ct);
      totCell.setWidth(colWidths[ct]).setBackgroundColor('#FAFAFA');
      var pTot = totCell.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(9.5).setBold(true);
      if (ct === 4) {
        pTot.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
      } else if (ct === 5) {
        pTot.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      }
    }
    
    body.appendParagraph('');
    
    // 7. Paragraf Klausul Hukum ANRI & Penutup
    var pKlausul1 = body.appendParagraph(
      'Kegiatan alih media dilaksanakan dengan tujuan untuk menjamin keselamatan dan kemudahan akses informasi arsip, serta sebagai pengganti fungsi arsip fisik/asli sesuai dengan ketentuan peraturan perundang-undangan yang berlaku, khususnya Undang-Undang Nomor 43 Tahun 2009 tentang Kearsipan serta Peraturan Kepala ANRI yang mengatur tentang pedoman alih media arsip.'
    );
    pKlausul1.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pKlausul1.setFontFamily('Times New Roman').setFontSize(10.5).setLineSpacing(1.25);
    
    var pKlausul2 = body.appendParagraph(
      'Arsip hasil alih media (reproduksi) disimpan secara terpisah dari arsip aslinya dan diperlakukan sesuai dengan kaidah pengelolaan arsip yang berlaku, sedangkan arsip asli tetap disimpan sebagai arsip pendukung/pembanding.'
    );
    pKlausul2.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pKlausul2.setFontFamily('Times New Roman').setFontSize(10.5).setLineSpacing(1.25);
    
    var pPenutup = body.appendParagraph('Demikian Berita Acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.');
    pPenutup.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pPenutup.setFontFamily('Times New Roman').setFontSize(10.5).setLineSpacing(1.25);
    
    body.appendParagraph('');
    
    // 8. Tanda Tangan (2 Kolom Tabel Tanpa Border)
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
        var pK2 = cellKadis.appendParagraph('Kepala Dinas Kearsipan dan Perpustakaan\nKabupaten Manggarai Barat,');
        pK2.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11).setBold(true);
        cellKadis.appendParagraph('\n\n\n');
        var pK3 = cellKadis.appendParagraph(payload.kadis ? (payload.kadis.NAMA || 'Augustinus Rinus, S.Pd') : 'Augustinus Rinus, S.Pd');
        pK3.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11).setBold(true).setUnderline(true);
        var pK4 = cellKadis.appendParagraph(payload.kadis ? (payload.kadis.PANGKAT || 'Pembina Utama Muda') : 'Pembina Utama Muda');
        pK4.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10);
        var pK5 = cellKadis.appendParagraph('NIP. ' + (payload.kadis ? (payload.kadis.NIP || '19720219 199903 1 008') : '19720219 199903 1 008'));
        pK5.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10);
      } else {
        cellKadis.getChild(0).asParagraph().setText('');
      }
      
      // Kolom Pelaksana (Kanan)
      var cellPelaksana = ttdRow.appendTableCell();
      cellPelaksana.setWidth(245);
      if (usePelaksana) {
        var tglSurat = 'Labuan Bajo, ' + (payload.tanggalSurat || ((payload.tanggalAngka || '31') + ' ' + (payload.bulanNama || 'Desember') + ' ' + (payload.tahunAngka || 2025)));
        var pP1 = cellPelaksana.getChild(0).asParagraph();
        pP1.setText(tglSurat).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11);
        var pP2 = cellPelaksana.appendParagraph((payload.tipe === 'gabungan' ? 'Koordinator Pelaksana Alih Media,' : 'Pelaksana Alih Media,'));
        pP2.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11).setBold(true);
        cellPelaksana.appendParagraph('\n\n\n');
        var pP3 = cellPelaksana.appendParagraph(payload.pelaksana ? (payload.pelaksana.nama || 'Muhammad Dzaky Nathanegara, A.Md') : 'Muhammad Dzaky Nathanegara, A.Md');
        pP3.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11).setBold(true).setUnderline(true);
        var pP4 = cellPelaksana.appendParagraph('NIP. ' + (payload.pelaksana ? (payload.pelaksana.nip || '19980508 202506 1 004') : '19980508 202506 1 004'));
        pP4.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10);
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
