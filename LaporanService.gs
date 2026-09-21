/**
 * =========================================
 * SIASTA - LaporanService.gs
 * Laporan Generation (Internal & Eksternal)
 * =========================================
 */

/**
 * Generate data laporan alih media (Internal & Eksternal)
 * Menyesuaikan 4 mode kombinasi:
 * 1. Per Staf - Per Bulan
 * 2. Semua Staf - Per Bulan
 * 3. Per Staf - Per Tahun
 * 4. Semua Staf - Per Tahun
 * @param {Object} params - {tipe: 'internal'|'eksternal', bulan, tahun, stafId}
 */
function generateLaporanData(params) {
  try {
    var allArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP) || [];
    var stafRes = getAllStaf();
    var allStaf = (stafRes && stafRes.success && stafRes.data) ? stafRes.data : (readAllData(CONFIG.SHEETS.MASTER_STAF) || []);
    
    var isPerStaf = !!(params.stafId && params.stafId.trim());
    var isPerBulan = (params.bulan !== undefined && params.bulan !== '' && params.bulan !== null);
    var tahunInt = parseInt(params.tahun) || new Date().getFullYear();
    var bulanInt = isPerBulan ? parseInt(params.bulan) : null;
    
    // Staf terpilih jika per_staf
    var selectedStaf = null;
    if (isPerStaf) {
      selectedStaf = allStaf.find(function(s) { return s.id === params.stafId; }) || null;
    }
    
    // Filter arsip
    var filtered = allArsip.filter(function(a) {
      if (a.status === 'Dihapus') return false;
      var d = a.tanggal_input ? new Date(a.tanggal_input) : null;
      if (!d || isNaN(d.getTime())) return false;
      if (d.getFullYear() !== tahunInt) return false;
      if (isPerBulan && d.getMonth() !== bulanInt) return false;
      if (isPerStaf && a.staf_id !== params.stafId) return false;
      return true;
    });
    
    // Sort by kode_unik
    filtered.sort(function(a, b) {
      return (a.kode_unik || '').localeCompare(b.kode_unik || '');
    });
    
    // Summary stats
    var jenisCount = {};
    var asalCount = {};
    var totalLembar = 0;
    var totalBerkas = 0;
    var stafSet = {};
    
    filtered.forEach(function(a) {
      if (!jenisCount[a.jenis_arsip]) jenisCount[a.jenis_arsip] = 0;
      jenisCount[a.jenis_arsip]++;
      
      if (!asalCount[a.asal_arsip]) asalCount[a.asal_arsip] = 0;
      asalCount[a.asal_arsip]++;
      
      totalLembar += (parseInt(a.jumlah_lembar) || 0);
      totalBerkas += (parseInt(a.jumlah_berkas) || 1);
      
      if (a.staf_nama && a.staf_nama.trim()) {
        stafSet[a.staf_nama.trim()] = true;
      }
    });
    
    // Daftar petugas pelaksana
    var petugasList = [];
    if (isPerStaf) {
      petugasList = [selectedStaf ? selectedStaf.nama : (params.stafNama || 'Petugas Alih Media')];
    } else {
      var uniqueInputStaf = Object.keys(stafSet);
      if (uniqueInputStaf.length > 0) {
        petugasList = uniqueInputStaf;
      } else {
        // Fallback ke staf aktif
        petugasList = allStaf.filter(function(s) { return s.status === 'Aktif' || !s.status; }).map(function(s) { return s.nama; });
        if (petugasList.length === 0) petugasList = ['Petugas Alih Media'];
      }
    }
    
    // Periode & Rentang Tanggal
    var periodeText = '';
    var rentangTanggalText = '';
    if (isPerBulan) {
      var namaBln = getNamaBulan(bulanInt);
      periodeText = namaBln + ' ' + tahunInt;
      var lastDay = new Date(tahunInt, bulanInt + 1, 0).getDate();
      rentangTanggalText = '1 s.d. ' + lastDay + ' ' + namaBln + ' ' + tahunInt;
    } else {
      periodeText = 'Januari - Desember ' + tahunInt;
      rentangTanggalText = '1 Januari s.d. 31 Desember ' + tahunInt;
    }
    
    // Mode deskriptor
    var modeKategori = (isPerStaf ? 'per_staf' : 'semua_staf') + '_' + (isPerBulan ? 'per_bulan' : 'per_tahun');
    
    // Pejabat default dari Pengaturan / Config
    var pejabatConfigRes = getPejabatConfig();
    var pejabatData = (pejabatConfigRes && pejabatConfigRes.data) ? pejabatConfigRes.data : {};
    
    // Cari data staf untuk Kabid (Fatima Melani Rambing) langsung dari master_staf
    var kabidStaf = allStaf.find(function(s) {
      var n = (s.nama || '').toLowerCase();
      var j = (s.jabatan || '').toLowerCase();
      return n.indexOf('fatima') !== -1 || j.indexOf('kabid') !== -1 || j.indexOf('layanan dan perlindungan') !== -1;
    });

    var kabidNama = (kabidStaf && kabidStaf.nama) ? kabidStaf.nama : (pejabatData.kabid ? pejabatData.kabid.nama : 'Fatima Melani Rambing, SAP');
    var kabidPangkat = (kabidStaf && kabidStaf.jabatan && kabidStaf.jabatan.indexOf('Pembina') !== -1) ? kabidStaf.jabatan : (pejabatData.kabid ? pejabatData.kabid.pangkat : 'Pembina IV/a');
    var kabidNip = (kabidStaf && kabidStaf.nip) ? kabidStaf.nip : (pejabatData.kabid ? pejabatData.kabid.nip : '197305231992122003');
    var kabidTtd = (kabidStaf && kabidStaf.tanda_tangan_url) ? kabidStaf.tanda_tangan_url : (kabidStaf && kabidStaf.tanda_tangan_id ? ('https://drive.google.com/thumbnail?id=' + kabidStaf.tanda_tangan_id + '&sz=w600') : '');
    var kabidTtdId = (kabidStaf && kabidStaf.tanda_tangan_id) ? kabidStaf.tanda_tangan_id : '';
    
    // Role default penandatangan ke-2
    var signer2DefaultRole = isPerStaf ? 'Pelaksana Alih Media Arsip' : 'Penanggung Jawab Kegiatan Alih Media Arsip Statis';
    var signer2DefaultNama = '';
    var signer2DefaultJabatan = '';
    var signer2DefaultNip = '';
    var signer2DefaultPangkat = '';
    var signer2DefaultTtd = '';
    var signer2DefaultTtdId = '';
    
    if (isPerStaf && selectedStaf) {
      // Ambil tanda tangan murni sesuai data staf yang dipilih
      signer2DefaultNama = selectedStaf.nama;
      signer2DefaultJabatan = signer2DefaultRole;
      signer2DefaultNip = selectedStaf.nip || '-';
      signer2DefaultPangkat = selectedStaf.jabatan || 'Pelaksana';
      signer2DefaultTtd = selectedStaf.tanda_tangan_url || (selectedStaf.tanda_tangan_id ? ('https://drive.google.com/thumbnail?id=' + selectedStaf.tanda_tangan_id + '&sz=w600') : '');
      signer2DefaultTtdId = selectedStaf.tanda_tangan_id || '';
    } else {
      // Semua Staf: cari Angela Ivonita Pareira dari master_staf
      var angelaStaf = allStaf.find(function(s) {
        return (s.nama || '').toLowerCase().indexOf('angela') !== -1;
      });
      if (angelaStaf) {
        signer2DefaultNama = angelaStaf.nama;
        signer2DefaultJabatan = signer2DefaultRole;
        signer2DefaultNip = angelaStaf.nip || '198008162025212006';
        signer2DefaultPangkat = angelaStaf.jabatan || 'Golongan V';
        signer2DefaultTtd = angelaStaf.tanda_tangan_url || (angelaStaf.tanda_tangan_id ? ('https://drive.google.com/thumbnail?id=' + angelaStaf.tanda_tangan_id + '&sz=w600') : '');
        signer2DefaultTtdId = angelaStaf.tanda_tangan_id || '';
      } else {
        signer2DefaultNama = 'Angela Ivonita Pareira';
        signer2DefaultJabatan = signer2DefaultRole;
        signer2DefaultNip = '198008162025212006';
        signer2DefaultPangkat = 'Golongan V';
        signer2DefaultTtd = '';
        signer2DefaultTtdId = '';
      }
    }
    
    // Build data laporan terstruktur
    var laporanData = {
      tipe: params.tipe || 'internal',
      isPerStaf: isPerStaf,
      isPerBulan: isPerBulan,
      modeKategori: modeKategori,
      stafId: params.stafId || '',
      selectedStaf: selectedStaf,
      petugasPelaksana: petugasList.join(', '),
      petugasList: petugasList,
      periode: periodeText,
      rentangTanggal: rentangTanggalText,
      bulan: params.bulan,
      tahun: tahunInt,
      instansi: CONFIG.APP.INSTANSI || 'Dinas Kearsipan dan Perpustakaan Daerah',
      daerah: CONFIG.APP.DAERAH || 'Kabupaten Manggarai Barat',
      unitKerja: 'Bidang Layanan dan Perlindungan Arsip',
      namaKegiatan: 'Alih Media Arsip Statis',
      totalArsip: filtered.length,
      totalLembar: totalLembar,
      totalBerkas: totalBerkas,
      jenisBreakdown: jenisCount,
      asalBreakdown: asalCount,
      tanggalGenerate: formatTanggal(new Date(), 'long'),
      
      // Rekomendasi Default Pejabat (tanda tangan asli dari data staf)
      defaultSigner1: {
        nama: kabidNama,
        title: 'Kepala Bidang Layanan dan Perlindungan Arsip',
        pangkat: kabidPangkat,
        nip: kabidNip,
        ttdUrl: kabidTtd,
        ttdId: kabidTtdId
      },
      defaultSigner2: {
        nama: signer2DefaultNama,
        title: signer2DefaultRole,
        pangkat: signer2DefaultPangkat,
        nip: signer2DefaultNip,
        ttdUrl: signer2DefaultTtd,
        ttdId: signer2DefaultTtdId
      }
    };
    
    // Detail Arsip (10 Kolom resmi untuk Eksternal + kolom pelengkap untuk Internal)
    laporanData.arsipDetail = filtered.map(function(a, i) {
      return {
        no: i + 1,
        id: a.id,
        kode_unik: a.kode_unik || '-',
        status_keterbukaan: a.status_keterbukaan || 'Terbuka',
        asal_arsip: a.asal_arsip || a.kode_asal || '-',
        kode_asal: a.kode_asal || '-',
        jenis_arsip: a.jenis_arsip || 'Tekstual',
        kategori_urusan: a.kategori_urusan || 'Pemerintahan',
        pencipta_arsip: a.unit_pengelola || a.pencipta_arsip || '-',
        unit_pengelola: a.unit_pengelola || '-',
        kurun_waktu: a.kurun_waktu || a.kurun_waktu_mulai || '-',
        jumlah_lembar: parseInt(a.jumlah_lembar) || 1,
        jumlah_berkas: parseInt(a.jumlah_berkas) || 1,
        deskripsi: a.deskripsi || '-',
        lokasi_simpan: a.lokasi_simpan || '-',
        staf_nama: a.staf_nama || '-',
        tanggal_input: a.tanggal_input ? formatTanggal(a.tanggal_input, 'short') : '-',
        keterangan: a.keterangan || '-'
      };
    });
    
    // Breakdown Staf (Internal Semua Staf)
    var stafBreakdown = {};
    filtered.forEach(function(a) {
      var sName = a.staf_nama || 'Lainnya';
      if (!stafBreakdown[sName]) {
        stafBreakdown[sName] = { nama: sName, jumlahArsip: 0, totalLembar: 0, totalBerkas: 0 };
      }
      stafBreakdown[sName].jumlahArsip++;
      stafBreakdown[sName].totalLembar += (parseInt(a.jumlah_lembar) || 0);
      stafBreakdown[sName].totalBerkas += (parseInt(a.jumlah_berkas) || 1);
    });
    laporanData.stafBreakdown = Object.values(stafBreakdown);
    
    logActivity('GENERATE_LAPORAN', 'Laporan',
      'Generate laporan ' + params.tipe + ' [' + modeKategori + ']: ' + laporanData.periode);
    
    return jsonResponse(true, laporanData);
    
  } catch (e) {
    Logger.log('Error generateLaporanData: ' + e.message);
    return jsonResponse(false, null, 'Error generate laporan: ' + e.message);
  }
}

