/**
 * =========================================
 * SIASTA - DriveService.gs
 * Google Drive File Operations & Watermark
 * =========================================
 */

/**
 * Create folder structure di Google Drive
 * Panggil sekali saat setup awal
 */
function createFolderStructure() {
  try {
    var rootFolder;
    
    if (CONFIG.DRIVE_FOLDER_ID) {
      rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    } else {
      // Create root folder
      rootFolder = DriveApp.createFolder('SIASTA');
      Logger.log('Root Folder ID: ' + rootFolder.getId());
    }
    
    // Arsip Digital
    var arsipDigital = getOrCreateSubfolder(rootFolder, CONFIG.DRIVE_FOLDERS.ARSIP_DIGITAL);
    getOrCreateSubfolder(arsipDigital, CONFIG.DRIVE_FOLDERS.PELESTARIAN);
    getOrCreateSubfolder(arsipDigital, CONFIG.DRIVE_FOLDERS.AKSES);
    
    // Berita Acara
    getOrCreateSubfolder(rootFolder, CONFIG.DRIVE_FOLDERS.BERITA_ACARA);
    
    // Laporan
    var laporan = getOrCreateSubfolder(rootFolder, CONFIG.DRIVE_FOLDERS.LAPORAN);
    getOrCreateSubfolder(laporan, CONFIG.DRIVE_FOLDERS.LAPORAN_INTERNAL);
    getOrCreateSubfolder(laporan, CONFIG.DRIVE_FOLDERS.LAPORAN_EKSTERNAL);
    
    // Tanda Tangan
    getOrCreateSubfolder(rootFolder, CONFIG.DRIVE_FOLDERS.TANDA_TANGAN);
    
    // Backup
    getOrCreateSubfolder(rootFolder, CONFIG.DRIVE_FOLDERS.BACKUP);
    
    return jsonResponse(true, {
      rootFolderId: rootFolder.getId()
    }, 'Struktur folder berhasil dibuat! Root ID: ' + rootFolder.getId());
    
  } catch (e) {
    return jsonResponse(false, null, 'Error membuat folder: ' + e.message);
  }
}

/**
 * Get or create subfolder
 */
function getOrCreateSubfolder(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

/**
 * Get folder berdasarkan path dari root
 * @param {string} path - Contoh: "Arsip Digital/Pelestarian/KOM/B05"
 * @returns {Folder}
 */
function getFolderByPath(path) {
  var rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  var parts = path.split('/');
  var currentFolder = rootFolder;
  
  for (var i = 0; i < parts.length; i++) {
    currentFolder = getOrCreateSubfolder(currentFolder, parts[i]);
  }
  
  return currentFolder;
}

/**
 * Upload file ke Google Drive
 * @param {string} base64Data - File data dalam base64
 * @param {string} fileName - Nama file
 * @param {string} mimeType - MIME type
 * @param {string} folderPath - Path folder tujuan
 * @returns {Object} {id, url, name}
 */
function uploadFile(base64Data, fileName, mimeType, folderPath) {
  try {
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, fileName);
    
    var folder = getFolderByPath(folderPath);
    var file = folder.createFile(blob);
    
    // Set sharing (anyone with link can view)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      id: file.getId(),
      url: file.getUrl(),
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId(),
      viewUrl: 'https://drive.google.com/file/d/' + file.getId() + '/view',
      thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w400',
      name: file.getName(),
      size: file.getSize()
    };
    
  } catch (e) {
    throw new Error('Error upload file: ' + e.message);
  }
}

/**
 * Upload arsip file (pelestarian + akses copy)
 * @param {string} base64Data
 * @param {string} fileName
 * @param {string} mimeType
 * @param {string} kodeAsal - Kode asal arsip (KOM, LBJ, dll)
 * @param {string} nomorBox - Nomor box (B01, B02, dll)
 * @returns {Object} {pelestarian: {...}, akses: {...}}
 */
function uploadArsipFile(base64Data, fileName, mimeType, kodeAsal, nomorBox) {
  try {
    // Upload ke folder Pelestarian
    var pelestarianPath = CONFIG.DRIVE_FOLDERS.ARSIP_DIGITAL + '/' +
                          CONFIG.DRIVE_FOLDERS.PELESTARIAN + '/' +
                          kodeAsal + '/' + nomorBox;
    var pelestarianFile = uploadFile(base64Data, fileName, mimeType, pelestarianPath);
    
    // Upload copy ke folder Akses (bisa di-compress nanti)
    var aksesPath = CONFIG.DRIVE_FOLDERS.ARSIP_DIGITAL + '/' +
                    CONFIG.DRIVE_FOLDERS.AKSES + '/' +
                    kodeAsal + '/' + nomorBox;
    var aksesFile = uploadFile(base64Data, 'akses_' + fileName, mimeType, aksesPath);
    
    return {
      pelestarian: pelestarianFile,
      akses: aksesFile
    };
    
  } catch (e) {
    throw new Error('Error upload arsip: ' + e.message);
  }
}

/**
 * Apply watermark text ke metadata file
 * (Note: Full image watermark requires advanced image processing.
 *  Untuk GAS, kita gunakan description sebagai metadata watermark)
 * @param {string} fileId
 * @returns {boolean}
 */
function applyWatermark(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    var description = file.getDescription() || '';
    
    // Add watermark info ke description
    var watermarkInfo = '[WATERMARK] ' + CONFIG.WATERMARK.TEXT +
                        ' | Applied: ' + formatTanggal(new Date(), 'datetime') +
                        ' | SIASTA v' + CONFIG.APP.VERSION;
    
    file.setDescription(watermarkInfo + '\n' + description);
    
    return true;
  } catch (e) {
    Logger.log('Watermark error: ' + e.message);
    return false;
  }
}

/**
 * Get file info dari Drive
 */
function getFileInfo(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    return {
      id: file.getId(),
      name: file.getName(),
      size: file.getSize(),
      mimeType: file.getMimeType(),
      url: file.getUrl(),
      thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w400',
      lastUpdated: file.getLastUpdated()
    };
  } catch (e) {
    return null;
  }
}

/**
 * Upload tanda tangan staf
 */
function uploadTandaTangan(base64Data, stafNama) {
  try {
    var fileName = 'ttd_' + stafNama.replace(/\s+/g, '_') + '.png';
    var result = uploadFile(base64Data, fileName, 'image/png',
                           CONFIG.DRIVE_FOLDERS.TANDA_TANGAN);
    return jsonResponse(true, result, 'Tanda tangan berhasil diupload.');
  } catch (e) {
    return jsonResponse(false, null, 'Error upload tanda tangan: ' + e.message);
  }
}
