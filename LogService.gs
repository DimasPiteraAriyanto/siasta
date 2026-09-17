/**
 * =========================================
 * SIASTA - LogService.gs
 * Activity & Access Logging
 * =========================================
 */

/**
 * Log aktivitas sistem
 * @param {string} aksi - Jenis aksi (LOGIN, LOGOUT, INPUT, EDIT, DELETE, GENERATE_BA, GENERATE_LAPORAN, dll)
 * @param {string} modul - Modul/halaman (Auth, Arsip, BeritaAcara, Laporan, dll)
 * @param {string} detail - Detail aktivitas
 */
function logActivity(aksi, modul, detail) {
  try {
    var user = getCurrentUser();
    var logData = {
      id: generateId('LOG'),
      timestamp: new Date(),
      staf_id: user ? user.id : 'SYSTEM',
      staf_nama: user ? user.nama : 'System',
      aksi: aksi,
      modul: modul,
      detail: detail,
      ip_address: '-'
    };
    
    appendData(CONFIG.SHEETS.LOG_AKTIVITAS, logData);
  } catch (e) {
    // Silent fail for logging — don't break main flow
    Logger.log('Log error: ' + e.message);
  }
}

/**
 * Log akses arsip
 * @param {string} arsipId
 * @param {string} arsipKode
 * @param {string} jenisAkses - 'VIEW', 'DOWNLOAD', 'EDIT'
 */
function logAksesArsip(arsipId, arsipKode, jenisAkses) {
  try {
    var user = getCurrentUser();
    var logData = {
      id: generateId('ACS'),
      timestamp: new Date(),
      staf_id: user ? user.id : 'ANONYMOUS',
      staf_nama: user ? user.nama : 'Anonymous',
      arsip_id: arsipId,
      arsip_kode: arsipKode,
      jenis_akses: jenisAkses
    };
    
    appendData(CONFIG.SHEETS.LOG_AKSES, logData);
  } catch (e) {
    Logger.log('Log akses error: ' + e.message);
  }
}

/**
 * Get log aktivitas dengan filter
 * @param {Object} params - {page, pageSize, stafId, aksi, tanggalMulai, tanggalAkhir}
 * @returns {Object} Response
 */
function getActivityLog(params) {
  try {
    params = params || {};
    var allLogs = readAllData(CONFIG.SHEETS.LOG_AKTIVITAS);
    
    // Sort by timestamp descending (newest first)
    allLogs.sort(function(a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Apply filters
    if (params.stafId) {
      allLogs = allLogs.filter(function(l) { return l.staf_id === params.stafId; });
    }
    if (params.aksi) {
      allLogs = allLogs.filter(function(l) { return l.aksi === params.aksi; });
    }
    if (params.tanggalMulai) {
      var startDate = new Date(params.tanggalMulai);
      allLogs = allLogs.filter(function(l) { return new Date(l.timestamp) >= startDate; });
    }
    if (params.tanggalAkhir) {
      var endDate = new Date(params.tanggalAkhir);
      endDate.setHours(23, 59, 59);
      allLogs = allLogs.filter(function(l) { return new Date(l.timestamp) <= endDate; });
    }
    if (params.search) {
      var searchLower = params.search.toLowerCase();
      allLogs = allLogs.filter(function(l) {
        return (l.detail && l.detail.toLowerCase().indexOf(searchLower) > -1) ||
               (l.staf_nama && l.staf_nama.toLowerCase().indexOf(searchLower) > -1) ||
               (l.aksi && l.aksi.toLowerCase().indexOf(searchLower) > -1);
      });
    }
    
    // Pagination
    var page = params.page || 1;
    var pageSize = params.pageSize || CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;
    var total = allLogs.length;
    var totalPages = Math.ceil(total / pageSize);
    var startIndex = (page - 1) * pageSize;
    var pageData = allLogs.slice(startIndex, startIndex + pageSize);
    
    // Format timestamps for display
    pageData = pageData.map(function(log) {
      log.timestamp_formatted = formatTanggal(log.timestamp, 'datetime');
      return log;
    });
    
    return jsonResponse(true, {
      data: pageData,
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages
    });
  } catch (e) {
    return jsonResponse(false, null, 'Error mengambil log: ' + e.message);
  }
}

/**
 * Get recent activity for dashboard
 * @param {number} limit
 * @returns {Object}
 */
function getRecentActivity(limit) {
  try {
    limit = limit || 10;
    var allLogs = readAllData(CONFIG.SHEETS.LOG_AKTIVITAS);
    
    allLogs.sort(function(a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    var recent = allLogs.slice(0, limit).map(function(log) {
      log.timestamp_formatted = formatTanggal(log.timestamp, 'datetime');
      return log;
    });
    
    return jsonResponse(true, recent);
  } catch (e) {
    return jsonResponse(false, null, 'Error: ' + e.message);
  }
}
