/**
 * =========================================
 * SIASTA - Sistem Informasi Alih Media Arsip Statis
 * Code.gs — Main Entry Point & Routing
 * =========================================
 * 
 * Dinas Kearsipan dan Perpustakaan Daerah
 * Kabupaten Manggarai Barat
 * 
 * Powered by Google Apps Script
 * v1.0.0 — 2026
 * =========================================
 */

/**
 * Main entry point — GET handler
 * Ini dipanggil saat user mengakses URL Web App
 */
function doGet(e) {
  // Support direct seed trigger via URL parameter ?action=seed
  if (e && e.parameter && (e.parameter.action === 'seed' || e.parameter.seed === 'true')) {
    var res = seedFullDummyData(true);
    return ContentService.createTextOutput(JSON.stringify(res, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Support direct database cleaning trigger via URL parameter ?action=clean_database
  if (e && e.parameter && e.parameter.action === 'clean_database') {
    var cleanRes = executeCleanDatabaseStructure();
    return ContentService.createTextOutput(JSON.stringify(cleanRes, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Support direct wipe dummy data across all spreadsheets
  if (e && e.parameter && (e.parameter.action === 'wipe_all_dummy' || e.parameter.action === 'wipe')) {
    var report = [];
    var targetIds = [
      '1eERa08ccRqPJp7r_iGddzcnWnI1NnYn4UDl3_60CzK0',
      (CONFIG && CONFIG.SPREADSHEET_ID) ? CONFIG.SPREADSHEET_ID : ''
    ];
    if (e.parameter.ssId) targetIds.push(e.parameter.ssId);
    
    try {
      var actSs = SpreadsheetApp.getActiveSpreadsheet();
      if (actSs) targetIds.push(actSs.getId());
    } catch (eAct) {}

    try {
      var savedId = PropertiesService.getScriptProperties().getProperty('SIASTA_AUTO_SS_ID');
      if (savedId) targetIds.push(savedId);
    } catch (eProp) {}

    var uniqueIds = [];
    targetIds.forEach(function(id) {
      if (id && uniqueIds.indexOf(id) === -1) uniqueIds.push(id);
    });

    uniqueIds.forEach(function(id) {
      try {
        var ss = SpreadsheetApp.openById(id);
        var ssName = ss.getName();
        var sheets = ss.getSheets();
        var sheetNames = sheets.map(function(s) { return s.getName(); });
        var cleared = [];

        var sheetDetails = [];
        var wipeNames = [
          'master_arsip', 'DataArsip', 'data_arsip', 'arsip',
          'berita_acara', 'BeritaAcara',
          'log_aktivitas', 'LogAktivitas',
          'log_akses', 'LogAkses',
          'Sheet1'
        ];

        // Exclude reference & user sheets from wiping
        var protectSheets = ['master_staf', 'kode_asal_arsip', 'pengaturan'];

        sheets.forEach(function(sh) {
          var name = sh.getName();
          var lr = sh.getLastRow();
          var lc = sh.getLastColumn();
          var isWiped = false;
          var deletedCount = 0;

          if (protectSheets.indexOf(name) !== -1) {
            // Do NOT wipe reference / staff sheets!
            return;
          }

          var shouldWipe = wipeNames.indexOf(name) !== -1;
          if (!shouldWipe && (name.toLowerCase().indexOf('arsip') !== -1 || name.toLowerCase().indexOf('berita') !== -1)) {
            shouldWipe = true;
          }

          if (shouldWipe && lr > 1) {
            deletedCount = lr - 1;
            sh.deleteRows(2, deletedCount);
            isWiped = true;
            cleared.push(name + ' (' + deletedCount + ' baris dummy berhasil dihapus)');
          } else if (shouldWipe) {
            cleared.push(name + ' (sudah bersih / 0 baris)');
          }

          sheetDetails.push({
            name: name,
            originalRows: lr,
            deletedRows: deletedCount,
            finalRows: sh.getLastRow()
          });
        });

        // Pastikan MasterSumberArsip dan kode_asal_arsip terisi data referensi unit
        var defaultSumber = [
          ['KOM', 'Kecamatan Komodo', 'Arsip dari Kecamatan Komodo', 'Aktif'],
          ['LBJ', 'Labuan Bajo', 'Arsip dari Labuan Bajo', 'Aktif'],
          ['MAC', 'Kecamatan Macang Pacar', 'Arsip dari Kec. Macang Pacar', 'Aktif'],
          ['BOL', 'Kecamatan Boleng', 'Arsip dari Kec. Boleng', 'Aktif'],
          ['LEM', 'Kecamatan Lembor', 'Arsip dari Kec. Lembor', 'Aktif'],
          ['WEL', 'Kecamatan Welak', 'Arsip dari Kec. Welak', 'Aktif'],
          ['SAT', 'Kecamatan Sano Nggoang', 'Arsip dari Kec. Sano Nggoang', 'Aktif'],
          ['NDO', 'Kecamatan Ndoso', 'Arsip dari Kec. Ndoso', 'Aktif'],
          ['DKP', 'Dinas Kearsipan & Perpustakaan', 'Arsip internal DKP', 'Aktif'],
          ['UMM', 'Umum/Lainnya', 'Arsip dari sumber lainnya', 'Aktif']
        ];

        ['MasterSumberArsip', 'kode_asal_arsip'].forEach(function(sName) {
          var sSheet = ss.getSheetByName(sName);
          if (sSheet && sSheet.getLastRow() < 2) {
            if (sSheet.getLastRow() === 0) {
              sSheet.appendRow(['Kode', 'Nama Unit/Kecamatan', 'Deskripsi', 'Status']);
            }
            sSheet.getRange(2, 1, defaultSumber.length, defaultSumber[0].length).setValues(defaultSumber);
            cleared.push(sName + ' (direfresh dengan 10 referensi unit)');
          }
        });

        report.push({
          ssId: id,
          ssName: ssName,
          status: 'SUCCESS',
          cleared: cleared,
          sheetDetails: sheetDetails
        });
      } catch (err) {
        report.push({
          ssId: id,
          status: 'ERROR: ' + err.message
        });
      }
    });

    invalidateSheetCache();
    clearCache('CACHE_DASHBOARD_STATS');

    return ContentService.createTextOutput(JSON.stringify(report, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Support direct clear dummy data via URL parameter ?action=clear_dummy
  if (e && e.parameter && (e.parameter.action === 'clear_dummy' || e.parameter.action === 'clean')) {
    var clearRes = clearAllDummyDataExceptUsers();
    return ContentService.createTextOutput(JSON.stringify(clearRes, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Support check database row count status via URL parameter ?action=check_status
  if (e && e.parameter && e.parameter.action === 'check_status') {
    var arsipCount = (readAllData(CONFIG.SHEETS.MASTER_ARSIP) || []).length;
    var stafCount = (readAllData(CONFIG.SHEETS.MASTER_STAF) || []).length;
    var baCount = (readAllData(CONFIG.SHEETS.BERITA_ACARA) || []).length;
    var logCount = (readAllData(CONFIG.SHEETS.LOG_AKTIVITAS) || []).length;
    return ContentService.createTextOutput(JSON.stringify({
      arsipCount: arsipCount,
      stafCount: stafCount,
      baCount: baCount,
      logCount: logCount
    }, null, 2)).setMimeType(ContentService.MimeType.JSON);
  }

  // Support direct CRUD & output test suite via URL parameter ?action=test_crud
  if (e && e.parameter && (e.parameter.action === 'test_crud' || e.parameter.action === 'test')) {
    var testSuite = runFullCRUDTestSuite();
    return ContentService.createTextOutput(JSON.stringify(testSuite, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Support direct getPageContent inspection
  if (e && e.parameter && e.parameter.action === 'get_html') {
    var page = e.parameter.page || 'daftar-arsip';
    var content = getPageContent(page, e.parameter.param || null);
    return ContentService.createTextOutput(content)
      .setMimeType(ContentService.MimeType.TEXT);
  }

  // Sinkronkan seluruh header database agar kolom selalu siap
  try {
    syncAllDatabaseHeaders();
    clearCache('CACHE_KODE_ASAL');
  } catch (syncErr) {
    Logger.log('Sync headers error: ' + syncErr.message);
  }

  var user = getCurrentUser();
  
  // Unified Master Shell (Zero-Reload SPA)
  var template = HtmlService.createTemplateFromFile('Layout');
  template.isLoggedIn = !!user;
  template.userName = user ? (user.nama || '') : '';
  template.userJabatan = user ? (user.jabatan || '') : '';
  template.userInitial = (user && user.nama) ? user.nama.charAt(0).toUpperCase() : '?';
  template.instansi = CONFIG.APP.INSTANSI;
  template.daerah = CONFIG.APP.DAERAH;
  template.tahun = CONFIG.APP.TAHUN;
  template.version = CONFIG.APP.VERSION;
  
  return template.evaluate()
    .setTitle('SIASTA — ' + CONFIG.APP.FULL_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl('https://www.gstatic.com/images/branding/product/2x/apps_script_48dp.png');
}

/**
 * Include file HTML (untuk <?!= include('filename') ?>)
 * @param {string} filename - Nama file tanpa ekstensi
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Get konten halaman berdasarkan page name
 * Dipanggil dari client-side navigateTo()
 * @param {string} page - Nama halaman
 * @returns {string} HTML content
 */
function getPageContent(page, param) {
  // Page mapping
  var pageMap = {
    'dashboard': 'Dashboard',
    'input-arsip': 'InputArsip',
    'daftar-arsip': 'DaftarArsip',
    'detail-arsip': 'DetailArsip',
    'target-realisasi': 'TargetRealisasi',
    'dashboard-ba': 'DashboardBA',
    'ba-staf': 'BeritaAcaraStaf',
    'ba-gabungan': 'BeritaAcaraGabungan',
    'generate-laporan': 'GenerateLaporan',
    'kelola-staf': 'KelolaStaf',
    'log-aktivitas': 'LogAktivitas',
    'pengaturan': 'Pengaturan'
  };
  
  var fileName = pageMap[page];
  if (!fileName) {
    return '<div class="empty-state"><div class="empty-icon">❓</div>' +
           '<div class="empty-title">Halaman tidak ditemukan</div>' +
           '<div class="empty-desc">Halaman "' + page + '" belum tersedia.</div></div>';
  }
  
  try {
    var template = HtmlService.createTemplateFromFile(fileName);
    
    // Inject common variables
    template.tahun = CONFIG.APP.TAHUN;
    template.instansi = CONFIG.APP.INSTANSI;
    template.daerah = CONFIG.APP.DAERAH;
    
    // Injeksi data khusus halaman jika ada
    if (page === 'input-arsip') {
      try {
        var asalRes = getKodeAsalList();
        template.kodeAsalList = (asalRes && asalRes.success && asalRes.data) ? asalRes.data : [];
      } catch (errAsal) {
        template.kodeAsalList = [];
      }
    } else if (page === 'daftar-arsip') {
      try {
        var asalRes = getKodeAsalList();
        template.kodeAsalList = (asalRes && asalRes.success && asalRes.data) ? asalRes.data : [];
        var arsipRes = getArsipList({ page: 1, pageSize: 25 });
        template.initialArsip = (arsipRes && arsipRes.success && arsipRes.data) ? arsipRes.data : null;
      } catch (errDaftar) {
        template.kodeAsalList = [];
        template.initialArsip = null;
      }
    } else if (page === 'detail-arsip') {
      try {
        var arsipId = param;
        if (arsipId) {
          var detailRes = getArsipDetail(arsipId);
          template.initialDetail = (detailRes && detailRes.success && detailRes.data) ? detailRes.data : null;
        } else {
          template.initialDetail = null;
        }
      } catch (errDetail) {
        template.initialDetail = null;
      }
    } else if (page === 'dashboard') {
      try {
        var dashRes = getDashboardStats();
        template.initialDash = (dashRes && dashRes.success && dashRes.data) ? dashRes.data : null;
        var actRes = getRecentActivity(8);
        template.initialActivity = (actRes && actRes.success && actRes.data) ? actRes.data : [];
      } catch (errDash) {
        template.initialDash = null;
        template.initialActivity = [];
      }
    } else if (page === 'target-realisasi') {
      try {
        var trRes = getTargetRealisasi();
        template.initialTR = (trRes && trRes.success && trRes.data) ? trRes.data : null;
      } catch (errTR) {
        template.initialTR = null;
      }
    } else if (page === 'log-aktivitas') {
      try {
        var logRes = getActivityLog({ page: 1, pageSize: 25 });
        template.initialLogs = (logRes && logRes.success && logRes.data) ? logRes.data : null;
      } catch (errLog) {
        template.initialLogs = null;
      }
    } else if (page === 'kelola-staf') {
      try {
        var stafRes = getAllStaf();
        template.initialStaf = (stafRes && stafRes.success && stafRes.data) ? stafRes.data : null;
      } catch (errStaf) {
        template.initialStaf = null;
      }
    }
    
    return template.evaluate().getContent();
  } catch (e) {
    return '<div class="empty-state"><div class="empty-icon">⚠️</div>' +
           '<div class="empty-title">Error memuat halaman</div>' +
           '<div class="empty-desc">' + e.message + '</div></div>';
  }
}

/**
 * Get URL Web App (untuk redirect setelah login/logout)
 */
function getAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * =========================================================================
 * JALANKAN_SETUP_SEKALI_SAJA
 * =========================================================================
 * FUNGSI SETUP UTAMA UNTUK AKUN BARU (MIGRASI / DEPLOYMENT BARU)
 * 
 * Sekali klik tombol "Run" di Apps Script akun baru, fungsi ini otomatis:
 * 1. Memeriksa/membuat Spreadsheet Database dengan 8 Sheet dan kolom header lengkap.
 * 2. Mengisi data awal (master staf, kode asal arsip, pengaturan dinas, target tahunan).
 * 3. Membuat struktur folder lengkap di Google Drive (SIASTA, Pelestarian, Akses, Berita Acara, Laporan).
 * 4. Menyimpan ID spreadsheet & root folder ke Script Properties.
 * 5. Menampilkan panduan dan ringkasan ID di Logger.log.
 * =========================================================================
 */
function JALANKAN_SETUP_SEKALI_SAJA() {
  Logger.log('=====================================================');
  Logger.log('🚀 MEMULAI SETUP OTOMATIS SIASTA UNTUK AKUN GOOGLE BARU');
  Logger.log('=====================================================');
  
  var statusReport = [];
  
  try {
    // 1. Spreadsheet & Inisialisasi Seluruh Sheets (8 Sheet)
    var ss = getSpreadsheet();
    var ssId = ss.getId();
    statusReport.push('✅ Spreadsheet Database aktif (ID: ' + ssId + ')');
    Logger.log('1. Memeriksa database spreadsheet: ' + ss.getName() + ' (' + ssId + ')');
    
    var sheetsRes = initializeAllSheets();
    statusReport.push('✅ ' + sheetsRes);
    Logger.log('2. Inisialisasi 8 Sheets & Kolom Header: SELESAI');
    
    // 2. Seeding Data Awal (Akun Staf, Kode Asal, Pengaturan Dinas, Target)
    var seedRes = seedInitialData();
    statusReport.push('✅ ' + seedRes);
    Logger.log('3. Seeding Data Awal (Staf, Kode Asal, Pengaturan, Target): SELESAI');
    
    // 3. Hierarki Google Drive Folder
    var folderRes = createFolderStructure();
    statusReport.push('✅ Struktur Folder Google Drive: ' + (folderRes.success ? 'Berhasil Dibuat' : 'Tersedia'));
    Logger.log('4. Struktur Folder Google Drive: ' + JSON.stringify(folderRes));
    
    // 4. Pastikan ID tersimpan di Script Properties
    var props = PropertiesService.getScriptProperties();
    props.setProperty('SPREADSHEET_ID', ssId);
    props.setProperty('SIASTA_AUTO_SS_ID', ssId);
    if (folderRes && folderRes.rootFolderId) {
      props.setProperty('DRIVE_FOLDER_ID', folderRes.rootFolderId);
    }
    
    // 5. Invalidate runtime cache
    invalidateSheetCache();
    clearCache('CACHE_DASHBOARD_STATS');
    
    Logger.log('=====================================================');
    Logger.log('🎉 SETUP SIASTA SELESAI 100% SUKSES!');
    Logger.log('=====================================================');
    Logger.log('📋 DETAIL IDENTITAS SISTEM:');
    Logger.log('• Spreadsheet ID : ' + ssId);
    Logger.log('• Spreadsheet URL: ' + ss.getUrl());
    Logger.log('• Folder Drive ID: ' + (folderRes.rootFolderId || 'SIASTA di Drive Saya'));
    Logger.log('=====================================================');
    Logger.log('👉 CATATAN AKUN BARU:');
    Logger.log('Jika berpindah file Apps Script ke akun baru, Anda bisa');
    Logger.log('memperbarui CONFIG.SPREADSHEET_ID di Config.gs dengan ID di atas.');
    Logger.log('=====================================================');
    
    return jsonResponse(true, {
      spreadsheetId: ssId,
      spreadsheetUrl: ss.getUrl(),
      rootFolderId: folderRes.rootFolderId || '',
      report: statusReport
    }, 'Setup SIASTA berhasil selesai! Semua sheet dan folder Drive telah siap digunakan.');
  } catch (err) {
    Logger.log('❌ ERROR SETUP SIASTA: ' + err.message);
    return jsonResponse(false, null, 'Gagal menjalankan setup SIASTA: ' + err.message);
  }
}

/**
 * Alias fungsi setup untuk kompatibilitas
 */
function setupSIASTA() {
  return JALANKAN_SETUP_SEKALI_SAJA();
}