/**
 * Get target & realisasi data
 */
function getTargetRealisasi(tahun) {
  try {
    tahun = tahun || (CONFIG.APP && CONFIG.APP.TAHUN ? CONFIG.APP.TAHUN : 2026);
    var allArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP) || [];
    
    allArsip = allArsip.filter(function(a) {
      var d = a.tanggal_input ? new Date(a.tanggal_input) : null;
      return d && !isNaN(d.getTime()) && a.status !== 'Dihapus' && d.getFullYear() === parseInt(tahun);
    });
    
    var targetTahunan = CONFIG.TARGET.ARSIP_TAHUNAN;
    var totalRealisasi = allArsip.length;
    
    // Per bulan
    var monthlyData = [];
    var cumulativeTotal = 0;
    for (var m = 0; m < 12; m++) {
      var monthArsip = allArsip.filter(function(a) {
        var d = a.tanggal_input ? new Date(a.tanggal_input) : null;
        return d && !isNaN(d.getTime()) && d.getMonth() === m;
      });
      cumulativeTotal += monthArsip.length;
      
      // Per staf di bulan ini
      var perStaf = {};
      monthArsip.forEach(function(a) {
        if (!perStaf[a.staf_nama]) perStaf[a.staf_nama] = 0;
        perStaf[a.staf_nama]++;
      });
      
      monthlyData.push({
        bulan: m,
        namaBulan: getNamaBulan(m),
        namaBulanShort: getNamaBulan(m).substring(0, 3),
        realisasi: monthArsip.length,
        kumulatif: cumulativeTotal,
        targetBulanan: Math.ceil(targetTahunan / 12),
        perStaf: perStaf,
        persentase: calculatePercentage(cumulativeTotal, targetTahunan)
      });
    }
    
    // Per staf summary
    var stafSummary = {};
    allArsip.forEach(function(a) {
      if (!stafSummary[a.staf_nama]) {
        stafSummary[a.staf_nama] = { nama: a.staf_nama, total: 0 };
      }
      stafSummary[a.staf_nama].total++;
    });
    
    return jsonResponse(true, {
      tahun: tahun,
      targetTahunan: targetTahunan,
      totalRealisasi: totalRealisasi,
      persentase: calculatePercentage(totalRealisasi, targetTahunan),
      monthlyData: monthlyData,
      stafSummary: Object.values(stafSummary),
      sisaTarget: Math.max(0, targetTahunan - totalRealisasi)
    });
    
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Kelola staf CRUD
 */
function saveStaf(data) {
  try {
    var user = getCurrentUser();
    
    if (data.id) {
      // Update existing
      var staf = findOneByColumn(CONFIG.SHEETS.MASTER_STAF, 'id', data.id);
      if (!staf) return jsonResponse(false, null, 'Staf tidak ditemukan.');
      
      var updateFields = {
        nama: data.nama,
        nip: data.nip,
        jabatan: data.jabatan,
        email: data.email || '',
        status: data.status || 'Aktif'
      };

      // Simpan tanda tangan jika ada perubahan
      if (data.tanda_tangan_url !== undefined) {
        updateFields.tanda_tangan_url = data.tanda_tangan_url;
      }
      if (data.tanda_tangan_id !== undefined) {
        updateFields.tanda_tangan_id = data.tanda_tangan_id;
      }

      // Jika ada file TTD baru yang diunggah bersama form
      if (data.tandaTanganData) {
        try {
          var ttdUpload = processTandaTanganUpload(staf.id, data.tandaTanganData, data.tandaTanganName, data.tandaTanganMime);
          if (ttdUpload) {
            updateFields.tanda_tangan_id = ttdUpload.id;
            updateFields.tanda_tangan_url = ttdUpload.url;
          }
        } catch (eTTD) {
          Logger.log('Gagal upload TTD saat edit staf: ' + eTTD.message);
        }
      }
      
      updateData(CONFIG.SHEETS.MASTER_STAF, staf._rowIndex, updateFields);
      logActivity('EDIT_STAF', 'KelolaStaf', 'Edit staf: ' + data.nama);
      invalidateSheetCache(CONFIG.SHEETS.MASTER_STAF);
      clearCache('CACHE_STAFF_LIST');
      return jsonResponse(true, { id: staf.id, tanda_tangan_url: updateFields.tanda_tangan_url || staf.tanda_tangan_url }, 'Data staf berhasil diupdate.');
      
    } else {
      // Create new
      var newStafId = generateId('STF');
      var ttdId = '';
      var ttdUrl = data.tanda_tangan_url || '';

      if (data.tandaTanganData) {
        try {
          var ttdNew = processTandaTanganUpload(newStafId, data.tandaTanganData, data.tandaTanganName, data.tandaTanganMime);
          if (ttdNew) {
            ttdId = ttdNew.id;
            ttdUrl = ttdNew.url;
          }
        } catch (eNewTTD) {
          Logger.log('Gagal upload TTD saat tambah staf: ' + eNewTTD.message);
        }
      }

      var newStaf = {
        id: newStafId,
        nama: data.nama,
        nip: data.nip,
        jabatan: data.jabatan,
        email: data.email || '',
        status: data.status || 'Aktif',
        tanda_tangan_id: ttdId,
        tanda_tangan_url: ttdUrl,
        tanggal_dibuat: new Date()
      };
      
      appendData(CONFIG.SHEETS.MASTER_STAF, newStaf);
      logActivity('TAMBAH_STAF', 'KelolaStaf', 'Tambah staf baru: ' + data.nama);
      invalidateSheetCache(CONFIG.SHEETS.MASTER_STAF);
      clearCache('CACHE_STAFF_LIST');
      return jsonResponse(true, { id: newStaf.id, tanda_tangan_url: ttdUrl }, 'Staf baru berhasil ditambahkan.');
    }
    
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Helper internal untuk proses file upload tanda tangan staf
 */
function processTandaTanganUpload(stafId, base64Data, fileName, mimeType) {
  if (!base64Data) return null;
  var cleanBase64 = base64Data;
  if (cleanBase64.indexOf('base64,') !== -1) {
    cleanBase64 = cleanBase64.split('base64,')[1];
  }
  mimeType = mimeType || 'image/png';
  var ext = mimeType.indexOf('jpeg') !== -1 || mimeType.indexOf('jpg') !== -1 ? '.jpg' : '.png';
  var finalName = 'ttd_' + stafId + '_' + new Date().getTime() + ext;

  var uploadResult = uploadFile(cleanBase64, finalName, mimeType, CONFIG.DRIVE_FOLDERS.TANDA_TANGAN);
  if (!uploadResult || !uploadResult.id) return null;

  // Hasilkan data URI jika file kecil, atau thumbnail URL Drive
  var directUrl = 'https://drive.google.com/thumbnail?id=' + uploadResult.id + '&sz=w600';
  // Jika base64 tersedia dan tidak terlalu besar (< 35KB agar aman di sel Google Sheets), data URI lebih cepat di-render
  var dataUri = 'data:' + mimeType + ';base64,' + cleanBase64;
  var storedUrl = (dataUri.length < 35000) ? dataUri : directUrl;

  return {
    id: uploadResult.id,
    url: storedUrl,
    driveUrl: directUrl
  };
}

/**
 * Upload tanda tangan khusus untuk staf tertentu (bisa dipanggil mandiri dari menu Pengaturan / Kelola Staf)
 * @param {string} stafId
 * @param {string} base64Data
 * @param {string} fileName
 * @param {string} mimeType
 */
function uploadTandaTanganStaf(stafId, base64Data, fileName, mimeType) {
  try {
    if (!stafId) return jsonResponse(false, null, 'ID staf wajib disertakan.');
    if (!base64Data) return jsonResponse(false, null, 'Berkas tanda tangan kosong.');

    var staf = findOneByColumn(CONFIG.SHEETS.MASTER_STAF, 'id', stafId);
    if (!staf) return jsonResponse(false, null, 'Data staf tidak ditemukan di database.');

    var uploadResult = processTandaTanganUpload(stafId, base64Data, fileName, mimeType);
    if (!uploadResult) {
      return jsonResponse(false, null, 'Gagal mengunggah berkas tanda tangan ke Google Drive.');
    }

    // Update data di sheet master_staf
    updateData(CONFIG.SHEETS.MASTER_STAF, staf._rowIndex, {
      tanda_tangan_id: uploadResult.id,
      tanda_tangan_url: uploadResult.url
    });

    invalidateSheetCache(CONFIG.SHEETS.MASTER_STAF);
    clearCache('CACHE_STAFF_LIST');
    logActivity('UPLOAD_TTD', 'KelolaStaf', 'Upload tanda tangan staf: ' + staf.nama);

    return jsonResponse(true, {
      stafId: stafId,
      tanda_tangan_id: uploadResult.id,
      tanda_tangan_url: uploadResult.url
    }, 'Tanda tangan untuk ' + staf.nama + ' berhasil diperbarui.');

  } catch (e) {
    Logger.log('Error uploadTandaTanganStaf: ' + e.message);
    return jsonResponse(false, null, 'Gagal upload tanda tangan: ' + e.message);
  }
}

/**
 * Hapus tanda tangan staf
 * @param {string} stafId
 */
function deleteTandaTanganStaf(stafId) {
  try {
    if (!stafId) return jsonResponse(false, null, 'ID staf wajib disertakan.');
    var staf = findOneByColumn(CONFIG.SHEETS.MASTER_STAF, 'id', stafId);
    if (!staf) return jsonResponse(false, null, 'Staf tidak ditemukan.');

    // Hapus file fisik di Drive jika ada
    if (staf.tanda_tangan_id) {
      try {
        var file = DriveApp.getFileById(staf.tanda_tangan_id);
        if (file) file.setTrashed(true);
      } catch (eTrash) {
        Logger.log('Notice: Gagal menghapus file TTD di Drive: ' + eTrash.message);
      }
    }

    updateData(CONFIG.SHEETS.MASTER_STAF, staf._rowIndex, {
      tanda_tangan_id: '',
      tanda_tangan_url: ''
    });

    invalidateSheetCache(CONFIG.SHEETS.MASTER_STAF);
    clearCache('CACHE_STAFF_LIST');
    logActivity('DELETE_TTD', 'KelolaStaf', 'Hapus tanda tangan staf: ' + staf.nama);

    return jsonResponse(true, { stafId: stafId }, 'Tanda tangan staf berhasil dihapus.');
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Hapus data staf dari master_staf
 * @param {string} stafId
 */
function deleteStaf(stafId) {
  try {
    if (!stafId) return jsonResponse(false, null, 'ID staf wajib disertakan.');
    var allStaf = readAllData(CONFIG.SHEETS.MASTER_STAF);
    var staf = allStaf.find(function(s) { return s.id === stafId; });
    if (!staf) return jsonResponse(false, null, 'Data staf tidak ditemukan.');

    // Hapus file fisik tanda tangan di Drive jika ada
    if (staf.tanda_tangan_id) {
      try {
        var file = DriveApp.getFileById(staf.tanda_tangan_id);
        if (file) file.setTrashed(true);
      } catch (eTrash) {
        Logger.log('Notice: Gagal menghapus file TTD di Drive: ' + eTrash.message);
      }
    }

    var sheet = getSheet(CONFIG.SHEETS.MASTER_STAF);
    var rowIndex = staf._rowIndex;
    if (rowIndex && rowIndex > 1) {
      sheet.deleteRow(rowIndex);
      invalidateSheetCache(CONFIG.SHEETS.MASTER_STAF);
      clearCache('CACHE_STAFF_LIST');
      logActivity('DELETE_STAF', 'KelolaStaf', 'Hapus staf: ' + (staf.nama || stafId));
      return jsonResponse(true, { stafId: stafId }, 'Data staf ' + (staf.nama || '') + ' berhasil dihapus.');
    }
    return jsonResponse(false, null, 'Baris data staf tidak valid.');
  } catch (e) {
    Logger.log('Error deleteStaf: ' + e.message);
    return jsonResponse(false, null, 'Gagal menghapus staf: ' + e.message);
  }
}

/**
 * Get all staf data
 */
function getAllStaf() {
  try {
    var data = readAllData(CONFIG.SHEETS.MASTER_STAF);
    if (!data || data.length === 0) {
      var dummy = getDummyStaffList();
      try {
        dummy.forEach(function(s) {
          appendData(CONFIG.SHEETS.MASTER_STAF, s);
        });
        invalidateSheetCache(CONFIG.SHEETS.MASTER_STAF);
      } catch (errD) {}
      data = dummy;
    } else {
      var dummyMap = {};
      var dummyList = getDummyStaffList();
      try {
        dummyList.forEach(function(d) { dummyMap[d.id] = d; });
      } catch (eMap) {}

      // Pastikan pejabat & penanggung jawab default (Fatima & Angela) ada di daftar staf
      var existingNames = data.map(function(s) { return (s.nama || '').toLowerCase(); });
      var hasFatima = existingNames.some(function(n) { return n.indexOf('fatima') !== -1; });
      var hasAngela = existingNames.some(function(n) { return n.indexOf('angela') !== -1; });
      if (!hasFatima) {
        var fatimaDummy = dummyList.find(function(d) { return d.id === 'STAF-007'; });
        if (fatimaDummy) data.push(fatimaDummy);
      }
      if (!hasAngela) {
        var angelaDummy = dummyList.find(function(d) { return d.id === 'STAF-008'; });
        if (angelaDummy) data.push(angelaDummy);
      }

      data.forEach(function(s) {
        if (!s.status) s.status = 'Aktif';
        if ((!s.email || s.email === '-') && dummyMap[s.id] && dummyMap[s.id].email) {
          s.email = dummyMap[s.id].email;
        }
        if (!s.tanda_tangan_url && s.tanda_tangan_id) {
          s.tanda_tangan_url = 'https://drive.google.com/thumbnail?id=' + s.tanda_tangan_id + '&sz=w600';
        }
        if (s.tanda_tangan_url && s.tanda_tangan_url.indexOf('drive.google.com') !== -1 && s.tanda_tangan_url.indexOf('/file/d/') !== -1) {
          var m = s.tanda_tangan_url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          if (m && m[1]) s.tanda_tangan_url = 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w600';
        }
      });
    }
    return jsonResponse(true, data);
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Get pengaturan
 */
function getPengaturan() {
  try {
    var data = readAllData(CONFIG.SHEETS.PENGATURAN);
    var settings = {};
    data.forEach(function(d) { settings[d.key] = d.value; });
    return jsonResponse(true, settings);
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Update pengaturan
 */
function updatePengaturan(key, value) {
  try {
    var existing = findOneByColumn(CONFIG.SHEETS.PENGATURAN, 'key', key);
    if (existing) {
      updateData(CONFIG.SHEETS.PENGATURAN, existing._rowIndex, {
        value: value,
        tanggal_update: new Date()
      });
    } else {
      appendData(CONFIG.SHEETS.PENGATURAN, {
        key: key,
        value: value,
        deskripsi: '',
        tanggal_update: new Date()
      });
    }
    logActivity('UPDATE_PENGATURAN', 'Pengaturan', 'Update: ' + key + ' = ' + value);
    return jsonResponse(true, null, 'Pengaturan berhasil diupdate.');
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Update target tahunan & watermark dalam 1 panggilan
 */
function savePengaturanAll(target, watermark) {
  try {
    if (target !== undefined && target !== null && target !== '') {
      updatePengaturan('target_tahunan', target);
    }
    if (watermark !== undefined && watermark !== null) {
      updatePengaturan('watermark_text', watermark);
    }
    clearCache('CACHE_DASHBOARD_STATS');
    return jsonResponse(true, null, 'Pengaturan sistem berhasil disimpan.');
  } catch (e) {
    return jsonResponse(false, null, 'Gagal menyimpan pengaturan: ' + e.message);
  }
}

/**
 * Save kode asal arsip
 */
function saveKodeAsal(data) {
  try {
    if (data.isEdit) {
      var existing = findOneByColumn(CONFIG.SHEETS.KODE_ASAL, 'kode', data.kodeOld || data.kode);
      if (existing) {
        updateData(CONFIG.SHEETS.KODE_ASAL, existing._rowIndex, {
          kode: data.kode,
          nama: data.nama,
          deskripsi: data.deskripsi,
          status: data.status || 'Aktif'
        });
      }
    } else {
      appendData(CONFIG.SHEETS.KODE_ASAL, {
        kode: data.kode,
        nama: data.nama,
        deskripsi: data.deskripsi,
        status: 'Aktif'
      });
    }
    logActivity('KELOLA_KODE_ASAL', 'Pengaturan', 'Kode asal: ' + data.kode + ' - ' + data.nama);
    return jsonResponse(true, null, 'Kode asal berhasil disimpan.');
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Get data pejabat penandatangan dokumen dinas
 */
function getPejabatConfig() {
  try {
    var data = readAllData(CONFIG.SHEETS.PENGATURAN);
    var settings = {};
    data.forEach(function(d) { settings[d.key] = d.value; });
    
    var kadis = {
      nama: settings['kadis_nama'] || (CONFIG.PEJABAT && CONFIG.PEJABAT.KADIS ? CONFIG.PEJABAT.KADIS.NAMA : 'Augustinus Rinus, S.Pd'),
      pangkat: settings['kadis_pangkat'] || (CONFIG.PEJABAT && CONFIG.PEJABAT.KADIS ? CONFIG.PEJABAT.KADIS.PANGKAT : 'Pembina Utama Muda'),
      nip: settings['kadis_nip'] || (CONFIG.PEJABAT && CONFIG.PEJABAT.KADIS ? CONFIG.PEJABAT.KADIS.NIP : '19720219 199903 1 008'),
      jabatan: settings['kadis_jabatan'] || (CONFIG.PEJABAT && CONFIG.PEJABAT.KADIS ? CONFIG.PEJABAT.KADIS.JABATAN : 'Kepala Dinas Kearsipan dan Perpustakaan Kabupaten Manggarai Barat')
    };
    
    var kabid = {
      nama: settings['kabid_nama'] || (CONFIG.PEJABAT && CONFIG.PEJABAT.KABID ? CONFIG.PEJABAT.KABID.NAMA : 'Stefanus Rahmat, S.Sos'),
      pangkat: settings['kabid_pangkat'] || (CONFIG.PEJABAT && CONFIG.PEJABAT.KABID ? CONFIG.PEJABAT.KABID.PANGKAT : 'Pembina / IV a'),
      nip: settings['kabid_nip'] || (CONFIG.PEJABAT && CONFIG.PEJABAT.KABID ? CONFIG.PEJABAT.KABID.NIP : '19850215 201001 1 018'),
      jabatan: settings['kabid_jabatan'] || (CONFIG.PEJABAT && CONFIG.PEJABAT.KABID ? CONFIG.PEJABAT.KABID.JABATAN : 'Kepala Bidang Layanan, Alih Media dan Perlindungan Arsip')
    };

    var pelaksana = {
      nama: settings['pelaksana_nama'] || 'Muhammad Dzaky Nathanegara, A.Md',
      nip: settings['pelaksana_nip'] || '19980508 202506 1 004',
      jabatan: settings['pelaksana_jabatan'] || 'Pengelola Kearsipan'
    };

    var alamatKop = settings['alamat_kop'] || (CONFIG.PEJABAT && CONFIG.PEJABAT.ALAMAT_KOP ? CONFIG.PEJABAT.ALAMAT_KOP : 'Jl. Samping Bank NTT, Kelurahan Wae Kelambu, Labuan Bajo - Flores - NTT');

    return jsonResponse(true, {
      kadis: kadis,
      kabid: kabid,
      pelaksana: pelaksana,
      alamatKop: alamatKop
    });
  } catch (e) {
    return jsonResponse(false, null, 'Error getPejabatConfig: ' + e.message);
  }
}

/**
 * Save data pejabat penandatangan dokumen dinas
 */
function savePejabatConfig(p) {
  try {
    p = p || {};
    if (p.kadisNama) updatePengaturan('kadis_nama', p.kadisNama);
    if (p.kadisPangkat) updatePengaturan('kadis_pangkat', p.kadisPangkat);
    if (p.kadisNip) updatePengaturan('kadis_nip', p.kadisNip);
    if (p.kadisJabatan) updatePengaturan('kadis_jabatan', p.kadisJabatan);

    if (p.kabidNama) updatePengaturan('kabid_nama', p.kabidNama);
    if (p.kabidPangkat) updatePengaturan('kabid_pangkat', p.kabidPangkat);
    if (p.kabidNip) updatePengaturan('kabid_nip', p.kabidNip);
    if (p.kabidJabatan) updatePengaturan('kabid_jabatan', p.kabidJabatan);

    if (p.pelaksanaNama) updatePengaturan('pelaksana_nama', p.pelaksanaNama);
    if (p.pelaksanaNip) updatePengaturan('pelaksana_nip', p.pelaksanaNip);
    if (p.pelaksanaJabatan) updatePengaturan('pelaksana_jabatan', p.pelaksanaJabatan);

    if (p.alamatKop) updatePengaturan('alamat_kop', p.alamatKop);

    logActivity('UPDATE_PEJABAT', 'Pengaturan', 'Update pejabat resmi penandatangan dokumen dinas');
    return jsonResponse(true, null, 'Data pejabat penandatangan berhasil diperbarui.');
  } catch (e) {
    return jsonResponse(false, null, 'Gagal menyimpan pejabat: ' + e.message);
  }
}

/**
 * Alias getStafList untuk kompatibilitas frontend
 */
function getStafList() {
  return getAllStaf();
}

/**
 * Export Laporan ke Google Docs (DocumentApp) sesuai format resmi template revisi_laporan
 * @param {Object} params - Parameter laporan dan opsi pengesahan
 * @returns {Object} jsonResponse with doc URL
 */
function exportLaporanToGoogleDoc(params) {
  try {
    params = params || {};
    var res = generateLaporanData(params);
    if (!res || !res.success || !res.data) {
      return jsonResponse(false, null, 'Gagal mengambil data laporan: ' + (res ? res.message : ''));
    }
    var d = res.data;
    var isInternal = d.tipe === 'internal';
    var docTitle = 'Laporan ' + (isInternal ? 'Internal' : 'Eksternal') + ' Alih Media - ' + d.periode;
    var doc = DocumentApp.create(docTitle);
    var body = doc.getBody();

    // Page setup (A4 Portrait, margin 2cm = 54pt)
    body.setPageWidth(595.28);
    body.setPageHeight(841.89);
    body.setMarginTop(54);
    body.setMarginBottom(54);
    body.setMarginLeft(54);
    body.setMarginRight(54);

    // 1. Kop Surat Resmi
    var p1 = body.appendParagraph('PEMERINTAH KABUPATEN MANGGARAI BARAT');
    p1.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p1.setFontFamily('Times New Roman').setFontSize(12).setBold(true);

    var p2 = body.appendParagraph('DINAS KEARSIPAN DAN PERPUSTAKAAN DAERAH');
    p2.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p2.setFontFamily('Times New Roman').setFontSize(14).setBold(true);

    var p3 = body.appendParagraph(d.pejabat && d.pejabat.alamatKop ? d.pejabat.alamatKop : 'Jl. Samping Bank NTT, Kelurahan Wae Kelambu, Labuan Bajo - Flores - NTT');
    p3.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p3.setFontFamily('Times New Roman').setFontSize(9.5).setItalic(true);

    var pDiv = body.appendParagraph('____________________________________________________________________');
    pDiv.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pDiv.setFontFamily('Times New Roman').setFontSize(10).setBold(true);

    body.appendParagraph('');

    // 2. Judul Dokumen Resmi
    var pJudul = body.appendParagraph('LAPORAN ' + (isInternal ? 'INTERNAL' : 'EKSTERNAL') + ' PELAKSANAAN KEGIATAN ALIH MEDIA ARSIP STATIS');
    pJudul.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pJudul.setFontFamily('Times New Roman').setFontSize(12.5).setBold(true).setUnderline(true);

    body.appendParagraph('');

    // 3. IDENTITAS KEGIATAN
    var hIdentitas = body.appendParagraph('IDENTITAS KEGIATAN');
    hIdentitas.setFontFamily('Times New Roman').setFontSize(11).setBold(true);

    var identitasTableData = [
      ['Nama Kegiatan', ':', 'Alih Media Arsip Statis'],
      ['Unit Kerja', ':', 'Bidang Layanan dan Perlindungan Arsip'],
      ['Periode Pelaksanaan', ':', d.periode || ('Tahun ' + d.tahun)],
      ['Petugas Pelaksana', ':', d.petugasPelaksana || 'Petugas Alih Media']
    ];
    var idTable = body.appendTable(identitasTableData);
    idTable.setBorderWidth(0);
    for (var it = 0; it < identitasTableData.length; it++) {
      var itRow = idTable.getRow(it);
      itRow.getCell(0).setWidth(140).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10.5);
      itRow.getCell(1).setWidth(15).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10.5);
      itRow.getCell(2).setWidth(330).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10.5);
    }

    body.appendParagraph('');

    // 4. DASAR PELAKSANAAN
    var hDasar = body.appendParagraph('DASAR PELAKSANAAN');
    hDasar.setFontFamily('Times New Roman').setFontSize(11).setBold(true);

    var pDasarText = body.appendParagraph(
      'Kegiatan alih media arsip statis dilaksanakan berdasarkan ketentuan peraturan perundang-undangan di bidang kearsipan yang berlaku, ' +
      'Peraturan Arsip Nasional Republik Indonesia Nomor 2 Tahun 2021 tentang Alih Media Arsip Statis, serta Perjanjian Kinerja Tahun ' + d.tahun + ' ' +
      'pada Dinas Kearsipan dan Perpustakaan Daerah Kabupaten Manggarai Barat.'
    );
    pDasarText.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pDasarText.setFontFamily('Times New Roman').setFontSize(10.5).setLineSpacing(1.2);

    body.appendParagraph('');

    // 5. URAIAN PELAKSANAAN
    var hUraian = body.appendParagraph('URAIAN PELAKSANAAN');
    hUraian.setFontFamily('Times New Roman').setFontSize(11).setBold(true);

    var pUraianText = body.appendParagraph(
      'Kegiatan alih media arsip statis dilaksanakan pada periode ' + (d.rentangTanggal || d.periode) + ' oleh ' + (d.petugasPelaksana || 'Petugas Alih Media') + ' ' +
      'pada Bidang Layanan dan Perlindungan Arsip, Dinas Kearsipan dan Perpustakaan Daerah Kabupaten Manggarai Barat.'
    );
    pUraianText.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pUraianText.setFontFamily('Times New Roman').setFontSize(10.5).setLineSpacing(1.2);

    var pTahapanText = body.appendParagraph(
      'Pelaksanaan kegiatan meliputi persiapan arsip yang akan dialihmediakan, pemeriksaan kondisi dan kelengkapan arsip, ' +
      'proses pemindaian atau konversi arsip ke dalam bentuk digital, pemberian identitas atau nama berkas digital, ' +
      'serta penyimpanan hasil alih media sesuai dengan sistem pengelolaan arsip yang digunakan.'
    );
    pTahapanText.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pTahapanText.setFontFamily('Times New Roman').setFontSize(10.5).setLineSpacing(1.2);

    body.appendParagraph('');

    // 6. HASIL KEGIATAN
    var hHasil = body.appendParagraph('HASIL KEGIATAN');
    hHasil.setFontFamily('Times New Roman').setFontSize(11).setBold(true);

    var pHasilRingkasan = body.appendParagraph(
      'Berdasarkan pelaksanaan kegiatan pada periode ' + (d.rentangTanggal || d.periode) + ', telah dilaksanakan kegiatan alih media arsip statis ' +
      'sebanyak ' + d.totalBerkas + ' berkas, dengan jumlah keseluruhan ' + d.totalLembar + ' lembar.'
    );
    pHasilRingkasan.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pHasilRingkasan.setFontFamily('Times New Roman').setFontSize(10.5).setLineSpacing(1.2);

    if (!isInternal) {
      // Eksternal: Paragraf pengantar + Tabel 10 kolom
      var pTabelPengantar = body.appendParagraph(
        'Rincian arsip yang menjadi hasil kegiatan disajikan berdasarkan informasi arsip yang dapat ditampilkan untuk keperluan eksternal, meliputi:'
      );
      pTabelPengantar.setFontFamily('Times New Roman').setFontSize(10.5);

      var eksternalHeaders = ['No', 'Kode Unik', 'Status Keterbukaan', 'Asal Arsip', 'Jenis Arsip', 'Kategori Urusan', 'Pencipta Arsip', 'Kurun Waktu', 'Jumlah Lembar', 'Jumlah Berkas'];
      var eksTableRows = [eksternalHeaders];

      var maxEks = Math.min(d.arsipDetail.length, 120);
      for (var eI = 0; eI < maxEks; eI++) {
        var aE = d.arsipDetail[eI];
        eksTableRows.push([
          String(eI + 1),
          aE.kode_unik || '-',
          aE.status_keterbukaan || 'Terbuka',
          aE.asal_arsip || '-',
          aE.jenis_arsip || '-',
          aE.kategori_urusan || '-',
          aE.unit_pengelola || aE.pencipta_arsip || '-',
          aE.kurun_waktu || '-',
          String(aE.jumlah_lembar || 1),
          String(aE.jumlah_berkas || 1)
        ]);
      }

      var eksTable = body.appendTable(eksTableRows);
      eksTable.setBorderWidth(1).setBorderColor('#000000');
      var eHRow = eksTable.getRow(0);
      for (var eh = 0; eh < eHRow.getNumCells(); eh++) {
        eHRow.getCell(eh).setBackgroundColor('#f1f5f9');
        eHRow.getCell(eh).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(8.5).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      }
      for (var er = 1; er < eksTableRows.length; er++) {
        var rEks = eksTable.getRow(er);
        for (var ec = 0; ec < rEks.getNumCells(); ec++) {
          rEks.getCell(ec).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(8);
        }
      }

      if (d.arsipDetail.length > maxEks) {
        var pCat = body.appendParagraph('*(Menampilkan ' + maxEks + ' dari ' + d.arsipDetail.length + ' arsip untuk efisiensi Google Docs)*');
        pCat.setFontFamily('Times New Roman').setFontSize(8.5).setItalic(true);
      }

    } else {
      // Internal: Paragraf pengantar lampiran
      var pInternalRef = body.appendParagraph(
        'Rincian arsip yang menjadi hasil kegiatan, meliputi identitas arsip, asal arsip, jenis arsip, klasifikasi, kurun waktu, pencipta arsip, ' +
        'kondisi fisik, lokasi penyimpanan, serta data pendukung lainnya, disajikan pada Lampiran Daftar Arsip Hasil Alih Media yang merupakan bagian tidak terpisahkan dari laporan ini.'
      );
      pInternalRef.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
      pInternalRef.setFontFamily('Times New Roman').setFontSize(10.5).setLineSpacing(1.2);
    }

    body.appendParagraph('');

    // 7. PENUTUP
    var hPenutup = body.appendParagraph('PENUTUP');
    hPenutup.setFontFamily('Times New Roman').setFontSize(11).setBold(true);

    var pPenutup1 = body.appendParagraph(
      'Laporan pelaksanaan kegiatan alih media arsip statis ini disusun sebagai dokumentasi pelaksanaan kegiatan pada ' + d.periode + ' ' +
      'oleh ' + (d.petugasPelaksana || 'Petugas Alih Media') + ' pada Bidang Layanan dan Perlindungan Arsip, Dinas Kearsipan dan Perpustakaan Daerah Kabupaten Manggarai Barat.'
    );
    pPenutup1.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pPenutup1.setFontFamily('Times New Roman').setFontSize(10.5).setLineSpacing(1.2);

    var pPenutup2 = body.appendParagraph(
      'Laporan ini diharapkan dapat menjadi bahan dokumentasi dan pertanggungjawaban pelaksanaan kegiatan serta memberikan informasi mengenai hasil pelaksanaan alih media arsip statis pada periode yang dilaporkan.'
    );
    pPenutup2.setAlignment(DocumentApp.HorizontalAlignment.JUSTIFY);
    pPenutup2.setFontFamily('Times New Roman').setFontSize(10.5).setLineSpacing(1.2);

    body.appendParagraph('');

    // 8. PENGESAHAN / TANDA TANGAN (Tabel 2 Kolom tanpa border)
    var useSigner1 = params.useSigner1 !== false && params.useSigner1 !== 'false';
    var useSigner2 = params.useSigner2 !== false && params.useSigner2 !== 'false';

    if (useSigner1 || useSigner2) {
      var ttdTable = body.appendTable();
      ttdTable.setBorderWidth(0);
      var ttdRow = ttdTable.appendTableRow();

      // Signer 1 (Mengetahui)
      var cell1 = ttdRow.appendTableCell();
      cell1.setWidth(240);
      if (useSigner1) {
        var pK1 = cell1.getChild(0).asParagraph();
        pK1.setText('Mengetahui,').setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5);
        var pK2 = cell1.appendParagraph(params.signer1Title || 'Kepala Bidang Layanan dan Perlindungan Arsip');
        pK2.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5).setBold(true);
        insertSignatureToCell(cell1, params.signer1TtdUrl || (d.defaultSigner1 ? d.defaultSigner1.ttdUrl : ''), params.signer1TtdId);
        var pK3 = cell1.appendParagraph(params.signer1Nama || 'Fatima Melani Rambing, SAP');
        pK3.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5).setBold(true).setUnderline(true);
        if (params.signer1Pangkat) {
          var pK4 = cell1.appendParagraph(params.signer1Pangkat);
          pK4.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10);
        }
        var pK5 = cell1.appendParagraph('NIP. ' + (params.signer1Nip || '197305231992122003'));
        pK5.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10);
      } else {
        cell1.getChild(0).asParagraph().setText('');
      }

      // Signer 2 (Pelaksana / Penanggung Jawab)
      var cell2 = ttdRow.appendTableCell();
      cell2.setWidth(245);
      if (useSigner2) {
        var s2Title = params.signer2Title || (d.isPerStaf ? 'Pelaksana Alih Media Arsip' : 'Penanggung Jawab Kegiatan Alih Media Arsip Statis');
        var s2Nama = params.signer2Nama || (d.isPerStaf ? (d.selectedStaf ? d.selectedStaf.nama : 'Pelaksana') : 'Angela Ivonita Pareira');
        var s2Pangkat = params.signer2Pangkat || (d.isPerStaf ? 'Pelaksana' : 'Golongan V');
        var s2Nip = params.signer2Nip || (d.isPerStaf ? (d.selectedStaf ? d.selectedStaf.nip : '-') : '198008162025212006');
        var s2TtdUrl = params.signer2TtdUrl || (d.defaultSigner2 ? d.defaultSigner2.ttdUrl : '');

        var pP1 = cell2.getChild(0).asParagraph();
        pP1.setText('Labuan Bajo, ' + (d.tanggalGenerate || formatTanggal(new Date(), 'long'))).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5);
        var pP2 = cell2.appendParagraph(s2Title);
        pP2.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5).setBold(true);
        insertSignatureToCell(cell2, s2TtdUrl, params.signer2TtdId);
        var pP3 = cell2.appendParagraph(s2Nama);
        pP3.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5).setBold(true).setUnderline(true);
        if (s2Pangkat) {
          var pP4 = cell2.appendParagraph(s2Pangkat);
          pP4.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10);
        }
        var pP5 = cell2.appendParagraph('NIP. ' + s2Nip);
        pP5.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10);
      } else {
        cell2.getChild(0).asParagraph().setText('');
      }
    }

    // 9. LAMPIRAN DAFTAR ARSIP INTERNAL (Jika Internal dan ada arsip)
    if (isInternal && d.arsipDetail && d.arsipDetail.length > 0) {
      body.appendPageBreak();
      
      var pLampHeader = body.appendParagraph('LAMPIRAN: DAFTAR ARSIP HASIL ALIH MEDIA');
      pLampHeader.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11.5).setBold(true).setUnderline(true);
      
      var pLampSub = body.appendParagraph('Periode: ' + d.periode + ' | ' + (d.isPerStaf ? ('Petugas: ' + d.petugasPelaksana) : 'Seluruh Tim Alih Media'));
      pLampSub.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10);
      
      body.appendParagraph('');

      var intHeaders = ['No', 'Kode Unik', 'Uraian Informasi', 'Jenis', 'Asal Arsip', 'Kurun Waktu', 'Lembar', 'Staf', 'Status'];
      var intTableRows = [intHeaders];

      var maxInt = Math.min(d.arsipDetail.length, 120);
      for (var iR = 0; iR < maxInt; iR++) {
        var aI = d.arsipDetail[iR];
        intTableRows.push([
          String(iR + 1),
          aI.kode_unik || '-',
          aI.deskripsi || '-',
          aI.jenis_arsip || '-',
          aI.asal_arsip || '-',
          aI.kurun_waktu || '-',
          String(aI.jumlah_lembar || 1),
          aI.staf_nama || '-',
          aI.status_keterbukaan || 'Terbuka'
        ]);
      }

      var intTable = body.appendTable(intTableRows);
      intTable.setBorderWidth(1).setBorderColor('#000000');
      var iHRow = intTable.getRow(0);
      for (var ih = 0; ih < iHRow.getNumCells(); ih++) {
        iHRow.getCell(ih).setBackgroundColor('#f1f5f9');
        iHRow.getCell(ih).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(8.5).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      }
      for (var ir = 1; ir < intTableRows.length; ir++) {
        var rInt = intTable.getRow(ir);
        for (var ic = 0; ic < rInt.getNumCells(); ic++) {
          rInt.getCell(ic).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(8);
        }
      }

      // Rekapitulasi per staf (jika internal semua staf)
      if (!d.isPerStaf && d.stafBreakdown && d.stafBreakdown.length > 0) {
        body.appendParagraph('');
        var hRekap = body.appendParagraph('REKAPITULASI HASIL ALIH MEDIA PER STAF PELAKSANA:');
        hRekap.setFontFamily('Times New Roman').setFontSize(10.5).setBold(true);

        var rkRows = [['No', 'Nama Staf Pelaksana', 'Jumlah Berkas', 'Jumlah Lembar']];
        d.stafBreakdown.forEach(function(sb, sIdx) {
          rkRows.push([String(sIdx + 1), sb.nama || '-', String(sb.totalBerkas || 1) + ' berkas', String(sb.totalLembar || 0) + ' lembar']);
        });

        var rkTable = body.appendTable(rkRows);
        rkTable.setBorderWidth(1).setBorderColor('#000000');
        var rkHRow = rkTable.getRow(0);
        for (var rh = 0; rh < rkHRow.getNumCells(); rh++) {
          rkHRow.getCell(rh).setBackgroundColor('#f1f5f9');
          rkHRow.getCell(rh).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(9).setBold(true);
        }
        for (var rr = 1; rr < rkRows.length; rr++) {
          var rowRk = rkTable.getRow(rr);
          for (var rc = 0; rc < rowRk.getNumCells(); rc++) {
            rowRk.getCell(rc).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(8.5);
          }
        }
      }
    }

    doc.saveAndClose();

    // Pindahkan ke folder Laporan di Google Drive
    var file = DriveApp.getFileById(doc.getId());
    var targetFolder = getFolderByPath(CONFIG.DRIVE_FOLDERS.LAPORAN);
    if (targetFolder) {
      targetFolder.addFile(file);
      try {
        DriveApp.getRootFolder().removeFile(file);
      } catch (eRemove) {}
    }

    logActivity('EXPORT_LAPORAN_GDOC', 'Laporan', 'Export Laporan ke Google Docs: ' + docTitle);

    return jsonResponse(true, {
      id: doc.getId(),
      url: doc.getUrl(),
      name: docTitle
    }, 'Dokumen Google Docs Laporan berhasil dibuat.');
  } catch (e) {
    Logger.log('exportLaporanToGoogleDoc error: ' + e.message);
    return jsonResponse(false, null, 'Gagal membuat Google Docs Laporan: ' + e.message);
  }
}

