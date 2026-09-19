/**
 * =========================================
 * SIASTA - LaporanService.gs
 * Laporan Generation (Internal & Eksternal)
 * =========================================
 */

/**
 * Generate data laporan
 * @param {Object} params - {tipe: 'internal'|'eksternal', bulan, tahun, stafId}
 */
function generateLaporanData(params) {
  try {
    var allArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP);
    var allStaf = readAllData(CONFIG.SHEETS.MASTER_STAF);
    
    // Filter arsip
    var filtered = allArsip.filter(function(a) {
      if (a.status === 'Dihapus') return false;
      var d = a.tanggal_input ? new Date(a.tanggal_input) : null;
      if (!d || isNaN(d.getTime())) return false;
      if (params.tahun && d.getFullYear() !== parseInt(params.tahun)) return false;
      if (params.bulan !== undefined && params.bulan !== '' && d.getMonth() !== parseInt(params.bulan)) return false;
      if (params.stafId && a.staf_id !== params.stafId) return false;
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
    
    filtered.forEach(function(a) {
      if (!jenisCount[a.jenis_arsip]) jenisCount[a.jenis_arsip] = 0;
      jenisCount[a.jenis_arsip]++;
      
      if (!asalCount[a.asal_arsip]) asalCount[a.asal_arsip] = 0;
      asalCount[a.asal_arsip]++;
      
      totalLembar += parseInt(a.jumlah_lembar) || 0;
      totalBerkas += parseInt(a.jumlah_berkas) || 0;
    });
    
    // Build laporan data
    var laporanData = {
      tipe: params.tipe,
      periode: '',
      instansi: CONFIG.APP.INSTANSI,
      daerah: CONFIG.APP.DAERAH,
      totalArsip: filtered.length,
      totalLembar: totalLembar,
      totalBerkas: totalBerkas,
      jenisBreakdown: jenisCount,
      asalBreakdown: asalCount,
      tanggalGenerate: formatTanggal(new Date(), 'long')
    };
    
    // Set periode text
    if (params.bulan !== undefined && params.bulan !== '') {
      laporanData.periode = getNamaBulan(parseInt(params.bulan)) + ' ' + params.tahun;
    } else {
      laporanData.periode = 'Tahun ' + params.tahun;
    }
    
    // Internal: include full detail
    if (params.tipe === 'internal') {
      laporanData.arsipDetail = filtered.map(function(a) {
        return {
          no: 0,
          kode_unik: a.kode_unik,
          deskripsi: a.deskripsi,
          jenis_arsip: a.jenis_arsip,
          asal_arsip: a.asal_arsip,
          jumlah_lembar: a.jumlah_lembar,
          jumlah_berkas: a.jumlah_berkas,
          kurun_waktu: a.kurun_waktu || a.kurun_waktu_mulai || '-',
          unit_pengelola: a.unit_pengelola,
          lokasi_simpan: a.lokasi_simpan,
          status_keterbukaan: a.status_keterbukaan,
          staf_nama: a.staf_nama,
          tanggal_input: formatTanggal(a.tanggal_input, 'short'),
          qa_status: a.qa_checklist ? 'Lulus' : 'Belum',
          keterangan: a.keterangan
        };
      });
      
      // Numbering
      laporanData.arsipDetail.forEach(function(a, i) { a.no = i + 1; });
      
      // Per staf breakdown
      var stafBreakdown = {};
      filtered.forEach(function(a) {
        if (!stafBreakdown[a.staf_nama]) {
          stafBreakdown[a.staf_nama] = { nama: a.staf_nama, jumlah: 0 };
        }
        stafBreakdown[a.staf_nama].jumlah++;
      });
      laporanData.stafBreakdown = Object.values(stafBreakdown);
    }
    
    // Eksternal: limited data
    if (params.tipe === 'eksternal') {
      laporanData.arsipDetail = filtered.map(function(a, i) {
        return {
          no: i + 1,
          kode_unik: a.kode_unik,
          deskripsi: a.deskripsi,
          jenis_arsip: a.jenis_arsip,
          kurun_waktu: a.kurun_waktu || a.kurun_waktu_mulai || '-',
          status_keterbukaan: a.status_keterbukaan
        };
      });
    }
    
    logActivity('GENERATE_LAPORAN', 'Laporan',
      'Generate laporan ' + params.tipe + ': ' + laporanData.periode);
    
    return jsonResponse(true, laporanData);
    
  } catch (e) {
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
  // Jika base64 tersedia dan tidak terlalu besar (< 70KB), data URI lebih cepat di-render di preview dan print
  var dataUri = 'data:' + mimeType + ';base64,' + cleanBase64;
  var storedUrl = (dataUri.length < 80000) ? dataUri : directUrl;

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
      try {
        getDummyStaffList().forEach(function(d) { dummyMap[d.id] = d; });
      } catch (eMap) {}
      data.forEach(function(s) {
        if (!s.status) s.status = 'Aktif';
        if ((!s.email || s.email === '-') && dummyMap[s.id] && dummyMap[s.id].email) {
          s.email = dummyMap[s.id].email;
        }
        if (!s.tanda_tangan_url && dummyMap[s.id] && dummyMap[s.id].tanda_tangan_url) {
          s.tanda_tangan_url = dummyMap[s.id].tanda_tangan_url;
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
 * Export Laporan ke Google Docs (DocumentApp)
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

    // Page setup (A4 Portrait, margin 18mm = 51pt)
    body.setPageWidth(595.28);
    body.setPageHeight(841.89);
    body.setMarginTop(51);
    body.setMarginBottom(51);
    body.setMarginLeft(51);
    body.setMarginRight(51);

    // 1. Kop Surat
    var p1 = body.appendParagraph('PEMERINTAH KABUPATEN MANGGARAI BARAT');
    p1.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p1.setFontFamily('Times New Roman').setFontSize(12).setBold(true);

    var p2 = body.appendParagraph('DINAS KEARSIPAN DAN PERPUSTAKAAN');
    p2.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p2.setFontFamily('Times New Roman').setFontSize(14).setBold(true);

    var p3 = body.appendParagraph('Jl. Samping Bank NTT, Kelurahan Wae Kelambu, Labuan Bajo - Flores - NTT');
    p3.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p3.setFontFamily('Times New Roman').setFontSize(9.5).setItalic(true);

    var pDiv = body.appendParagraph('____________________________________________________________________');
    pDiv.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pDiv.setFontFamily('Times New Roman').setFontSize(10).setBold(true);

    body.appendParagraph('');

    // 2. Judul Laporan
    var pJudul = body.appendParagraph('LAPORAN ' + (isInternal ? 'INTERNAL' : 'EKSTERNAL'));
    pJudul.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pJudul.setFontFamily('Times New Roman').setFontSize(13).setBold(true).setUnderline(true);

    var pSub = body.appendParagraph('KEGIATAN ALIH MEDIA ARSIP STATIS');
    pSub.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pSub.setFontFamily('Times New Roman').setFontSize(11).setBold(true);

    var pPer = body.appendParagraph('Periode: ' + d.periode);
    pPer.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    pPer.setFontFamily('Times New Roman').setFontSize(10.5);

    body.appendParagraph('');

    // 3. Ringkasan
    var pSect1 = body.appendParagraph('I. RINGKASAN PELAKSANAAN');
    pSect1.setFontFamily('Times New Roman').setFontSize(11.5).setBold(true);

    var sumData = [
      ['Total Arsip Dialihmediakan', ': ' + d.totalArsip + ' item arsip'],
      ['Total Lembar', ': ' + d.totalLembar + ' lembar'],
      ['Total Berkas', ': ' + d.totalBerkas + ' berkas'],
      ['Tanggal Laporan Dibuat', ': ' + d.tanggalGenerate]
    ];
    var sumTable = body.appendTable(sumData);
    sumTable.setBorderWidth(0);
    for (var s = 0; s < sumData.length; s++) {
      sumTable.getRow(s).getCell(0).setWidth(180).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10.5);
      sumTable.getRow(s).getCell(1).setWidth(300).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(10.5);
    }

    body.appendParagraph('');

    // 4. Tabel Arsip (Maksimal 150 item pertama jika sangat panjang untuk stabilitas Docs)
    if (d.arsipDetail && d.arsipDetail.length > 0) {
      var pSect2 = body.appendParagraph('II. DAFTAR ARSIP STATIS');
      pSect2.setFontFamily('Times New Roman').setFontSize(11.5).setBold(true);

      var tableRows = [];
      if (isInternal) {
        tableRows.push(['No', 'Kode Unik', 'Deskripsi', 'Jenis', 'Staf', 'Status']);
      } else {
        tableRows.push(['No', 'Kode Unik', 'Deskripsi', 'Jenis', 'Status']);
      }

      var maxRows = Math.min(d.arsipDetail.length, 150);
      for (var i = 0; i < maxRows; i++) {
        var a = d.arsipDetail[i];
        if (isInternal) {
          tableRows.push([
            String(a.no || (i + 1)),
            a.kode_unik || '-',
            a.deskripsi || '-',
            a.jenis_arsip || '-',
            a.staf_nama || '-',
            a.status_keterbukaan || 'Terbuka'
          ]);
        } else {
          tableRows.push([
            String(a.no || (i + 1)),
            a.kode_unik || '-',
            a.deskripsi || '-',
            a.jenis_arsip || '-',
            a.status_keterbukaan || 'Terbuka'
          ]);
        }
      }

      var arsipTable = body.appendTable(tableRows);
      arsipTable.setBorderWidth(1);
      // Header row styling
      var hRow = arsipTable.getRow(0);
      for (var c = 0; c < hRow.getNumCells(); c++) {
        var hCell = hRow.getCell(c);
        hCell.setBackgroundColor('#f1f5f9');
        hCell.getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(9.5).setBold(true).setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      }
      for (var r = 1; r < tableRows.length; r++) {
        var bRow = arsipTable.getRow(r);
        for (var c = 0; c < bRow.getNumCells(); c++) {
          bRow.getCell(c).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(9);
        }
      }

      if (d.arsipDetail.length > maxRows) {
        var pNote = body.appendParagraph('*(Catatan: Menampilkan ' + maxRows + ' dari total ' + d.arsipDetail.length + ' arsip untuk kelancaran dokumen)*');
        pNote.setFontFamily('Times New Roman').setFontSize(8.5).setItalic(true);
      }

      body.appendParagraph('');
    }

    // 5. Breakdown Staf (Internal only)
    if (isInternal && d.stafBreakdown && d.stafBreakdown.length > 0) {
      var pSect3 = body.appendParagraph('III. REKAPITULASI PELAKSANA ALIH MEDIA');
      pSect3.setFontFamily('Times New Roman').setFontSize(11.5).setBold(true);

      var stafRows = [['No', 'Nama Staf / Petugas', 'Jumlah Arsip']];
      d.stafBreakdown.forEach(function(sb, sIdx) {
        stafRows.push([String(sIdx + 1), sb.nama || '-', (sb.jumlah || 0) + ' item']);
      });

      var stafTable = body.appendTable(stafRows);
      stafTable.setBorderWidth(1);
      var sHRow = stafTable.getRow(0);
      for (var c = 0; c < sHRow.getNumCells(); c++) {
        sHRow.getCell(c).setBackgroundColor('#f1f5f9');
        sHRow.getCell(c).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(9.5).setBold(true);
      }
      for (var r = 1; r < stafRows.length; r++) {
        var sBRow = stafTable.getRow(r);
        for (var c = 0; c < sBRow.getNumCells(); c++) {
          sBRow.getCell(c).getChild(0).asParagraph().setFontFamily('Times New Roman').setFontSize(9);
        }
      }

      body.appendParagraph('');
    }

    // 6. Blok Pengesahan (Master Toggle Checkbox)
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
        pK1.setText('Mengetahui,').setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11);
        var pK2 = cell1.appendParagraph(params.signer1Title || 'Kepala Dinas Kearsipan dan Perpustakaan\nKabupaten Manggarai Barat');
        pK2.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11).setBold(true);
        cell1.appendParagraph('\n\n\n');
        var pK3 = cell1.appendParagraph(params.signer1Nama || 'AUGUSTINUS RINUS, S.Pd');
        pK3.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11).setBold(true).setUnderline(true);
        if (params.signer1Pangkat) {
          var pK4 = cell1.appendParagraph(params.signer1Pangkat);
          pK4.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5);
        }
        var pK5 = cell1.appendParagraph('NIP. ' + (params.signer1Nip || '19720219 199903 1 008'));
        pK5.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5);
      } else {
        cell1.getChild(0).asParagraph().setText('');
      }

      // Signer 2 (Pelaksana / Koordinator)
      var cell2 = ttdRow.appendTableCell();
      cell2.setWidth(245);
      if (useSigner2) {
        var pP1 = cell2.getChild(0).asParagraph();
        pP1.setText('Labuan Bajo, ' + (d.tanggalGenerate || formatTanggal(new Date(), 'long'))).setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11);
        var pP2 = cell2.appendParagraph(params.signer2Title || 'Pelaksana Alih Media,');
        pP2.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11).setBold(true);
        cell2.appendParagraph('\n\n\n');
        var pP3 = cell2.appendParagraph(params.signer2Nama || 'MUHAMMAD DZAKY NATHANEGARA, A.Md');
        pP3.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(11).setBold(true).setUnderline(true);
        if (params.signer2Jabatan) {
          var pP4 = cell2.appendParagraph(params.signer2Jabatan);
          pP4.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5);
        }
        var pP5 = cell2.appendParagraph('NIP. ' + (params.signer2Nip || '19980508 202506 1 004'));
        pP5.setAlignment(DocumentApp.HorizontalAlignment.CENTER).setFontFamily('Times New Roman').setFontSize(10.5);
      } else {
        cell2.getChild(0).asParagraph().setText('');
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

