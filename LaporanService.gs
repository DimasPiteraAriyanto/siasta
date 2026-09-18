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
          kurun_waktu: a.kurun_waktu_mulai || '-',
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
          kurun_waktu: a.kurun_waktu_mulai || '-',
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
      
      updateData(CONFIG.SHEETS.MASTER_STAF, staf._rowIndex, updateFields);
      logActivity('EDIT_STAF', 'KelolaStaf', 'Edit staf: ' + data.nama);
      invalidateSheetCache(CONFIG.SHEETS.MASTER_STAF);
      clearCache('CACHE_STAFF_LIST');
      return jsonResponse(true, null, 'Data staf berhasil diupdate.');
      
    } else {
      // Create new
      var newStaf = {
        id: generateId('STF'),
        nama: data.nama,
        nip: data.nip,
        jabatan: data.jabatan,
        email: data.email || '',
        status: 'Aktif',
        tanda_tangan_id: '',
        tanda_tangan_url: '',
        tanggal_dibuat: new Date()
      };
      
      appendData(CONFIG.SHEETS.MASTER_STAF, newStaf);
      logActivity('TAMBAH_STAF', 'KelolaStaf', 'Tambah staf baru: ' + data.nama);
      invalidateSheetCache(CONFIG.SHEETS.MASTER_STAF);
      clearCache('CACHE_STAFF_LIST');
      return jsonResponse(true, { id: newStaf.id }, 'Staf baru berhasil ditambahkan.');
    }
    
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

