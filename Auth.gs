/**
 * =========================================
 * SIASTA - Auth.gs
 * Login & Session Management
 * =========================================
 */

/**
 * Verifikasi kredensial sistem (username & password)
 * @param {string} username
 * @param {string} password
 * @returns {Object} Response
 */
function verifyAuthCredentials(username, password) {
  try {
    var validUser = (CONFIG.AUTH && CONFIG.AUTH.DEFAULT_USERNAME) ? CONFIG.AUTH.DEFAULT_USERNAME.toLowerCase() : 'siasta';
    var validPass = (CONFIG.AUTH && CONFIG.AUTH.DEFAULT_PASSWORD) ? CONFIG.AUTH.DEFAULT_PASSWORD : 'admin';
    
    if (!username || !password) {
      return jsonResponse(false, null, 'Harap isi username dan password.');
    }
    
    if (username.trim().toLowerCase() !== validUser || password !== validPass) {
      return jsonResponse(false, null, 'Username atau password salah. (Default user: siasta | pass: admin)');
    }
    
    return jsonResponse(true, null, 'Kredensial valid! Silakan pilih profil staf.');
  } catch (e) {
    return jsonResponse(false, null, 'Error validasi: ' + e.message);
  }
}

/**
 * Login staf dengan autentikasi
 * @param {string} username - Username login (siasta)
 * @param {string} password - Password login (admin)
 * @param {string} staffId - ID staf yang dipilih
 * @returns {Object} Response
 */
function login(username, password, staffId) {
  try {
    if (!username || !password) {
      return jsonResponse(false, null, 'Harap isi username dan password.');
    }
    
    var validUser = (CONFIG.AUTH && CONFIG.AUTH.DEFAULT_USERNAME) ? CONFIG.AUTH.DEFAULT_USERNAME.toLowerCase() : 'siasta';
    var validPass = (CONFIG.AUTH && CONFIG.AUTH.DEFAULT_PASSWORD) ? CONFIG.AUTH.DEFAULT_PASSWORD : 'admin';
    
    // Periksa password
    if (password !== validPass) {
      return jsonResponse(false, null, 'Password salah.');
    }
    
    var allStaf = [];
    try {
      allStaf = readAllData(CONFIG.SHEETS.MASTER_STAF);
    } catch (err) {
      Logger.log('Warning readAllData master_staf: ' + err.message);
    }
    
    if (!allStaf || allStaf.length === 0) {
      allStaf = getDummyStaffList();
    }
    
    var staf = null;
    if (staffId) {
      for (var i = 0; i < allStaf.length; i++) {
        if (allStaf[i].id === staffId) {
          staf = allStaf[i];
          break;
        }
      }
    }
    
    if (!staf) {
      var uClean = username.trim().toLowerCase();
      for (var j = 0; j < allStaf.length; j++) {
        var s = allStaf[j];
        if (
          (s.id && s.id.toLowerCase() === uClean) ||
          (s.nip && s.nip.replace(/\s+/g, '') === uClean.replace(/\s+/g, '')) ||
          (s.email && s.email.toLowerCase().indexOf(uClean) === 0) ||
          (s.nama && s.nama.toLowerCase().indexOf(uClean) !== -1)
        ) {
          staf = s;
          break;
        }
      }
    }
    
    // Default fallback jika akun adalah 'siasta' atau 'admin'
    if (!staf) {
      staf = allStaf.find(function(s) { return s.id === 'STAF-004' || (s.jabatan && s.jabatan.indexOf('Admin') !== -1); }) || allStaf[0];
    }
    
    if (!staf) {
      return jsonResponse(false, null, 'Profil staf tidak ditemukan.');
    }
    
    // Set session
    var userProps = PropertiesService.getUserProperties();
    userProps.setProperties({
      [CONFIG.SESSION.KEY_USER_ID]: staf.id,
      [CONFIG.SESSION.KEY_USER_NAME]: staf.nama,
      [CONFIG.SESSION.KEY_USER_JABATAN]: staf.jabatan,
      [CONFIG.SESSION.KEY_LOGIN_TIME]: new Date().toISOString()
    });
    
    // Log aktivitas
    try {
      logActivity('LOGIN', 'Auth', 'Login berhasil: ' + staf.nama + ' (' + staf.jabatan + ')');
    } catch (logErr) {}
    
    return jsonResponse(true, {
      id: staf.id,
      nama: staf.nama,
      jabatan: staf.jabatan
    }, 'Login berhasil! Mengalihkan ke dashboard...');
    
  } catch (e) {
    return jsonResponse(false, null, 'Error login: ' + e.message);
  }
}

