/**
 * =========================================
 * SIASTA - Utils.gs
 * Helper functions & utilities
 * =========================================
 */

/**
 * Generate unique ID dengan prefix
 * @param {string} prefix - Prefix ID (contoh: 'ARS', 'BA', 'LOG')
 * @returns {string} ID unik
 */
function generateId(prefix) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return prefix + '-' + timestamp + '-' + random;
}

/**
 * Format tanggal ke format Indonesia
 * @param {Date} date
 * @param {string} format - 'short', 'long', 'datetime'
 * @returns {string}
 */
function formatTanggal(date, format) {
  if (!date) return '-';
  if (typeof date === 'string') date = new Date(date);
  if (!(date instanceof Date) || isNaN(date.getTime())) return '-';
  
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  
  switch (format) {
    case 'short':
      return d + '/' + (m + 1) + '/' + y;
    case 'long':
      return d + ' ' + bulan[m] + ' ' + y;
    case 'datetime':
      return d + ' ' + bulan[m] + ' ' + y + ' ' + h + ':' + min;
    case 'day':
      return hari[date.getDay()] + ', ' + d + ' ' + bulan[m] + ' ' + y;
    case 'monthyear':
      return bulan[m] + ' ' + y;
    case 'iso':
      return date.toISOString().split('T')[0];
    default:
      return d + ' ' + bulan[m] + ' ' + y;
  }
}

/**
 * Format tanggal Indonesia (alias helper serbaguna)
 * @param {Date|string} date
 * @param {boolean} withTime
 * @returns {string}
 */
function formatDateIndo(date, withTime) {
  if (!date) return '-';
  if (typeof date === 'string') date = new Date(date);
  if (!(date instanceof Date) || isNaN(date.getTime())) return '-';
  
  var res = formatTanggal(date, 'long');
  if (withTime) {
    var h = date.getHours().toString().padStart(2, '0');
    var min = date.getMinutes().toString().padStart(2, '0');
    var sec = date.getSeconds().toString().padStart(2, '0');
    res += ' ' + h + ':' + min + ':' + sec + ' WITA';
  }
  return res;
}

/**
 * Format angka dengan pemisah ribuan
 */
function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Pad number dengan leading zeros
 */
function padNumber(num, length) {
  return num.toString().padStart(length, '0');
}

/**
 * Konversi angka ke teks terbilang bahasa Indonesia (contoh: 300 -> tiga ratus)
 */
function angkaTerbilang(angka) {
  var bilangan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  angka = Math.floor(Math.abs(parseInt(angka) || 0));
  if (angka < 12) return bilangan[angka];
  if (angka < 20) return angkaTerbilang(angka - 10) + ' belas';
  if (angka < 100) return angkaTerbilang(Math.floor(angka / 10)) + ' puluh' + (angka % 10 ? ' ' + angkaTerbilang(angka % 10) : '');
  if (angka < 200) return 'seratus' + (angka - 100 ? ' ' + angkaTerbilang(angka - 100) : '');
  if (angka < 1000) return angkaTerbilang(Math.floor(angka / 100)) + ' ratus' + (angka % 100 ? ' ' + angkaTerbilang(angka % 100) : '');
  if (angka < 2000) return 'seribu' + (angka - 1000 ? ' ' + angkaTerbilang(angka - 1000) : '');
  if (angka < 1000000) return angkaTerbilang(Math.floor(angka / 1000)) + ' ribu' + (angka % 1000 ? ' ' + angkaTerbilang(angka % 1000) : '');
  if (angka < 1000000000) return angkaTerbilang(Math.floor(angka / 1000000)) + ' juta' + (angka % 1000000 ? ' ' + angkaTerbilang(angka % 1000000) : '');
  return angka.toString();
}

/**
 * Validasi apakah string kosong
 */
function isEmpty(value) {
  return value === null || value === undefined || value.toString().trim() === '';
}

/**
 * Sanitize HTML untuk mencegah XSS
 */
function sanitizeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Alias escapeHtml untuk kompatibilitas
 */
function escapeHtml(str) {
  return sanitizeHtml(str);
}

/**
 * Get nama bulan Indonesia
 */
function getNamaBulan(monthIndex) {
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return bulan[monthIndex];
}

/**
 * Parse date string yang beragam format
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  return new Date(dateStr);
}

/**
 * Konversi data sheet ke array of objects
 * Baris pertama sebagai header (keys)
 */
function sheetDataToObjects(data) {
  if (!data || data.length < 2) return [];
  const headers = data[0];
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    obj._rowIndex = i + 1; // 1-based row number in sheet
    result.push(obj);
  }
  return result;
}

/**
 * Create JSON response (sanitized for safe GAS RPC serialization)
 */
function jsonResponse(success, data, message) {
  var cleanData = data;
  if (data !== null && data !== undefined) {
    try {
      cleanData = JSON.parse(JSON.stringify(data));
    } catch (e) {
      cleanData = data;
    }
  }
  return {
    success: success,
    data: cleanData !== undefined ? cleanData : null,
    message: message || '',
    timestamp: new Date().toISOString()
  };
}

/**
 * Get current month and year
 */
function getCurrentPeriod() {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
    monthName: getNamaBulan(now.getMonth()),
    formatted: getNamaBulan(now.getMonth()) + ' ' + now.getFullYear()
  };
}

/**
 * Calculate percentage
 */
function calculatePercentage(value, total) {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
}

function testSpreadsheetConnection() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sheets = ss.getSheets().map(function(s) { return s.getName() + ' (' + s.getLastRow() + ' rows)'; });
    return JSON.stringify({
      success: true,
      name: ss.getName(),
      sheets: sheets
    });
  } catch (e) {
    return JSON.stringify({
      success: false,
      error: e.message
    });
  }
}

function checkEnvironmentInfo() {
  try {
    return JSON.stringify({
      activeUser: Session.getActiveUser().getEmail(),
      effectiveUser: Session.getEffectiveUser().getEmail(),
      scriptId: ScriptApp.getScriptId(),
      spreadsheetId: CONFIG.SPREADSHEET_ID
    });
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}
