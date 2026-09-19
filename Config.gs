/**
 * =========================================
 * SIASTA - Sistem Informasi Alih Media Arsip Statis
 * Config.gs — Constants & Configuration
 * =========================================
 * 
 * Konfigurasi global untuk SIASTA.
 * PENTING: Setelah deploy, isi SPREADSHEET_ID dan DRIVE_FOLDER_ID
 * dengan ID aktual dari Google Sheets dan Google Drive Anda.
 */

// ============ SPREADSHEET CONFIG ============
const CONFIG = {
  // Logo Resmi Pemkab Manggarai Barat (Base64 PNG)
  LOGO_MABAR: 'data:image/png;base64,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',

  // Ganti dengan ID spreadsheet Anda setelah dibuat
  SPREADSHEET_ID: '1eERa08ccRqPJp7r_iGddzcnWnI1NnYn4UDl3_60CzK0',
  
  // Nama-nama sheet utama aktif SIASTA
  SHEETS: {
    MASTER_ARSIP: 'master_arsip',
    MASTER_STAF: 'master_staf',
    LOG_AKTIVITAS: 'log_aktivitas',
    BERITA_ACARA: 'berita_acara',
    PENGATURAN: 'pengaturan',
    KODE_ASAL: 'kode_asal_arsip'
  },

  // Ganti dengan ID folder root SIASTA di Google Drive
  DRIVE_FOLDER_ID: '',

  // Sub-folder names
  DRIVE_FOLDERS: {
    ARSIP_DIGITAL: 'Arsip Digital',
    PELESTARIAN: 'Pelestarian',
    AKSES: 'Akses',
    BERITA_ACARA: 'Berita Acara',
    LAPORAN: 'Laporan',
    LAPORAN_INTERNAL: 'Internal',
    LAPORAN_EKSTERNAL: 'Eksternal',
    TANDA_TANGAN: 'Tanda Tangan',
    BACKUP: 'Backup'
  },

  // App Info
  APP: {
    NAME: 'SIASTA',
    FULL_NAME: 'Sistem Informasi Alih Media Arsip Statis',
    VERSION: '1.0.0',
    INSTANSI: 'Dinas Kearsipan dan Perpustakaan Daerah',
    DAERAH: 'Kabupaten Manggarai Barat',
    TAHUN: 2026
  },

  // Kredensial Login Utama SIASTA
  AUTH: {
    DEFAULT_USERNAME: 'siasta',
    DEFAULT_PASSWORD: 'admin'
  },

  // Pejabat Resmi & Penandatangan Dokumen (Sesuai Berkas Fisik Pemkab Manggarai Barat)
  PEJABAT: {
    KADIS: {
      NAMA: 'Augustinus Rinus, S.Pd',
      PANGKAT: 'Pembina Utama Muda',
      NIP: '19720219 199903 1 008',
      JABATAN: 'Kepala Dinas Kearsipan dan Perpustakaan Kabupaten Manggarai Barat'
    },
    KABID: {
      NAMA: 'Stefanus Rahmat, S.Sos',
      PANGKAT: 'Pembina / IV a',
      NIP: '19850215 201001 1 018',
      JABATAN: 'Kepala Bidang Layanan, Alih Media dan Perlindungan Arsip'
    },
    PELAKSANA: {
      NAMA: 'Muhammad Dzaky Nathanegara, A.Md',
      NIP: '19980508 202506 1 004',
      JABATAN: 'Pengelola Kearsipan / Pelaksana Alih Media',
      TTD: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyODAgMTAwIiB3aWR0aD0iMjgwIiBoZWlnaHQ9IjEwMCI+PHBhdGggZD0iTTI1LDY1IEM0MCwyNSA1NSwyMCA2NSw0NSBDNzUsNzAgNjAsODUgODAsNjAgQzEwMCwzNSAxMjAsNDAgMTM1LDU1IEMxNTAsNzAgMTYwLDM1IDE3NSw1MCBDMTkwLDY1IDIxMCw0MCAyMjUsNTUgQzIzNSw2NSAyNDUsNTUgMjYwLDUwIE0zNSw4MCBDOTUsNzIgMTcwLDc1IDI1NSw3MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWE0ZmEwIiBzdHJva2Utd2lkdGg9IjMuMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+'
    },
    DUMMY_TTD: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyODAgMTAwIiB3aWR0aD0iMjgwIiBoZWlnaHQ9IjEwMCI+PHBhdGggZD0iTTI1LDY1IEM0MCwyNSA1NSwyMCA2NSw0NSBDNzUsNzAgNjAsODUgODAsNjAgQzEwMCwzNSAxMjAsNDAgMTM1LDU1IEMxNTAsNzAgMTYwLDM1IDE3NSw1MCBDMTkwLDY1IDIxMCw0MCAyMjUsNTUgQzIzNSw2NSAyNDUsNTUgMjYwLDUwIE0zNSw4MCBDOTUsNzIgMTcwLDc1IDI1NSw3MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMWE0ZmEwIiBzdHJva2Utd2lkdGg9IjMuMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+',
    ALAMAT_KOP: 'Jl. Samping Bank NTT, Kelurahan Wae Kelambu, Labuan Bajo - Flores - NTT'
  },

  // Pengaturan Template Berita Acara Resmi
  TEMPLATE_BA: {
    DASAR_HUKUM: 'Peraturan Bupati Manggarai Barat Nomor 31 Tahun 2024 tentang Pedoman Alih Media Arsip di Lingkungan Pemerintah Daerah Kabupaten Manggarai Barat',
    TEMPAT: 'Dinas Kearsipan dan Perpustakaan Kabupaten Manggarai Barat',
    KOTA: 'Labuan Bajo'
  },

  // Target
  TARGET: {
    ARSIP_TAHUNAN: 250
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 25,
    PAGE_SIZES: [25, 50, 100]
  },

  // Session
  SESSION: {
    KEY_USER_ID: 'SIASTA_USER_ID',
    KEY_USER_NAME: 'SIASTA_USER_NAME',
    KEY_USER_JABATAN: 'SIASTA_USER_JABATAN',
    KEY_LOGIN_TIME: 'SIASTA_LOGIN_TIME',
    TIMEOUT_HOURS: 8
  },

  // Watermark
  WATERMARK: {
    LINE1: 'ARSIP HASIL ALIH MEDIA',
    LINE2: 'DINAS KEARSIPAN DAN PERPUSTAKAAN DAERAH',
    LINE3: 'KABUPATEN MANGGARAI BARAT',
    TEXT: 'ARSIP HASIL ALIH MEDIA — DINAS KEARSIPAN DAN PERPUSTAKAAN DAERAH KABUPATEN MANGGARAI BARAT',
    OPACITY: 0.22,
    POSITION: 'center'
  },

  // QA Checklist items
  QA_CHECKLIST: [
    'Resolusi sesuai standar (min. 300dpi untuk pelestarian)',
    'Format file sesuai (TIFF pelestarian, JPG/PDF akses)',
    'Seluruh fisik arsip tercakup, tidak terpotong',
    'Hasil scan terbaca jelas',
    'Cropping sesuai standar',
    'Deskripsi arsip terisi lengkap'
  ],

  // Jenis Arsip options
  JENIS_ARSIP: [
    'Tekstual',
    'Kartografi/Gambar Teknik',
    'Kearsitekturan',
    'Foto',
    'Film/Video',
    'Rekaman Suara',
    'Bentuk Lain'
  ],

  // Status Keterbukaan options
  STATUS_KETERBUKAAN: ['Terbuka', 'Tertutup'],

  // Colors (Design System)
  COLORS: {
    PRIMARY: '#1B2A4A',       // Navy
    PRIMARY_LIGHT: '#2C3E6B', // Navy lighter
    ACCENT: '#4A90D9',        // Blue
    ACCENT_LIGHT: '#6BA5E7',  // Blue lighter
    GOLD: '#D4A843',          // Gold
    GOLD_LIGHT: '#E8C96A',    // Gold lighter
    SUCCESS: '#27AE60',
    WARNING: '#F39C12',
    DANGER: '#E74C3C',
    BG: '#F5F7FA',
    WHITE: '#FFFFFF',
    TEXT: '#2C3E50',
    TEXT_LIGHT: '#7F8C8D',
    BORDER: '#E1E8ED'
  }
};