/**
 * Logout staf
 */
function logout() {
  try {
    var user = getCurrentUser();
    if (user) {
      logActivity('LOGOUT', 'Auth', 'Logout: ' + user.nama);
    }
    
    var userProps = PropertiesService.getUserProperties();
    userProps.deleteAllProperties();
    
    return jsonResponse(true, null, 'Logout berhasil.');
  } catch (e) {
    return jsonResponse(false, null, 'Error logout: ' + e.message);
  }
}

/**
 * Get current logged-in user
 * @returns {Object|null} User info atau null
 */
function getCurrentUser() {
  try {
    var userProps = PropertiesService.getUserProperties();
    var userId = userProps.getProperty(CONFIG.SESSION.KEY_USER_ID);
    
    if (!userId) return null;
    
    // Check timeout
    var loginTime = userProps.getProperty(CONFIG.SESSION.KEY_LOGIN_TIME);
    if (loginTime) {
      var loginDate = new Date(loginTime);
      var now = new Date();
      var diffHours = (now - loginDate) / (1000 * 60 * 60);
      
      if (diffHours > CONFIG.SESSION.TIMEOUT_HOURS) {
        userProps.deleteAllProperties();
        return null;
      }
    }
    
    return {
      id: userId,
      nama: userProps.getProperty(CONFIG.SESSION.KEY_USER_NAME),
      jabatan: userProps.getProperty(CONFIG.SESSION.KEY_USER_JABATAN),
      loginTime: loginTime
    };
  } catch (e) {
    return null;
  }
}

/**
 * Check apakah user sudah login
 * @returns {boolean}
 */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

/**
 * Get daftar staf untuk dropdown login
 * @returns {Object} Response dengan array staf
 */
function getStaffList() {
  try {
    var cached = getFromCache('CACHE_STAFF_LIST');
    if (cached && cached.length > 0) {
      return jsonResponse(true, cached);
    }
    
    var allStaff = [];
    try {
      allStaff = readAllData(CONFIG.SHEETS.MASTER_STAF);
    } catch (e) {
      Logger.log('Warning read master_staf: ' + e.message);
    }
    
    var activeStaff = allStaff.filter(function(s) { return s.status === 'Aktif'; });
    
    // Jika masih kosong, gunakan dummy staff
    if (activeStaff.length === 0) {
      activeStaff = getDummyStaffList();
      try {
        activeStaff.forEach(function(s) {
          appendData(CONFIG.SHEETS.MASTER_STAF, s);
        });
      } catch (err) {}
    }
    
    var staffList = activeStaff.map(function(s) {
      return {
        id: s.id,
        nama: s.nama,
        nip: s.nip,
        jabatan: s.jabatan,
        email: s.email || '',
        status: s.status || 'Aktif'
      };
    });
    
    putInCache('CACHE_STAFF_LIST', staffList, 1800); // 30 mins
    return jsonResponse(true, staffList);
  } catch (e) {
    var dummyList = getDummyStaffList().map(function(s) {
      return {
        id: s.id,
        nama: s.nama,
        nip: s.nip,
        jabatan: s.jabatan,
        email: s.email || '',
        status: s.status || 'Aktif'
      };
    });
    return jsonResponse(true, dummyList);
  }
}

/**
 * Get current user info (callable from client)
 */
function getUserInfo() {
  var user = getCurrentUser();
  if (user) {
    return jsonResponse(true, user);
  }
  return jsonResponse(false, null, 'Belum login');
}
