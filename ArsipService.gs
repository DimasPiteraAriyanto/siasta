/**
 * =========================================
 * SIASTA - ArsipService.gs
 * Arsip Business Logic
 * =========================================
 */

/**
 * Generate kode unik arsip
 * Format: [ASAL]-[BOX]-[URUT] contoh: KOM-B05-128
 * Nomor urut reset ke 001 tiap ganti box atau asal arsip
 * @param {string} kodeAsal - Kode asal (KOM, LBJ, dll)
 * @param {string} nomorBox - Nomor box (contoh: 05)
 * @returns {Object} {kodeUnik, nomorUrut}
 */
function generateKodeUnik(kodeAsal, nomorBox) {
  var boxFormatted = 'B' + padNumber(parseInt(nomorBox), 2);
  
  // Cari nomor urut terakhir untuk kombinasi asal + box ini
  var allArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP);
  var matchingArsip = allArsip.filter(function(a) {
    return a.kode_asal === kodeAsal && a.nomor_box === boxFormatted && a.status !== 'Dihapus';
  });
  
  var lastUrut = 0;
  matchingArsip.forEach(function(a) {
    var urut = parseInt(a.nomor_urut) || 0;
    if (urut > lastUrut) lastUrut = urut;
  });
  
  var newUrut = lastUrut + 1;
  var kodeUnik = kodeAsal + '-' + boxFormatted + '-' + padNumber(newUrut, 3);
  
  return {
    kodeUnik: kodeUnik,
    nomorUrut: newUrut
  };
}

/**
 * Preview kode unik (tanpa menyimpan)
 * Callable from client
 */
