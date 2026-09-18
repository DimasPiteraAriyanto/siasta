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
 * Setup awal SIASTA
 * Jalankan fungsi ini PERTAMA KALI setelah deploy
 */
function setupSIASTA() {
  Logger.log('=== SETUP SIASTA ===');
  
  // 1. Initialize semua sheets
  var sheetsResult = initializeAllSheets();
  Logger.log('Sheets: ' + sheetsResult);
  
  // 2. Seed data awal
  var seedResult = seedInitialData();
  Logger.log('Seed: ' + seedResult);
  
  // 3. Create folder structure
  var folderResult = createFolderStructure();
  Logger.log('Folders: ' + JSON.stringify(folderResult));
  
  Logger.log('=== SETUP SELESAI ===');
  Logger.log('PENTING: Copy Root Folder ID ke CONFIG.DRIVE_FOLDER_ID di Config.gs');
  Logger.log('PENTING: Copy Spreadsheet ID ke CONFIG.SPREADSHEET_ID di Config.gs');
  
  return 'Setup SIASTA selesai! Cek log untuk detail.';
}