// ============ IN-MEMORY RUNTIME CACHE ============
var _cachedSpreadsheet = null;
var _cachedSheets = {};

/**
 * Mendapatkan Spreadsheet aktif berdasarkan CONFIG (cached during execution)
 */
function getSpreadsheet() {
  if (!_cachedSpreadsheet) {
    var ss = null;
    if (CONFIG.SPREADSHEET_ID) {
      try {
        ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      } catch (e) {
        Logger.log('Warning openById: ' + e.message);
      }
    }
    if (!ss) {
      try {
        ss = SpreadsheetApp.getActiveSpreadsheet();
      } catch (e2) {}
    }
    if (!ss) {
      var savedId = PropertiesService.getScriptProperties().getProperty('SIASTA_AUTO_SS_ID');
      if (savedId) {
        try {
          ss = SpreadsheetApp.openById(savedId);
        } catch (e3) {}
      }
    }
    if (!ss) {
      try {
        ss = SpreadsheetApp.create('SIASTA — Database Alih Media Arsip Statis (Mabar)');
        PropertiesService.getScriptProperties().setProperty('SIASTA_AUTO_SS_ID', ss.getId());
      } catch (e4) {
        throw new Error('Gagal menghubungkan ke database spreadsheet: ' + e4.message);
      }
    }
    _cachedSpreadsheet = ss;
  }
  return _cachedSpreadsheet;
}

/**
 * Mendapatkan sheet berdasarkan nama (cached during execution)
 */
function getSheet(sheetName) {
  if (!_cachedSheets[sheetName]) {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    _cachedSheets[sheetName] = sheet;
  }
  return _cachedSheets[sheetName];
}

/**
 * Get Logo Resmi Pemkab Manggarai Barat (Base64)
 */
function getLogoMabar() {
  return (CONFIG.LOGO_MABAR || '');
}