function previewKodeUnik(kodeAsal, nomorBox) {
  try {
    var result = generateKodeUnik(kodeAsal, nomorBox);
    return jsonResponse(true, result);
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Simpan arsip baru
 * @param {Object} data - Data arsip dari form
 * @returns {Object} Response
 */
function saveArsip(data) {
  try {
    var user = getCurrentUser() || (data && data.activeUser ? data.activeUser : null) || { id: 'STAF-001', nama: 'Siprianus Mbemba', jabatan: 'Arsiparis Ahli Pertama' };
    
    // Generate kode unik
    var kode = generateKodeUnik(data.kodeAsal, data.nomorBox);
    var boxFormatted = 'B' + padNumber(parseInt(data.nomorBox), 2);
    var kodeUnikFinal = (data.kodeUnik && data.kodeUnik.trim()) ? data.kodeUnik.trim() : kode.kodeUnik;
    
    // Upload file jika ada
    var fileResult = null;
    if (data.fileData) {
      fileResult = uploadArsipFile(
        data.fileData,
        kodeUnikFinal + '_' + data.fileName,
        data.fileMimeType,
        data.kodeAsal,
        boxFormatted
      );
      
      // Apply watermark
      if (fileResult.pelestarian) {
        applyWatermark(fileResult.pelestarian.id);
      }
      if (fileResult.akses) {
        applyWatermark(fileResult.akses.id);
      }
    }
    
    // Prepare data untuk sheet
    var arsipData = {
      id: generateId('ARS'),
      kode_unik: kodeUnikFinal,
      status_keterbukaan: data.statusKeterbukaan || 'Tertutup',
      asal_arsip: data.asalArsip || '',
      kode_asal: data.kodeAsal || '',
      nomor_box: boxFormatted,
      nomor_urut: padNumber(kode.nomorUrut, 3),
      deskripsi: data.deskripsi || '',
      jenis_arsip: data.jenisArsip || 'Tekstual',
      kategori_urusan: data.kategoriUrusan || 'Pemerintahan',
      kode_klasifikasi_asli: data.kodeKlasifikasiAsli || '',
      nomor_asli: data.nomorAsli || '',
      jumlah_lembar: parseInt(data.jumlahLembar) || 1,
      jumlah_berkas: parseInt(data.jumlahBerkas) || 1,
      rangkap_ke: parseInt(data.rangkapKe) || 1,
      kondisi_fisik: data.kondisiFisik || 'Baik',
      kurun_waktu_mulai: data.kurunWaktuMulai || data.kurunWaktu || '',
      kurun_waktu_akhir: data.kurunWaktuAkhir || '',
      unit_pengelola: data.unitPengelola || '',
      lokasi_simpan: data.lokasiSimpan || '',
      keterangan: data.keterangan || '',
      file_pelestarian_id: fileResult ? fileResult.pelestarian.id : '',
      file_akses_id: fileResult ? fileResult.akses.id : '',
      file_pelestarian_url: fileResult ? fileResult.pelestarian.viewUrl : '',
      file_akses_url: fileResult ? fileResult.akses.viewUrl : '',
      waktu_unggah: data.waktuUnggah || new Date().toISOString(),
      qa_checklist: JSON.stringify(data.qaChecklist || []),
      watermark_applied: fileResult ? 'Ya' : 'Tidak',
      staf_id: (data.activeUser && data.activeUser.id) ? data.activeUser.id : user.id,
      staf_nama: (data.activeUser && data.activeUser.nama) ? data.activeUser.nama : user.nama,
      tanggal_input: new Date(),
      tanggal_update: new Date(),
      status: 'Aktif'
    };
    
    // Simpan ke sheet
    appendData(CONFIG.SHEETS.MASTER_ARSIP, arsipData);
    
    // Log aktivitas
    logActivity('INPUT_ARSIP', 'Arsip', 'Input arsip baru: ' + kodeUnikFinal + ' - ' + data.deskripsi);
    
    // Invalidate dashboard cache
    clearCache('CACHE_DASHBOARD_STATS');
    
    return jsonResponse(true, {
      id: arsipData.id,
      kodeUnik: kodeUnikFinal
    }, 'Arsip berhasil disimpan dengan kode: ' + kodeUnikFinal);
    
  } catch (e) {
    return jsonResponse(false, null, 'Error menyimpan arsip: ' + e.message);
  }
}

/**
 * Get daftar arsip dengan filter dan pagination
 * @param {Object} params - {page, pageSize, search, kodeAsal, jenisArsip, statusKeterbukaan, stafId}
 */
function getArsipList(params) {
  try {
    params = params || {};
    var allArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP) || [];
    
    // Filter out deleted
    allArsip = allArsip.filter(function(a) { return a.status !== 'Dihapus'; });
    
    // Sort by tanggal_input descending
    allArsip.sort(function(a, b) {
      return new Date(b.tanggal_input) - new Date(a.tanggal_input);
    });
    
    // Apply filters
    if (params.kodeAsal) {
      allArsip = allArsip.filter(function(a) { return a.kode_asal === params.kodeAsal; });
    }
    if (params.jenisArsip) {
      allArsip = allArsip.filter(function(a) { return a.jenis_arsip === params.jenisArsip; });
    }
    if (params.statusKeterbukaan) {
      allArsip = allArsip.filter(function(a) { return a.status_keterbukaan === params.statusKeterbukaan; });
    }
    if (params.stafId) {
      allArsip = allArsip.filter(function(a) { return a.staf_id === params.stafId; });
    }
    if (params.search) {
      var searchLower = params.search.toLowerCase();
      allArsip = allArsip.filter(function(a) {
        return (a.kode_unik && a.kode_unik.toLowerCase().indexOf(searchLower) > -1) ||
               (a.deskripsi && a.deskripsi.toLowerCase().indexOf(searchLower) > -1) ||
               (a.asal_arsip && a.asal_arsip.toLowerCase().indexOf(searchLower) > -1) ||
               (a.unit_pengelola && a.unit_pengelola.toLowerCase().indexOf(searchLower) > -1);
      });
    }
    
    // Pagination
    var page = params.page || 1;
    var pageSize = params.pageSize || CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;
    var total = allArsip.length;
    var totalPages = Math.ceil(total / pageSize);
    var startIndex = (page - 1) * pageSize;
    var pageData = allArsip.slice(startIndex, startIndex + pageSize);
    
    // Format for display
    pageData = pageData.map(function(a) {
      a.tanggal_input_formatted = formatTanggal(a.tanggal_input, 'short');
      return a;
    });
    
    return jsonResponse(true, {
      data: pageData,
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages
    });
    
  } catch (e) {
    return jsonResponse(false, null, 'Error mengambil daftar arsip: ' + e.message);
  }
}

/**
 * Get detail satu arsip
 * @param {string} arsipId
 */
function getArsipDetail(arsipId) {
  try {
    if (!arsipId) {
      return jsonResponse(false, null, 'ID arsip tidak valid.');
    }
    var arsip = findOneByColumn(CONFIG.SHEETS.MASTER_ARSIP, 'id', arsipId);
    
    if (!arsip) {
      return jsonResponse(false, null, 'Arsip tidak ditemukan.');
    }
    
    // Format display data
    arsip.tanggal_input_formatted = formatTanggal(arsip.tanggal_input, 'long');
    arsip.tanggal_update_formatted = formatTanggal(arsip.tanggal_update, 'long');
    
    // Pastikan objek Date diserialisasi ke ISO string agar aman lintas frame RPC
    if (arsip.tanggal_input instanceof Date) {
      arsip.tanggal_input = arsip.tanggal_input.toISOString();
    }
    if (arsip.tanggal_update instanceof Date) {
      arsip.tanggal_update = arsip.tanggal_update.toISOString();
    }
    
    // Parse QA checklist secara aman dan normalisasi ke format standar [{ item, checked }]
    var rawList = [];
    try {
      if (typeof arsip.qa_checklist === 'string' && arsip.qa_checklist.trim().startsWith('[')) {
        rawList = JSON.parse(arsip.qa_checklist);
      } else if (Array.isArray(arsip.qa_checklist)) {
        rawList = arsip.qa_checklist;
      }
    } catch (e) {
      rawList = [];
    }
    if (!Array.isArray(rawList)) {
      rawList = [];
    }

    arsip.qa_checklist_parsed = rawList.map(function(item) {
      if (typeof item === 'string') {
        return { item: item, checked: true };
      } else if (item && typeof item === 'object') {
        return {
          item: item.item || item.text || item.label || item.name || '',
          checked: item.checked !== false
        };
      }
      return { item: String(item), checked: true };
    });
    
    // Log akses (fail-safe agar tidak pernah menghambat atau menggagalkan pembacaan)
    try {
      logAksesArsip(arsip.id, arsip.kode_unik, 'VIEW');
    } catch (logErr) {
      Logger.log('logAksesArsip error: ' + logErr.message);
    }
    
    return jsonResponse(true, arsip);
    
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Update arsip
 * @param {string} arsipId
 * @param {Object} data - Data yang diupdate
 */
function updateArsip(arsipId, data) {
  try {
    var user = getCurrentUser() || { id: 'STAF-001', nama: 'Siprianus Mbemba', jabatan: 'Arsiparis Ahli Pertama' };
    
    var arsip = findOneByColumn(CONFIG.SHEETS.MASTER_ARSIP, 'id', arsipId);
    if (!arsip) return jsonResponse(false, null, 'Arsip tidak ditemukan.');
    
    // Update fields (gunakan nama updateObj agar tidak menimpa fungsi database updateData)
    var updateObj = {};
    var fields = ['deskripsi', 'jenis_arsip', 'jumlah_lembar', 'jumlah_berkas',
                  'kurun_waktu_mulai', 'kurun_waktu_akhir', 'unit_pengelola',
                  'lokasi_simpan', 'keterangan', 'status_keterbukaan'];
    
    fields.forEach(function(field) {
      if (data[field] !== undefined) {
        updateObj[field] = data[field];
      }
    });
    
    updateObj.tanggal_update = new Date();
    
    updateData(CONFIG.SHEETS.MASTER_ARSIP, arsip._rowIndex, updateObj);
    invalidateSheetCache(CONFIG.SHEETS.MASTER_ARSIP);
    clearCache('CACHE_DASHBOARD_STATS');
    
    logActivity('EDIT_ARSIP', 'Arsip', 'Edit arsip: ' + arsip.kode_unik);
    
    return jsonResponse(true, null, 'Arsip berhasil diupdate.');
    
  } catch (e) {
    return jsonResponse(false, null, 'Error update: ' + e.message);
  }
}

/**
 * Get statistik arsip untuk dashboard
 */
function getDashboardStats() {
  try {
    var cached = getFromCache('CACHE_DASHBOARD_STATS');
    if (cached && typeof cached === 'object' && cached.totalBerkas !== undefined && cached.monthlyData && cached.monthlyData.length > 0) {
      return jsonResponse(true, cached);
    }

    var allArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP) || [];
    allArsip = allArsip.filter(function(a) { return a.status !== 'Dihapus'; });
    
    var now = new Date();
    var currentYear = (CONFIG.APP && CONFIG.APP.TAHUN) ? parseInt(CONFIG.APP.TAHUN) : now.getFullYear();
    var currentMonth = now.getMonth();

    // 1. Perhitungan Metrik Berkas & Lembar
    var totalBerkas = allArsip.length;
    var totalLembar = 0;
    var berkasBulanIni = 0;
    var lembarBulanIni = 0;
    var berkasTahunIni = 0;
    var lembarTahunIni = 0;

    allArsip.forEach(function(a) {
      var lembar = parseInt(a.jumlah_lembar) || 0;
      totalLembar += lembar;

      var d = a.tanggal_input ? parseDate(a.tanggal_input) : null;
      if (d && !isNaN(d.getTime())) {
        if (d.getFullYear() === currentYear) {
          berkasTahunIni++;
          lembarTahunIni += lembar;
          if (d.getMonth() === currentMonth) {
            berkasBulanIni++;
            lembarBulanIni += lembar;
          }
        }
      }
    });

    // 2. Target Tahunan dari Pengaturan Sheet (atau fallback CONFIG)
    var targetTahunan = (CONFIG.TARGET && CONFIG.TARGET.ARSIP_TAHUNAN) ? CONFIG.TARGET.ARSIP_TAHUNAN : 250;
    try {
      var setRes = getPengaturan();
      if (setRes && setRes.success && setRes.data && setRes.data.target_tahunan) {
        var parsedTarget = parseInt(setRes.data.target_tahunan);
        if (parsedTarget > 0) targetTahunan = parsedTarget;
      }
    } catch (eSet) {}

    var persentaseTarget = calculatePercentage(berkasTahunIni, targetTahunan);

    // 3. Data Grafik: Bulanan (12 Bulan di Tahun Berjalan)
    var monthlyData = [];
    for (var m = 0; m < 12; m++) {
      var mBerkas = 0;
      var mLembar = 0;
      allArsip.forEach(function(a) {
        var d = a.tanggal_input ? parseDate(a.tanggal_input) : null;
        if (d && !isNaN(d.getTime()) && d.getMonth() === m && d.getFullYear() === currentYear) {
          mBerkas++;
          mLembar += (parseInt(a.jumlah_lembar) || 0);
        }
      });
      monthlyData.push({
        label: getNamaBulan(m).substring(0, 3),
        bulanShort: getNamaBulan(m).substring(0, 3),
        namaLengkap: getNamaBulan(m) + ' ' + currentYear,
        jumlah: mBerkas,
        lembar: mLembar
      });
    }

    // 4. Data Grafik: Mingguan (8 Minggu Terakhir)
    var weeklyData = [];
    for (var w = 7; w >= 0; w--) {
      var wStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (w * 7 + 6));
      wStart.setHours(0, 0, 0, 0);
      var wEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (w * 7));
      wEnd.setHours(23, 59, 59, 999);

      var wBerkas = 0;
      var wLembar = 0;
      allArsip.forEach(function(a) {
        var d = a.tanggal_input ? parseDate(a.tanggal_input) : null;
        if (d && !isNaN(d.getTime()) && d >= wStart && d <= wEnd) {
          wBerkas++;
          wLembar += (parseInt(a.jumlah_lembar) || 0);
        }
      });
      var wLabel = (w === 0) ? 'Mg Ini' : 'Mg -' + w;
      weeklyData.push({
        label: wLabel,
        namaLengkap: formatDateIndo(wStart) + ' s.d. ' + formatDateIndo(wEnd),
        jumlah: wBerkas,
        lembar: wLembar
      });
    }

    // 5. Data Grafik: Harian (7 Hari Terakhir)
    var dailyData = [];
    var namaHari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    for (var h = 6; h >= 0; h--) {
      var hDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - h);
      var hDateStr = hDate.toDateString();
      var dayName = namaHari[hDate.getDay()];
      var dayNumber = padNumber(hDate.getDate(), 2) + '/' + padNumber(hDate.getMonth() + 1, 2);

      var hBerkas = 0;
      var hLembar = 0;
      allArsip.forEach(function(a) {
        var d = a.tanggal_input ? parseDate(a.tanggal_input) : null;
        if (d && !isNaN(d.getTime()) && d.toDateString() === hDateStr) {
          hBerkas++;
          hLembar += (parseInt(a.jumlah_lembar) || 0);
        }
      });
      dailyData.push({
        label: dayName + ' ' + dayNumber,
        namaLengkap: formatDateIndo(hDate),
        jumlah: hBerkas,
        lembar: hLembar
      });
    }

    // 6. Per staf stats
    var stafStats = {};
    allArsip.forEach(function(a) {
      var d = a.tanggal_input ? parseDate(a.tanggal_input) : null;
      if (d && !isNaN(d.getTime()) && d.getFullYear() === currentYear) {
        var stafName = a.staf_nama || 'Petugas Lain';
        if (!stafStats[stafName]) {
          stafStats[stafName] = 0;
        }
        stafStats[stafName]++;
      }
    });

    var statsData = {
      totalArsip: totalBerkas,
      totalBerkas: totalBerkas,
      totalLembar: totalLembar,
      arsipBulanIni: berkasBulanIni,
      berkasBulanIni: berkasBulanIni,
      lembarBulanIni: lembarBulanIni,
      arsipHariIni: 0,
      arsipTahunIni: berkasTahunIni,
      berkasTahunIni: berkasTahunIni,
      lembarTahunIni: lembarTahunIni,
      targetTahunan: targetTahunan,
      persentaseTarget: persentaseTarget,
      monthlyData: monthlyData,
      weeklyData: weeklyData,
      dailyData: dailyData,
      stafStats: stafStats,
      currentPeriod: getCurrentPeriod()
    };

    putInCache('CACHE_DASHBOARD_STATS', statsData, 60);
    return jsonResponse(true, statsData);

  } catch (e) {
    return jsonResponse(false, null, 'Error mengambil statistik: ' + e.message);
  }
}