/**
 * Helper untuk menyematkan gambar tanda tangan digital ke dalam sel tabel Google Docs
 */
function insertSignatureToCell(cell, ttdUrl, ttdId) {
  var inserted = false;
  if (ttdId) {
    try {
      var file = DriveApp.getFileById(ttdId);
      if (file) {
        var blob = file.getBlob();
        var img = cell.appendParagraph('').appendInlineImage(blob);
        img.setWidth(120).setHeight(50);
        inserted = true;
      }
    } catch (eDrive) {
      Logger.log('Notice insertSignatureToCell (Drive): ' + eDrive.message);
    }
  }
  if (!inserted && ttdUrl) {
    try {
      if (ttdUrl.indexOf('data:image/png;base64,') !== -1 || ttdUrl.indexOf('data:image/jpeg;base64,') !== -1 || ttdUrl.indexOf('data:image/jpg;base64,') !== -1) {
        var parts = ttdUrl.split('base64,');
        var mime = parts[0].replace('data:', '').replace(';', '');
        var bytes = Utilities.base64Decode(parts[1]);
        var blob = Utilities.newBlob(bytes, mime, 'signature.png');
        var img = cell.appendParagraph('').appendInlineImage(blob);
        img.setWidth(120).setHeight(50);
        inserted = true;
      } else if (ttdUrl.indexOf('drive.google.com') !== -1 && ttdUrl.indexOf('id=') !== -1) {
        var fileId = ttdUrl.split('id=')[1].split('&')[0];
        var file = DriveApp.getFileById(fileId);
        if (file) {
          var blob = file.getBlob();
          var img = cell.appendParagraph('').appendInlineImage(blob);
          img.setWidth(120).setHeight(50);
          inserted = true;
        }
      }
    } catch (eUrl) {
      Logger.log('Notice insertSignatureToCell (URL): ' + eUrl.message);
    }
  }
  if (!inserted) {
    cell.appendParagraph('\n\n\n');
  }
}


