/**
 * =========================================
 * SIASTA - Database.gs
 * Generic CRUD operations for Google Sheets
 * =========================================
 */

// ============ IN-MEMORY RUNTIME DATA CACHE ============
var _runtimeDataCache = {};

/**
 * Membaca seluruh data dari sheet (dengan runtime in-memory caching)
 * @param {string} sheetName - Nama sheet
 * @returns {Array} Array of objects
 */
function readAllData(sheetName) {
  if (_runtimeDataCache[sheetName]) {
    return _runtimeDataCache[sheetName];
  }
  try {
    const sheet = getSheet(sheetName);
    if (!sheet || sheet.getLastRow() < 2) {
      _runtimeDataCache[sheetName] = [];
      return [];
    }
    const data = sheet.getDataRange().getValues();
    var objects = sheetDataToObjects(data);
    _runtimeDataCache[sheetName] = objects;
    return objects;
  } catch (e) {
    Logger.log('readAllData error on ' + sheetName + ': ' + e.message);
    return [];
  }
}

/**
 * Clear data cache (runtime + script cache)
 */
function invalidateSheetCache(sheetName) {
  if (sheetName) {
    delete _runtimeDataCache[sheetName];
    clearCache('CACHE_SHEET_' + sheetName);
  } else {
    _runtimeDataCache = {};
  }
}

/**
 * Membaca data dengan pagination
 * @param {string} sheetName
 * @param {number} page - Halaman (1-based)
 * @param {number} pageSize - Jumlah per halaman
 * @returns {Object} {data, total, page, pageSize, totalPages}
 */
function readPaginated(sheetName, page, pageSize) {
  page = page || 1;
  pageSize = pageSize || CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;
  
  const allData = readAllData(sheetName);
  const total = allData.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const data = allData.slice(startIndex, startIndex + pageSize);
  
  return {
    data: data,
    total: total,
    page: page,
    pageSize: pageSize,
    totalPages: totalPages
  };
}

/**
 * Menambahkan baris baru ke sheet
 * @param {string} sheetName
 * @param {Object} rowData - Object dengan key sesuai header
 * @returns {number} Row number yang ditambahkan
 */