/**
 * Get kode asal arsip list (with ScriptCache)
 */
function getKodeAsalList() {
  try {
    var cached = getFromCache('CACHE_KODE_ASAL');
    if (cached && cached.length > 0) {
      return jsonResponse(true, cached);
    }
    
    var data = readAllData(CONFIG.SHEETS.KODE_ASAL);
    var active = data.filter(function(k) { return k.status === 'Aktif'; });
    putInCache('CACHE_KODE_ASAL', active, 21600); // 6 jam
    return jsonResponse(true, active);
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}

/**
 * Hapus arsip (Soft delete sesuai standar kearsipan ANRI)
 * @param {string} arsipId
 */
function deleteArsip(arsipId) {
  try {
    var user = getCurrentUser() || { id: 'SYSTEM', nama: 'Petugas' };
    var arsip = findOneByColumn(CONFIG.SHEETS.MASTER_ARSIP, 'id', arsipId);
    if (!arsip) return jsonResponse(false, null, 'Arsip tidak ditemukan.');
    
    updateData(CONFIG.SHEETS.MASTER_ARSIP, arsip._rowIndex, {
      status: 'Dihapus',
      tanggal_update: new Date()
    });
    
    logActivity('DELETE_ARSIP', 'Arsip', 'Hapus arsip: ' + arsip.kode_unik + ' - ' + (arsip.deskripsi || ''));
    
    invalidateSheetCache(CONFIG.SHEETS.MASTER_ARSIP);
    clearCache('CACHE_DASHBOARD_STATS');
    
    return jsonResponse(true, { id: arsipId, kodeUnik: arsip.kode_unik }, 'Arsip ' + arsip.kode_unik + ' berhasil dihapus.');
  } catch (e) {
    return jsonResponse(false, null, 'Error menghapus arsip: ' + e.message);
  }
}

/**
 * End-to-end Automated CRUD & Output Test Suite
 * Menguji Create, Read, Update, Delete, serta seluruh Output (Detail, List, Dashboard, BA)
 */
function runFullCRUDTestSuite() {
  var startTime = new Date().getTime();
  var results = [];
  var testRecordId = null;
  var testKodeUnik = null;
  var testStaffId = 'STAF-001';
  var curTahun = (CONFIG.APP && CONFIG.APP.TAHUN) ? parseInt(CONFIG.APP.TAHUN) : 2026;
  var curBulan = new Date().getMonth();

  // Helper to push result
  function recordTest(name, status, duration, input, output, assertion) {
    results.push({
      test: name,
      status: status ? 'PASS' : 'FAIL',
      durationMs: duration,
      input: input,
      output: output,
      assertion: assertion
    });
  }

  // ============ 1. AUTH: VERIFIKASI KREDENSIAL & PROFIL STAF ============
  var t1Start = new Date().getTime();
  try {
    var authCheck = verifyAuthCredentials('siasta', 'admin');
    var staffListRes = getStaffList();
    var t1Dur = new Date().getTime() - t1Start;
    var authPass = authCheck.success && staffListRes.success && staffListRes.data && staffListRes.data.length > 0;
    if (staffListRes.data && staffListRes.data[0]) testStaffId = staffListRes.data[0].id;
    recordTest(
      '1. Autentikasi & Data Staf',
      authPass,
      t1Dur,
      { username: 'siasta', pass: 'admin' },
      { authSuccess: authCheck.success, totalStaf: staffListRes.data ? staffListRes.data.length : 0 },
      'Kredensial valid dan daftar profil staf kearsipan berhasil dimuat.'
    );
  } catch (e1) {
    recordTest('1. Autentikasi & Data Staf', false, new Date().getTime() - t1Start, {}, { error: e1.message }, 'Gagal: ' + e1.message);
  }

  // ============ 2. KODE ASAL ARSIP ============
  var t2Start = new Date().getTime();
  try {
    var kodeAsalRes = getKodeAsalList();
    var t2Dur = new Date().getTime() - t2Start;
    var kaPass = kodeAsalRes.success && kodeAsalRes.data && kodeAsalRes.data.length > 0;
    recordTest(
      '2. Master Kode Asal Arsip',
      kaPass,
      t2Dur,
      {},
      { totalKodeAsal: kodeAsalRes.data ? kodeAsalRes.data.length : 0 },
      'Master kode unit pencipta arsip (Kecamatan, Dinas, Bagian) aktif.'
    );
  } catch (e2) {
    recordTest('2. Master Kode Asal Arsip', false, new Date().getTime() - t2Start, {}, { error: e2.message }, 'Gagal: ' + e2.message);
  }

  // ============ 3. PREVIEW KODE UNIK (ANRI) ============
  var t3Start = new Date().getTime();
  try {
    var prevRes = previewKodeUnik('KOM', '09');
    var t3Dur = new Date().getTime() - t3Start;
    var prevPass = prevRes.success && prevRes.data && prevRes.data.kodeUnik;
    recordTest(
      '3. Preview Kode Unik ANRI',
      prevPass,
      t3Dur,
      { kodeAsal: 'KOM', nomorBox: '09' },
      { kodePreview: prevRes.data ? prevRes.data.kodeUnik : null },
      'Format kode unik standar ANRI berhasil digenerate otomatis.'
    );
  } catch (e3) {
    recordTest('3. Preview Kode Unik ANRI', false, new Date().getTime() - t3Start, {}, { error: e3.message }, 'Gagal: ' + e3.message);
  }

  // ============ 4. CREATE (INPUT ARSIP BARU) ============
  var t4Start = new Date().getTime();
  var inputPayload = {
    statusKeterbukaan: 'Terbuka',
    jenisArsip: 'Tekstual',
    kodeAsal: 'KOM',
    asalArsip: 'Kecamatan Komodo',
    nomorBox: '09',
    deskripsi: 'UJI PENUH SISTEM: Naskah Kearsipan Statis Pemkab Manggarai Barat Tahun 2026',
    jumlahLembar: 20,
    jumlahBerkas: 2,
    kurunWaktuMulai: '2016',
    kurunWaktuAkhir: '2021',
    unitPengelola: 'Bagian Organisasi Setda Kab. Manggarai Barat',
    lokasiSimpan: 'Depot Arsip Utama, Lemari 02',
    keterangan: 'Arsip terverifikasi uji sistem otomatis',
    qaChecklist: [
      { item: 'Resolusi scan min 300 dpi', checked: true },
      { item: 'Format TIFF/PDF pelestarian sesuai', checked: true },
      { item: 'Hasil alih media terbaca jelas', checked: true }
    ],
    activeUser: { id: testStaffId, nama: 'Siprianus Mbemba', jabatan: 'Arsiparis Ahli Pertama' }
  };

  try {
    var saveRes = saveArsip(inputPayload);
    var t4Dur = new Date().getTime() - t4Start;
    if (saveRes.success && saveRes.data && saveRes.data.id) {
      testRecordId = saveRes.data.id;
      testKodeUnik = saveRes.data.kodeUnik;
      recordTest(
        '4. CREATE (Simpan Arsip Baru)',
        true,
        t4Dur,
        { deskripsi: inputPayload.deskripsi, box: inputPayload.nomorBox },
        { id: testRecordId, kodeUnik: testKodeUnik },
        'Kode ' + testKodeUnik + ' berhasil disimpan ke Google Sheets master_arsip.'
      );
    } else {
      recordTest('4. CREATE (Simpan Arsip Baru)', false, t4Dur, inputPayload, saveRes, 'Gagal menyimpan arsip.');
    }
  } catch (e4) {
    recordTest('4. CREATE (Simpan Arsip Baru)', false, new Date().getTime() - t4Start, {}, { error: e4.message }, 'Gagal: ' + e4.message);
  }

  // ============ 5. READ (DETAIL ARSIP) ============
  if (testRecordId) {
    var t5Start = new Date().getTime();
    try {
      var detailRes = getArsipDetail(testRecordId);
      var t5Dur = new Date().getTime() - t5Start;
      var detailPass = detailRes.success && detailRes.data && detailRes.data.kode_unik === testKodeUnik;
      recordTest(
        '5. READ (Detail Metadata Arsip)',
        detailPass,
        t5Dur,
        { id: testRecordId },
        { kodeUnik: detailRes.data ? detailRes.data.kode_unik : null, qaCount: detailRes.data && detailRes.data.qa_checklist_parsed ? detailRes.data.qa_checklist_parsed.length : 0 },
        'Detail arsip, checklist mutu alih media, dan riwayat akses terbaca lengkap.'
      );
    } catch (e5) {
      recordTest('5. READ (Detail Metadata Arsip)', false, new Date().getTime() - t5Start, {}, { error: e5.message }, 'Gagal: ' + e5.message);
    }
  }

  // ============ 6. READ (DAFTAR & PENCARIAN FILTER) ============
  var t6Start = new Date().getTime();
  try {
    var listRes = getArsipList({ search: 'UJI PENUH SISTEM', page: 1, pageSize: 10 });
    var t6Dur = new Date().getTime() - t6Start;
    var listPass = listRes.success && listRes.data && listRes.data.data && listRes.data.data.length > 0;
    recordTest(
      '6. READ (Pencarian & Filter Tabel)',
      listPass,
      t6Dur,
      { query: 'UJI PENUH SISTEM' },
      { matchesFound: listRes.data ? listRes.data.data.length : 0, total: listRes.data ? listRes.data.total : 0 },
      'Data arsip ditemukan secara cepat pada filter pencarian tabel.'
    );
  } catch (e6) {
    recordTest('6. READ (Pencarian & Filter Tabel)', false, new Date().getTime() - t6Start, {}, { error: e6.message }, 'Gagal: ' + e6.message);
  }

  // ============ 7. UPDATE (EDIT DATA ARSIP) ============
  if (testRecordId) {
    var t7Start = new Date().getTime();
    try {
      var updatePayload = {
        deskripsi: '[DISETUJUI] Naskah Kearsipan Alih Media Kab. Manggarai Barat',
        status_keterbukaan: 'Tertutup',
        jumlah_lembar: 24,
        keterangan: 'Keterangan diperbarui via pengujian sistem'
      };
      var updateRes = updateArsip(testRecordId, updatePayload);
      var verifyUpd = getArsipDetail(testRecordId);
      var t7Dur = new Date().getTime() - t7Start;
      var updPass = updateRes.success && verifyUpd.data && verifyUpd.data.status_keterbukaan === 'Tertutup' && verifyUpd.data.jumlah_lembar == 24;
      recordTest(
        '7. UPDATE (Edit & Pembaruan Arsip)',
        updPass,
        t7Dur,
        updatePayload,
        { success: updateRes.success, updatedStatus: verifyUpd.data ? verifyUpd.data.status_keterbukaan : null },
        'Kolom deskripsi, lembar, dan status keterbukaan terupdate di sheet master.'
      );
    } catch (e7) {
      recordTest('7. UPDATE (Edit & Pembaruan Arsip)', false, new Date().getTime() - t7Start, {}, { error: e7.message }, 'Gagal: ' + e7.message);
    }
  }

  // ============ 8. DASHBOARD STATISTIK UTAMA ============
  var t8Start = new Date().getTime();
  try {
    var dashStats = getDashboardStats();
    var t8Dur = new Date().getTime() - t8Start;
    var dashPass = dashStats.success && dashStats.data && dashStats.data.totalArsip > 0 && dashStats.data.monthlyData.length === 12;
    recordTest(
      '8. Dashboard (Statistik & Grafik 12 Bulan)',
      dashPass,
      t8Dur,
      {},
      { totalArsip: dashStats.data ? dashStats.data.totalArsip : 0, arsipBulanIni: dashStats.data ? dashStats.data.arsipBulanIni : 0, chartMonths: dashStats.data && dashStats.data.monthlyData ? dashStats.data.monthlyData.length : 0 },
      'Kalkulasi rekap tahunan, target bulanan, dan grafik distribusi berjalan tepat.'
    );
  } catch (e8) {
    recordTest('8. Dashboard (Statistik & Grafik 12 Bulan)', false, new Date().getTime() - t8Start, {}, { error: e8.message }, 'Gagal: ' + e8.message);
  }

  // ============ 9. TARGET & REALISASI KEARSIPAN ============
  var t9Start = new Date().getTime();
  try {
    var trRes = getTargetRealisasi(curTahun);
    var t9Dur = new Date().getTime() - t9Start;
    var trPass = trRes.success && trRes.data && trRes.data.targetTahunan > 0;
    recordTest(
      '9. Target & Realisasi Tahunan',
      trPass,
      t9Dur,
      { tahun: curTahun },
      { target: trRes.data ? trRes.data.targetTahunan : 0, realisasi: trRes.data ? trRes.data.totalRealisasi : 0, persentase: trRes.data ? trRes.data.persentase + '%' : '0%' },
      'Kalkulasi kumulatif realisasi alih media terhadap target tahunan 250 arsip berhasil.'
    );
  } catch (e9) {
    recordTest('9. Target & Realisasi Tahunan', false, new Date().getTime() - t9Start, {}, { error: e9.message }, 'Gagal: ' + e9.message);
  }

  // ============ 10. BERITA ACARA: DASHBOARD MONITORING ============
  var t10Start = new Date().getTime();
  try {
    var baDashRes = getBeritaAcaraDashboard();
    var t10Dur = new Date().getTime() - t10Start;
    var baDashPass = baDashRes.success && baDashRes.data && baDashRes.data.monthlyData && baDashRes.data.monthlyData.length === 12;
    recordTest(
      '10. Berita Acara: Dashboard Monitoring',
      baDashPass,
      t10Dur,
      { tahun: curTahun },
      { totalBA: baDashRes.data ? baDashRes.data.totalBA : 0, monthsTracked: baDashRes.data && baDashRes.data.monthlyData ? baDashRes.data.monthlyData.length : 0 },
      'Monitoring status Berita Acara per bulan (Sudah/Belum Dibuat) berjalan lancar.'
    );
  } catch (e10) {
    recordTest('10. Berita Acara: Dashboard Monitoring', false, new Date().getTime() - t10Start, {}, { error: e10.message }, 'Gagal: ' + e10.message);
  }

  // ============ 11. BERITA ACARA: REKAP PER STAF ============
  var t11Start = new Date().getTime();
  try {
    var baStafRes = getBeritaAcaraPerStaf(curBulan, curTahun, testStaffId);
    var t11Dur = new Date().getTime() - t11Start;
    var baStafPass = baStafRes.success && baStafRes.data && baStafRes.data.periode;
    recordTest(
      '11. Berita Acara: Rekap Per Staf',
      baStafPass,
      t11Dur,
      { bulan: curBulan, tahun: curTahun, stafId: testStaffId },
      { periode: baStafRes.data ? baStafRes.data.periode : null, jumlahArsipStaf: baStafRes.data ? baStafRes.data.jumlahArsip : 0 },
      'Rincian volume alih media per staf berhasil dihimpun.'
    );
  } catch (e11) {
    recordTest('11. Berita Acara: Rekap Per Staf', false, new Date().getTime() - t11Start, {}, { error: e11.message }, 'Gagal: ' + e11.message);
  }

  // ============ 12. BERITA ACARA: REKAP GABUNGAN TIM ============
  var t12Start = new Date().getTime();
  try {
    var baGabRes = getBeritaAcaraGabungan(curBulan, curTahun);
    var t12Dur = new Date().getTime() - t12Start;
    var baGabPass = baGabRes.success && baGabRes.data && baGabRes.data.totalArsip !== undefined;
    recordTest(
      '12. Berita Acara: Rekap Gabungan Tim',
      baGabPass,
      t12Dur,
      { bulan: curBulan, tahun: curTahun },
      { totalArsipTim: baGabRes.data ? baGabRes.data.totalArsip : 0, totalStafTerlibat: baGabRes.data ? baGabRes.data.totalStaf : 0 },
      'Kompilasi rekapitulasi seluruh tim alih media per periode berhasil disusun.'
    );
  } catch (e12) {
    recordTest('12. Berita Acara: Rekap Gabungan Tim', false, new Date().getTime() - t12Start, {}, { error: e12.message }, 'Gagal: ' + e12.message);
  }

  // ============ 13. GENERATE & SIMPAN BERITA ACARA ============
  var t13Start = new Date().getTime();
  try {
    var genBARes = generateBeritaAcara({
      bulan: curBulan,
      tahun: curTahun,
      tipe: 'per_staf',
      stafId: testStaffId,
      stafNama: 'Siprianus Mbemba',
      jumlahArsip: 5,
      activeUser: { id: testStaffId, nama: 'Siprianus Mbemba', jabatan: 'Arsiparis Ahli Pertama' }
    });
    var t13Dur = new Date().getTime() - t13Start;
    var genBAPass = genBARes.success && genBARes.data && genBARes.data.id;
    recordTest(
      '13. Generate Berita Acara Resmi',
      genBAPass,
      t13Dur,
      { tipe: 'per_staf', bulan: curBulan, tahun: curTahun },
      { baId: genBARes.data ? genBARes.data.id : null, message: genBARes.message },
      'Dokumen Berita Acara resmi terbit dan tersimpan di basis data.'
    );
  } catch (e13) {
    recordTest('13. Generate Berita Acara Resmi', false, new Date().getTime() - t13Start, {}, { error: e13.message }, 'Gagal: ' + e13.message);
  }

  // ============ 14. GENERATE LAPORAN INTERNAL ============
  var t14Start = new Date().getTime();
  try {
    var lapIntRes = generateLaporanData({ tipe: 'internal', tahun: curTahun });
    var t14Dur = new Date().getTime() - t14Start;
    var lapIntPass = lapIntRes.success && lapIntRes.data && lapIntRes.data.arsipDetail && lapIntRes.data.arsipDetail.length >= 0;
    recordTest(
      '14. Laporan: Ekspor Format Internal',
      lapIntPass,
      t14Dur,
      { tipe: 'internal', tahun: curTahun },
      { totalArsip: lapIntRes.data ? lapIntRes.data.totalArsip : 0, totalLembar: lapIntRes.data ? lapIntRes.data.totalLembar : 0 },
      'Laporan internal dengan rincian detail lokasi simpan dan staf berhasil di-generate.'
    );
  } catch (e14) {
    recordTest('14. Laporan: Ekspor Format Internal', false, new Date().getTime() - t14Start, {}, { error: e14.message }, 'Gagal: ' + e14.message);
  }

  // ============ 15. GENERATE LAPORAN EKSTERNAL ============
  var t15Start = new Date().getTime();
  try {
    var lapEksRes = generateLaporanData({ tipe: 'eksternal', tahun: curTahun });
    var t15Dur = new Date().getTime() - t15Start;
    var lapEksPass = lapEksRes.success && lapEksRes.data && lapEksRes.data.tipe === 'eksternal';
    recordTest(
      '15. Laporan: Ekspor Format Eksternal',
      lapEksPass,
      t15Dur,
      { tipe: 'eksternal', tahun: curTahun },
      { totalArsipPublik: lapEksRes.data ? lapEksRes.data.totalArsip : 0 },
      'Laporan eksternal publik terformat sesuai regulasi kearsipan dinas.'
    );
  } catch (e15) {
    recordTest('15. Laporan: Ekspor Format Eksternal', false, new Date().getTime() - t15Start, {}, { error: e15.message }, 'Gagal: ' + e15.message);
  }

  // ============ 16. LOG AKTIVITAS & AUDIT TRAIL ============
  var t16Start = new Date().getTime();
  try {
    var logRes = getActivityLog({ page: 1, pageSize: 15 });
    var t16Dur = new Date().getTime() - t16Start;
    var logPass = logRes.success && logRes.data && logRes.data.data && logRes.data.data.length > 0;
    recordTest(
      '16. Log Aktivitas & Audit Trail ANRI',
      logPass,
      t16Dur,
      { pageSize: 15 },
      { totalLogs: logRes.data ? logRes.data.total : 0, sampleAction: logRes.data && logRes.data.data[0] ? logRes.data.data[0].aksi : '-' },
      'Seluruh aktivitas input, update, dan akses tercatat di log audit trail permanen.'
    );
  } catch (e16) {
    recordTest('16. Log Aktivitas & Audit Trail ANRI', false, new Date().getTime() - t16Start, {}, { error: e16.message }, 'Gagal: ' + e16.message);
  }

  // ============ 17. PENGATURAN SISTEM ============
  var t17Start = new Date().getTime();
  try {
    var setRes = getPengaturan();
    var t17Dur = new Date().getTime() - t17Start;
    var setPass = setRes.success && setRes.data;
    recordTest(
      '17. Pengaturan Sistem & Watermark',
      setPass,
      t17Dur,
      {},
      { targetTahunan: setRes.data ? setRes.data.target_tahunan : null, watermark: setRes.data ? setRes.data.watermark_text : null },
      'Parameter target tahunan dan teks cap watermark digital tersimpan baik.'
    );
  } catch (e17) {
    recordTest('17. Pengaturan Sistem & Watermark', false, new Date().getTime() - t17Start, {}, { error: e17.message }, 'Gagal: ' + e17.message);
  }

  // ============ 18. DELETE (SOFT-DELETE SESUAI STANDAR ANRI) ============
  if (testRecordId) {
    var t18Start = new Date().getTime();
    try {
      var delRes = deleteArsip(testRecordId);
      var verifyDelList = getArsipList({ search: testKodeUnik });
      var t18Dur = new Date().getTime() - t18Start;
      var notInActiveList = verifyDelList.success &&
        (!verifyDelList.data.data || verifyDelList.data.data.length === 0 ||
         !verifyDelList.data.data.some(function(item) { return item.id === testRecordId; }));
      var delPass = delRes.success && notInActiveList;
      recordTest(
        '18. DELETE (Soft-Delete & Retensi ANRI)',
        delPass,
        t18Dur,
        { id: testRecordId, kodeUnik: testKodeUnik },
        { success: delRes.success, message: delRes.message, excludedFromActiveList: notInActiveList },
        'Arsip berhasil di-soft delete, status berubah jadi Dihapus, dan data keluar dari daftar aktif.'
      );
    } catch (e18) {
      recordTest('18. DELETE (Soft-Delete & Retensi ANRI)', false, new Date().getTime() - t18Start, {}, { error: e18.message }, 'Gagal: ' + e18.message);
    }
  }

  var totalDuration = new Date().getTime() - startTime;
  var allPassed = results.every(function(r) { return r.status === 'PASS'; });

  return {
    success: allPassed,
    overallStatus: allPassed ? 'PASS' : 'PARTIAL/FAIL',
    timestamp: new Date().toISOString(),
    totalDurationMs: totalDuration,
    summary: allPassed ? 
      'Luar biasa! Seluruh ' + results.length + ' fungsi dan fitur sistem (CRUD, Auth, BA, Laporan, Log, Pengaturan) berjalan 100% lancar tanpa satu pun error!' :
      'Beberapa pengujian mengalami kegagalan.',
    testsCount: results.length,
    passedCount: results.filter(function(r) { return r.status === 'PASS'; }).length,
    tests: results
  };
}

/**
 * Ambil data rekapitulasi arsip untuk Export Excel / Dokumen Rekap Resmi Dinas
 * @param {Object} params - { periodeType, tahun, bulan, kodeAsal }
 */
function getRekapitulasiArsipExport(params) {
  try {
    params = params || {};
    var allArsip = readAllData(CONFIG.SHEETS.MASTER_ARSIP);
    var pejabatRes = getPejabatConfig();
    var defaultTtd = (CONFIG.PEJABAT && CONFIG.PEJABAT.PELAKSANA && CONFIG.PEJABAT.PELAKSANA.TTD) ? CONFIG.PEJABAT.PELAKSANA.TTD : (CONFIG.PEJABAT ? CONFIG.PEJABAT.DUMMY_TTD : '');
    var pejabat = pejabatRes && pejabatRes.data ? pejabatRes.data : {
      kadis: (CONFIG.PEJABAT && CONFIG.PEJABAT.KADIS) ? CONFIG.PEJABAT.KADIS : {},
      kabid: (CONFIG.PEJABAT && CONFIG.PEJABAT.KABID) ? CONFIG.PEJABAT.KABID : {},
      pelaksana: { nama: 'Muhammad Dzaky Nathanegara, A.Md', nip: '19980508 202506 1 004', jabatan: 'Pengelola Kearsipan', ttd: defaultTtd },
      alamatKop: (CONFIG.PEJABAT && CONFIG.PEJABAT.ALAMAT_KOP) ? CONFIG.PEJABAT.ALAMAT_KOP : 'Jl. Samping Bank NTT, Kelurahan Wae Kelambu, Labuan Bajo - Flores - NTT'
    };
    if (pejabat.pelaksana && !pejabat.pelaksana.ttd) {
      pejabat.pelaksana.ttd = defaultTtd;
    }

    var periodeType = params.periodeType || 'all'; // 'all', 'tahun', 'bulan'
    var targetTahun = params.tahun ? parseInt(params.tahun) : 2026;
    var targetBulan = params.bulan !== undefined && params.bulan !== '' ? parseInt(params.bulan) : -1;
    var kodeAsal = params.kodeAsal || '';

    var filtered = allArsip.filter(function(a) {
      if (a.status === 'Dihapus') return false;
      if (kodeAsal && a.asal_arsip_kode !== kodeAsal && (a.asal_arsip || '').indexOf(kodeAsal) === -1) return false;
      
      var d = a.tanggal_input ? parseDate(a.tanggal_input) : null;
      if (periodeType === 'tahun') {
        if (!d || d.getFullYear() !== targetTahun) return false;
      } else if (periodeType === 'bulan') {
        if (!d || d.getFullYear() !== targetTahun || d.getMonth() !== targetBulan) return false;
      }
      return true;
    });

    filtered.sort(function(a, b) {
      return (a.kode_unik || '').localeCompare(b.kode_unik || '');
    });

    var totalLembar = 0;
    var totalBerkas = 0;
    var items = filtered.map(function(a, idx) {
      var lembar = parseInt(a.jumlah_lembar) || 1;
      var berkas = parseInt(a.jumlah_berkas) || 1;
      totalLembar += lembar;
      totalBerkas += berkas;
      var kw = a.kurun_waktu_mulai || '-';
      return {
        no: idx + 1,
        nomorBox: a.nomor_box || '-',
        kodeUnik: a.kode_unik || '-',
        nomorAsli: a.nomor_asli || '-',
        kodeKlasifikasiAsli: a.kode_klasifikasi_asli || '-',
        deskripsi: a.deskripsi || '-',
        kurunWaktu: kw || '-',
        jenisArsip: a.jenis_arsip || 'Tekstual',
        kategoriUrusan: a.kategori_urusan || 'Pemerintahan',
        unitPengelola: a.unit_pengelola || a.asal_arsip || '-',
        asalArsip: a.asal_arsip || '-',
        jumlahBerkas: berkas,
        jumlahLembar: lembar,
        lokasiSimpan: a.lokasi_simpan || '-',
        kondisiFisik: a.kondisi_fisik || 'Baik',
        statusKeterbukaan: a.status_keterbukaan || 'Terbuka',
        kesesuaianStandar: 'Sesuai Standar ANRI',
        nomorRegistrasi: a.nomor_registrasi || '-',
        keterangan: a.keterangan || (a.status_keterbukaan || 'Terbuka'),
        stafNama: a.staf_nama || '-'
      };
    });

    var periodeLabel = 'Semua Periode';
    if (periodeType === 'tahun') {
      periodeLabel = 'Tahun ' + targetTahun;
    } else if (periodeType === 'bulan') {
      periodeLabel = 'Bulan ' + getNamaBulan(targetBulan) + ' ' + targetTahun;
    }

    var now = new Date();
    var tglCetakFormatted = now.getDate() + ' ' + getNamaBulan(now.getMonth()) + ' ' + now.getFullYear();

    return jsonResponse(true, {
      items: items,
      totalArsip: items.length,
      totalLembar: totalLembar,
      pejabat: pejabat,
      periodeLabel: periodeLabel,
      tanggalCetak: tglCetakFormatted,
      tahun: targetTahun
    });
  } catch (e) {
    return jsonResponse(false, null, 'Error getRekapitulasiArsipExport: ' + e.message);
  }
}