function appendData(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  var lastCol = sheet.getLastColumn();
  var headers = [];
  
  // Penanganan aman jika sheet baru/kosong (0 kolom) untuk mencegah error "Jumlah kolom dalam rentang setidaknya harus 1"
  if (lastCol < 1) {
    var defaultHeadersMap = {
      'berita_acara': ['id', 'nomor_ba', 'bulan', 'tahun', 'tipe', 'staf_id', 'staf_nama', 'jumlah_arsip', 'waktu_pelaksanaan', 'tempat_pelaksanaan', 'jenis_media', 'file_id', 'file_url', 'status', 'tanggal_dibuat'],
      'master_arsip': ['id', 'kode_unik', 'status_keterbukaan', 'asal_arsip', 'kode_asal', 'nomor_box', 'nomor_urut', 'deskripsi', 'jenis_arsip', 'kategori_urusan', 'kode_klasifikasi_asli', 'nomor_asli', 'jumlah_lembar', 'jumlah_berkas', 'rangkap_ke', 'kondisi_fisik', 'kurun_waktu', 'unit_pengelola', 'lokasi_simpan', 'keterangan', 'file_pelestarian_id', 'file_akses_id', 'file_pelestarian_url', 'file_akses_url', 'waktu_unggah', 'qa_checklist', 'watermark_applied', 'staf_id', 'staf_nama', 'tanggal_input', 'tanggal_update', 'status'],
      'master_staf': ['id', 'nama', 'nip', 'jabatan', 'email', 'status', 'tanda_tangan_id', 'tanda_tangan_url', 'tanggal_dibuat'],
      'log_aktivitas': ['id', 'timestamp', 'staf_id', 'staf_nama', 'aksi', 'modul', 'detail', 'ip_address'],
      'pengaturan': ['key', 'value', 'deskripsi', 'tanggal_update'],
      'kode_asal_arsip': ['kode', 'nama', 'deskripsi', 'status']
    };

    var baseHeaders = defaultHeadersMap[sheetName] ? defaultHeadersMap[sheetName].slice() : [];
    if (baseHeaders.length === 0) {
      baseHeaders = Object.keys(rowData).filter(function(k) { return k && k !== '_rowIndex'; });
    } else {
      Object.keys(rowData).forEach(function(k) {
        if (k && k !== '_rowIndex' && baseHeaders.indexOf(k) === -1) {
          baseHeaders.push(k);
        }
      });
    }

    if (baseHeaders.length > 0) {
      sheet.appendRow(baseHeaders);
      try {
        var hRange = sheet.getRange(1, 1, 1, baseHeaders.length);
        hRange.setFontWeight('bold');
        hRange.setBackground('#1B2A4A');
        hRange.setFontColor('#FFFFFF');
        sheet.setFrozenRows(1);
      } catch (eH) {}
      headers = baseHeaders;
      lastCol = baseHeaders.length;
    }
  } else {
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }
  
  // Periksa apakah rowData memiliki kolom baru yang belum ada di sheet
  var missingCols = [];
  Object.keys(rowData).forEach(function(k) {
    if (k && k !== '_rowIndex' && headers.indexOf(k) === -1) {
      missingCols.push(k);
    }
  });
  if (missingCols.length > 0) {
    var startCol = headers.length + 1;
    sheet.getRange(1, startCol, 1, missingCols.length).setValues([missingCols]);
    try {
      var headerRange = sheet.getRange(1, startCol, 1, missingCols.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1B2A4A');
      headerRange.setFontColor('#FFFFFF');
    } catch (e) {}
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  
  const row = headers.map(function(header) {
    return rowData[header] !== undefined ? rowData[header] : '';
  });
  
  sheet.appendRow(row);
  invalidateSheetCache(sheetName);
  return sheet.getLastRow();
}

/**
 * Update baris berdasarkan row number
 * @param {string} sheetName
 * @param {number} rowNumber - Nomor baris (1-based)
 * @param {Object} rowData - Data yang diupdate
 */
function updateData(sheetName, rowNumber, rowData) {
  const sheet = getSheet(sheetName);
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  // Pastikan kolom yang diupdate sudah ada di header sheet
  var missingCols = [];
  Object.keys(rowData).forEach(function(k) {
    if (k && k !== '_rowIndex' && headers.indexOf(k) === -1) {
      missingCols.push(k);
    }
  });
  if (missingCols.length > 0) {
    var startCol = headers.length + 1;
    sheet.getRange(1, startCol, 1, missingCols.length).setValues([missingCols]);
    try {
      var headerRange = sheet.getRange(1, startCol, 1, missingCols.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1B2A4A');
      headerRange.setFontColor('#FFFFFF');
    } catch (e) {}
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  
  headers.forEach(function(header, colIndex) {
    if (rowData[header] !== undefined) {
      sheet.getRange(rowNumber, colIndex + 1).setValue(rowData[header]);
    }
  });
  invalidateSheetCache(sheetName);
}

/**
 * Cari data berdasarkan kolom dan nilai
 * @param {string} sheetName
 * @param {string} columnName - Nama kolom header
 * @param {*} value - Nilai yang dicari
 * @returns {Array} Array of matching objects
 */
function findByColumn(sheetName, columnName, value) {
  const allData = readAllData(sheetName);
  return allData.filter(function(row) {
    return row[columnName] == value;
  });
}

/**
 * Cari satu data berdasarkan kolom
 * @returns {Object|null}
 */
function findOneByColumn(sheetName, columnName, value) {
  const results = findByColumn(sheetName, columnName, value);
  return results.length > 0 ? results[0] : null;
}

/**
 * Cari data dengan multiple filter
 * @param {string} sheetName
 * @param {Object} filters - Object {columnName: value, ...}
 * @returns {Array}
 */
function findByFilters(sheetName, filters) {
  const allData = readAllData(sheetName);
  return allData.filter(function(row) {
    for (var key in filters) {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        if (row[key] != filters[key]) return false;
      }
    }
    return true;
  });
}

/**
 * Hapus baris (soft delete — set status)
 * @param {string} sheetName
 * @param {number} rowNumber
 * @param {string} statusColumn - Nama kolom status
 */
function softDelete(sheetName, rowNumber, statusColumn) {
  const update = {};
  update[statusColumn] = 'Dihapus';
  updateData(sheetName, rowNumber, update);
}

/**
 * Count data di sheet
 * @param {string} sheetName
 * @returns {number}
 */
function countData(sheetName) {
  const sheet = getSheet(sheetName);
  return Math.max(0, sheet.getLastRow() - 1); // minus header
}

/**
 * Count data berdasarkan filter
 */
function countByFilter(sheetName, columnName, value) {
  return findByColumn(sheetName, columnName, value).length;
}

/**
 * Get headers dari sheet
 */
function getHeaders(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet || sheet.getLastColumn() < 1) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

/**
 * Setup sheet dengan headers jika belum ada
 */
function setupSheetHeaders(sheetName, headers) {
  const sheet = getSheet(sheetName);
  if (!sheet || !headers || headers.length === 0) return;
  
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    sheet.appendRow(headers);
    try {
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1B2A4A');
      headerRange.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    } catch (e) {}
    return;
  }
  
  // Jika sheet sudah ada kolom, tambahkan kolom yang belum ada
  const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const missingHeaders = [];
  headers.forEach(function(h) {
    if (currentHeaders.indexOf(h) === -1) {
      missingHeaders.push(h);
    }
  });
  
  if (missingHeaders.length > 0) {
    const startCol = lastCol + 1;
    sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
    try {
      const headerRange = sheet.getRange(1, startCol, 1, missingHeaders.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1B2A4A');
      headerRange.setFontColor('#FFFFFF');
    } catch (e2) {}
    Logger.log('Migrated missing headers to ' + sheetName + ': ' + missingHeaders.join(', '));
    invalidateSheetCache(sheetName);
  }
}

/**
 * Sinkronisasi otomatis seluruh header database (dipanggil saat startup)
 */
function syncAllDatabaseHeaders() {
  try {
    // 1. Berita Acara
    setupSheetHeaders(CONFIG.SHEETS.BERITA_ACARA, [
      'id', 'nomor_ba', 'bulan', 'tahun', 'tipe', 'staf_id', 'staf_nama',
      'jumlah_arsip', 'waktu_pelaksanaan', 'tempat_pelaksanaan',
      'jenis_media', 'file_id', 'file_url', 'status', 'tanggal_dibuat'
    ]);

    // 2. Master Arsip
    setupSheetHeaders(CONFIG.SHEETS.MASTER_ARSIP, [
      'id', 'kode_unik', 'status_keterbukaan', 'asal_arsip', 'kode_asal',
      'nomor_box', 'nomor_urut', 'deskripsi', 'jenis_arsip', 'kategori_urusan',
      'kode_klasifikasi_asli', 'nomor_asli', 'jumlah_lembar', 'jumlah_berkas',
      'rangkap_ke', 'kondisi_fisik', 'kurun_waktu',
      'unit_pengelola', 'lokasi_simpan', 'keterangan',
      'file_pelestarian_id', 'file_akses_id', 'file_pelestarian_url', 'file_akses_url',
      'waktu_unggah', 'qa_checklist', 'watermark_applied',
      'staf_id', 'staf_nama', 'tanggal_input', 'tanggal_update', 'status'
    ]);

    // 3. Master Staf
    setupSheetHeaders(CONFIG.SHEETS.MASTER_STAF, [
      'id', 'nama', 'nip', 'jabatan', 'email', 'status',
      'tanda_tangan_id', 'tanda_tangan_url', 'tanggal_dibuat'
    ]);

    // 4. Log Aktivitas
    setupSheetHeaders(CONFIG.SHEETS.LOG_AKTIVITAS, [
      'id', 'timestamp', 'staf_id', 'staf_nama', 'aksi',
      'modul', 'detail', 'ip_address'
    ]);

    // 5. Pengaturan
    setupSheetHeaders(CONFIG.SHEETS.PENGATURAN, [
      'key', 'value', 'deskripsi', 'tanggal_update'
    ]);

    // 6. Kode Asal Arsip
    setupSheetHeaders(CONFIG.SHEETS.KODE_ASAL, [
      'kode', 'nama', 'deskripsi', 'status'
    ]);
  } catch (e) {
    Logger.log('syncAllDatabaseHeaders error: ' + e.message);
  }
}

/**
 * Initialize semua sheets dengan headers
 */
function initializeAllSheets() {
  // Master Arsip
  setupSheetHeaders(CONFIG.SHEETS.MASTER_ARSIP, [
    'id', 'kode_unik', 'status_keterbukaan', 'asal_arsip', 'kode_asal',
    'nomor_box', 'nomor_urut', 'deskripsi', 'jenis_arsip', 'kategori_urusan',
    'kode_klasifikasi_asli', 'nomor_asli', 'jumlah_lembar', 'jumlah_berkas',
    'rangkap_ke', 'kondisi_fisik', 'kurun_waktu',
    'unit_pengelola', 'lokasi_simpan', 'keterangan',
    'file_pelestarian_id', 'file_akses_id', 'file_pelestarian_url', 'file_akses_url',
    'waktu_unggah', 'qa_checklist', 'watermark_applied',
    'staf_id', 'staf_nama', 'tanggal_input', 'tanggal_update', 'status'
  ]);

  // Master Staf
  setupSheetHeaders(CONFIG.SHEETS.MASTER_STAF, [
    'id', 'nama', 'nip', 'jabatan', 'email', 'status',
    'tanda_tangan_id', 'tanda_tangan_url', 'tanggal_dibuat'
  ]);

  // Log Aktivitas
  setupSheetHeaders(CONFIG.SHEETS.LOG_AKTIVITAS, [
    'id', 'timestamp', 'staf_id', 'staf_nama', 'aksi',
    'modul', 'detail', 'ip_address'
  ]);

  // Berita Acara
  setupSheetHeaders(CONFIG.SHEETS.BERITA_ACARA, [
    'id', 'nomor_ba', 'bulan', 'tahun', 'tipe', 'staf_id', 'staf_nama',
    'jumlah_arsip', 'waktu_pelaksanaan', 'tempat_pelaksanaan',
    'jenis_media', 'file_id', 'file_url', 'status', 'tanggal_dibuat'
  ]);

  // Pengaturan
  setupSheetHeaders(CONFIG.SHEETS.PENGATURAN, [
    'key', 'value', 'deskripsi', 'tanggal_update'
  ]);

  // Kode Asal Arsip
  setupSheetHeaders(CONFIG.SHEETS.KODE_ASAL, [
    'kode', 'nama', 'deskripsi', 'status'
  ]);

  return 'Semua sheet aktif berhasil diinisialisasi!';
}

/**
 * Pembersihan Basis Data Terpadu:
 * 1. Menghapus 13 sheet tak terpakai / duplikat / kosong
 * 2. Membersihkan kolom wadah kosong pada master_arsip, pengaturan, dan kode_asal_arsip
 * 3. Mempertahankan 100% data riil pada 6 sheet utama aktif
 */
function executeCleanDatabaseStructure() {
  var ss = getSpreadsheet();
  var results = {
    status: 'success',
    deletedSheets: [],
    cleanedSheets: {},
    remainingSheets: []
  };

  // 1. Hapus 13 sheet tak terpakai / duplikat / kosong
  var unusedSheetNames = [
    'Sheet1', 'Sheet 1', 'DataArsip', 'data_arsip', 'arsip',
    'BeritaAcara', 'LogAktivitas', 'LogAkses', 'log_akses',
    'MasterSumberArsip', 'MasterStaff', 'Target', 'target_realisasi', 'Login'
  ];

  unusedSheetNames.forEach(function(sName) {
    try {
      var sh = ss.getSheetByName(sName);
      if (sh && ss.getSheets().length > 1) {
        ss.deleteSheet(sh);
        results.deletedSheets.push(sName);
      }
    } catch (e) {
      results.deletedSheets.push(sName + ' (failed: ' + e.message + ')');
    }
  });

  // 2. Bersihkan master_arsip
  try {
    var arsipSheet = ss.getSheetByName(CONFIG.SHEETS.MASTER_ARSIP);
    if (arsipSheet) {
      var cleanArsipHeaders = [
        'id', 'kode_unik', 'status_keterbukaan', 'asal_arsip', 'kode_asal',
        'nomor_box', 'nomor_urut', 'deskripsi', 'jenis_arsip', 'kategori_urusan',
        'kode_klasifikasi_asli', 'nomor_asli', 'jumlah_lembar', 'jumlah_berkas',
        'rangkap_ke', 'kondisi_fisik', 'kurun_waktu',
        'unit_pengelola', 'lokasi_simpan', 'keterangan',
        'file_pelestarian_id', 'file_akses_id', 'file_pelestarian_url', 'file_akses_url',
        'waktu_unggah', 'qa_checklist', 'watermark_applied',
        'staf_id', 'staf_nama', 'tanggal_input', 'tanggal_update', 'status'
      ];

      var lastRow = arsipSheet.getLastRow();
      var lastCol = arsipSheet.getLastColumn();
      var migratedRowsCount = 0;

      if (lastRow >= 2 && lastCol >= 1) {
        var oldData = arsipSheet.getRange(1, 1, lastRow, lastCol).getValues();
        var oldHeaders = oldData[0];
        var newRows = [];

        for (var r = 1; r < oldData.length; r++) {
          var rowObj = {};
          for (var c = 0; c < oldHeaders.length; c++) {
            rowObj[oldHeaders[c]] = oldData[r][c];
          }
          // Normalisasi kurun_waktu dari kurun_waktu_mulai jika kurun_waktu belum ada
          if (!rowObj['kurun_waktu'] && rowObj['kurun_waktu_mulai']) {
            rowObj['kurun_waktu'] = rowObj['kurun_waktu_mulai'];
          }
          var cleanRow = cleanArsipHeaders.map(function(h) {
            return rowObj[h] !== undefined ? rowObj[h] : '';
          });
          newRows.push(cleanRow);
        }

        arsipSheet.clearContents();
        arsipSheet.getRange(1, 1, 1, cleanArsipHeaders.length).setValues([cleanArsipHeaders]);
        if (newRows.length > 0) {
          arsipSheet.getRange(2, 1, newRows.length, cleanArsipHeaders.length).setValues(newRows);
        }
        migratedRowsCount = newRows.length;
      } else {
        arsipSheet.clearContents();
        arsipSheet.getRange(1, 1, 1, cleanArsipHeaders.length).setValues([cleanArsipHeaders]);
      }

      // Hapus kelebihan kolom di kanan
      if (arsipSheet.getMaxColumns() > cleanArsipHeaders.length) {
        arsipSheet.deleteColumns(cleanArsipHeaders.length + 1, arsipSheet.getMaxColumns() - cleanArsipHeaders.length);
      }

      var hRange = arsipSheet.getRange(1, 1, 1, cleanArsipHeaders.length);
      hRange.setFontWeight('bold');
      hRange.setBackground('#1B2A4A');
      hRange.setFontColor('#FFFFFF');
      arsipSheet.setFrozenRows(1);

      results.cleanedSheets['master_arsip'] = {
        columns: cleanArsipHeaders.length,
        rowsPreserved: migratedRowsCount
      };
    }
  } catch (eArsip) {
    results.cleanedSheets['master_arsip'] = 'Error: ' + eArsip.message;
  }

  // 3. Bersihkan pengaturan (hapus kolom E 'kunci' & F 'nilai')
  try {
    var setSheet = ss.getSheetByName(CONFIG.SHEETS.PENGATURAN);
    if (setSheet) {
      var cleanSetHeaders = ['key', 'value', 'deskripsi', 'tanggal_update'];
      setSheet.getRange(1, 1, 1, cleanSetHeaders.length).setValues([cleanSetHeaders]);
      if (setSheet.getMaxColumns() > cleanSetHeaders.length) {
        setSheet.deleteColumns(cleanSetHeaders.length + 1, setSheet.getMaxColumns() - cleanSetHeaders.length);
      }
      var hRangeSet = setSheet.getRange(1, 1, 1, cleanSetHeaders.length);
      hRangeSet.setFontWeight('bold');
      hRangeSet.setBackground('#1B2A4A');
      hRangeSet.setFontColor('#FFFFFF');
      setSheet.setFrozenRows(1);
      results.cleanedSheets['pengaturan'] = { columns: cleanSetHeaders.length };
    }
  } catch (eSet) {
    results.cleanedSheets['pengaturan'] = 'Error: ' + eSet.message;
  }

  // 4. Bersihkan kode_asal_arsip (hapus kolom E-H kosong dan standarkan header A-D)
  try {
    var kodeSheet = ss.getSheetByName(CONFIG.SHEETS.KODE_ASAL);
    if (kodeSheet) {
      var cleanKodeHeaders = ['kode', 'nama', 'deskripsi', 'status'];
      kodeSheet.getRange(1, 1, 1, cleanKodeHeaders.length).setValues([cleanKodeHeaders]);
      if (kodeSheet.getMaxColumns() > cleanKodeHeaders.length) {
        kodeSheet.deleteColumns(cleanKodeHeaders.length + 1, kodeSheet.getMaxColumns() - cleanKodeHeaders.length);
      }
      var hRangeKode = kodeSheet.getRange(1, 1, 1, cleanKodeHeaders.length);
      hRangeKode.setFontWeight('bold');
      hRangeKode.setBackground('#1B2A4A');
      hRangeKode.setFontColor('#FFFFFF');
      kodeSheet.setFrozenRows(1);
      results.cleanedSheets['kode_asal_arsip'] = { columns: cleanKodeHeaders.length };
    }
  } catch (eKode) {
    results.cleanedSheets['kode_asal_arsip'] = 'Error: ' + eKode.message;
  }

  // 5. Rapikan header untuk master_staf, berita_acara, log_aktivitas
  var standardSheets = [
    { name: CONFIG.SHEETS.MASTER_STAF, cols: 9 },
    { name: CONFIG.SHEETS.BERITA_ACARA, cols: 15 },
    { name: CONFIG.SHEETS.LOG_AKTIVITAS, cols: 8 }
  ];
  standardSheets.forEach(function(item) {
    try {
      var curSh = ss.getSheetByName(item.name);
      if (curSh) {
        if (curSh.getMaxColumns() > item.cols) {
          curSh.deleteColumns(item.cols + 1, curSh.getMaxColumns() - item.cols);
        }
        var hr = curSh.getRange(1, 1, 1, item.cols);
        hr.setFontWeight('bold');
        hr.setBackground('#1B2A4A');
        hr.setFontColor('#FFFFFF');
        curSh.setFrozenRows(1);
        results.cleanedSheets[item.name] = { columns: item.cols };
      }
    } catch (eStd) {}
  });

  // 6. Invalidate seluruh cache
  invalidateSheetCache();
  clearCache('CACHE_DASHBOARD_STATS');
  clearCache('CACHE_KODE_ASAL');
  clearCache('CACHE_PENGATURAN');

  // 7. Ambil daftar sheet yang tersisa
  results.remainingSheets = ss.getSheets().map(function(s) { return s.getName(); });

  return results;
}

/**
 * Seed data awal (kode asal arsip contoh)
 */
function seedInitialData() {
  // 1. Seed kode asal arsip (batch jika sheet kosong)
  const kodeSheet = getSheet(CONFIG.SHEETS.KODE_ASAL);
  const kodeAsalData = [
    { kode: 'KOM', nama: 'Kecamatan Komodo', deskripsi: 'Arsip dari Kecamatan Komodo', status: 'Aktif' },
    { kode: 'LBJ', nama: 'Labuan Bajo', deskripsi: 'Arsip dari Labuan Bajo', status: 'Aktif' },
    { kode: 'MAC', nama: 'Kecamatan Macang Pacar', deskripsi: 'Arsip dari Kec. Macang Pacar', status: 'Aktif' },
    { kode: 'BOL', nama: 'Kecamatan Boleng', deskripsi: 'Arsip dari Kec. Boleng', status: 'Aktif' },
    { kode: 'LEM', nama: 'Kecamatan Lembor', deskripsi: 'Arsip dari Kec. Lembor', status: 'Aktif' },
    { kode: 'WEL', nama: 'Kecamatan Welak', deskripsi: 'Arsip dari Kec. Welak', status: 'Aktif' },
    { kode: 'SAT', nama: 'Kecamatan Sano Nggoang', deskripsi: 'Arsip dari Kec. Sano Nggoang', status: 'Aktif' },
    { kode: 'NDO', nama: 'Kecamatan Ndoso', deskripsi: 'Arsip dari Kec. Ndoso', status: 'Aktif' },
    { kode: 'DKP', nama: 'Dinas Kearsipan & Perpustakaan', deskripsi: 'Arsip internal DKP', status: 'Aktif' },
    { kode: 'UMM', nama: 'Umum/Lainnya', deskripsi: 'Arsip dari sumber lainnya', status: 'Aktif' }
  ];

  if (kodeSheet.getLastRow() < 2) {
    var kRows = kodeAsalData.map(function(k) { return [k.kode, k.nama, k.deskripsi, k.status]; });
    kodeSheet.getRange(2, 1, kRows.length, 4).setValues(kRows);
    invalidateSheetCache(CONFIG.SHEETS.KODE_ASAL);
  }

  // 2. Seed pengaturan default (batch jika sheet kosong)
  const setSheet = getSheet(CONFIG.SHEETS.PENGATURAN);
  var settings = [
    { key: 'target_tahunan', value: '250', deskripsi: 'Target arsip per tahun', tanggal_update: new Date() },
    { key: 'watermark_text', value: CONFIG.WATERMARK.TEXT, deskripsi: 'Teks watermark', tanggal_update: new Date() },
    { key: 'app_version', value: CONFIG.APP.VERSION, deskripsi: 'Versi aplikasi', tanggal_update: new Date() }
  ];

  if (setSheet.getLastRow() < 2) {
    var sRows = settings.map(function(s) { return [s.key, s.value, s.deskripsi, s.tanggal_update]; });
    setSheet.getRange(2, 1, sRows.length, 4).setValues(sRows);
    invalidateSheetCache(CONFIG.SHEETS.PENGATURAN);
  }

  // 3. Seed data dummy staf SIASTA (batch jika sheet kosong)
  const stafSheet = getSheet(CONFIG.SHEETS.MASTER_STAF);
  var dummyStaf = getDummyStaffList();
  if (stafSheet.getLastRow() < 2) {
    var stHeaders = ['id', 'nama', 'nip', 'jabatan', 'email', 'status', 'tanda_tangan_id', 'tanda_tangan_url', 'tanggal_dibuat'];
    var stRows = dummyStaf.map(function(st) {
      return stHeaders.map(function(h) { return st[h] !== undefined ? st[h] : ''; });
    });
    stafSheet.getRange(2, 1, stRows.length, stHeaders.length).setValues(stRows);
    invalidateSheetCache(CONFIG.SHEETS.MASTER_STAF);
  }

  return 'Data awal (kode asal, pengaturan, dan master staf dummy) berhasil ditambahkan!';
}

/**
 * Daftar Staf Dummy untuk Demo / Default
 */
function getDummyStaffList() {
  return [
    {
      id: 'STAF-001',
      nama: 'Yohanes Don Bosco, S.Kom',
      nip: '19880512 201402 1 003',
      jabatan: 'Pranata Komputer / Petugas Alih Media',
      email: 'yohanes.donbosco@manggaraibaratkab.go.id',
      status: 'Aktif',
      tanda_tangan_id: '',
      tanda_tangan_url: '',
      tanggal_dibuat: new Date()
    },
    {
      id: 'STAF-002',
      nama: 'Maria Theresia Nona, S.AP',
      nip: '19900824 201603 2 001',
      jabatan: 'Arsiparis Ahli Pertama / Verifikator',
      email: 'maria.theresia@manggaraibaratkab.go.id',
      status: 'Aktif',
      tanda_tangan_id: '',
      tanda_tangan_url: '',
      tanggal_dibuat: new Date()
    },
    {
      id: 'STAF-003',
      nama: 'Stefanus Rahmat, S.Sos',
      nip: '19850215 201001 1 018',
      jabatan: 'Kepala Bidang Pengelolaan Arsip',
      email: 'stefanus.rahmat@manggaraibaratkab.go.id',
      status: 'Aktif',
      tanda_tangan_id: '',
      tanda_tangan_url: '',
      tanggal_dibuat: new Date()
    },
    {
      id: 'STAF-004',
      nama: 'Admin SIASTA',
      nip: '19950101 202012 1 005',
      jabatan: 'Administrator Sistem SIASTA',
      email: 'admin.siasta@manggaraibaratkab.go.id',
      status: 'Aktif',
      tanda_tangan_id: '',
      tanda_tangan_url: '',
      tanggal_dibuat: new Date()
    },
    {
      id: 'STAF-005',
      nama: 'Muhammad Dzaky Nathanegara, A.Md',
      nip: '19980508 202506 1 004',
      jabatan: 'Pengelola Kearsipan / Pelaksana Alih Media',
      email: 'dzaky.nathanegara@manggaraibaratkab.go.id',
      status: 'Aktif',
      tanda_tangan_id: '',
      tanda_tangan_url: '',
      tanggal_dibuat: new Date()
    },
    {
      id: 'STAF-006',
      nama: 'Augustinus Rinus, S.Pd',
      nip: '19720219 199903 1 008',
      jabatan: 'Kepala Dinas Kearsipan dan Perpustakaan',
      email: 'augustinus.rinus@manggaraibaratkab.go.id',
      status: 'Aktif',
      tanda_tangan_id: '',
      tanda_tangan_url: '',
      tanggal_dibuat: new Date()
    },
    {
      id: 'STAF-007',
      nama: 'Fatima Melani Rambing, SAP',
      nip: '197305231992122003',
      jabatan: 'Kepala Bidang Layanan dan Perlindungan Arsip',
      email: 'fatima.rambing@manggaraibaratkab.go.id',
      status: 'Aktif',
      tanda_tangan_id: '',
      tanda_tangan_url: '',
      tanggal_dibuat: new Date()
    },
    {
      id: 'STAF-008',
      nama: 'Angela Ivonita Pareira',
      nip: '198008162025212006',
      jabatan: 'Penanggung Jawab Kegiatan Alih Media Arsip Statis',
      email: 'angela.pareira@manggaraibaratkab.go.id',
      status: 'Aktif',
      tanda_tangan_id: '',
      tanda_tangan_url: '',
      tanggal_dibuat: new Date()
    }
  ];
}

// ============ SCRIPT CACHE HELPERS (PERFORMANCE OPTIMIZATION) ============
function getFromCache(key) {
  try {
    var cached = CacheService.getScriptCache().get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
}

function putInCache(key, data, seconds) {
  try {
    var str = JSON.stringify(data);
    if (str.length < 100000) {
      CacheService.getScriptCache().put(key, str, seconds || 3600);
    }
  } catch (e) {}
}

function clearCache(key) {
  try {
    CacheService.getScriptCache().remove(key);
  } catch (e) {}
}
