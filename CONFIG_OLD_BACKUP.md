# BACKUP KONFIGURASI LAMA SIASTA (SEBELUM MIGRASI)

Dokumen ini mencatat seluruh konfigurasi, ID proyek Google Apps Script, Google Spreadsheet, Google Drive, dan URL deployment yang digunakan pada lingkungan SIASTA sebelumnya.

---

## 📌 Rincian Konfigurasi Lama (Old Environment)

| Komponen | Nilai / URL Lama |
| :--- | :--- |
| **Nama Proyek** | SIASTA - Sistem Informasi Alih Media Arsip Statis |
| **Google Apps Script ID** | `1S_DgdN2c_bdesSZfSSx_n3OL420shlikdsxEWMTF-_8B06y8PrPLnJD4` |
| **URL Script Editor GAS** | [https://script.google.com/d/1S_DgdN2c_bdesSZfSSx_n3OL420shlikdsxEWMTF-_8B06y8PrPLnJD4/edit](https://script.google.com/d/1S_DgdN2c_bdesSZfSSx_n3OL420shlikdsxEWMTF-_8B06y8PrPLnJD4/edit) |
| **Google Spreadsheet ID** | `1eERa08ccRqPJp7r_iGddzcnWnI1NnYn4UDl3_60CzK0` |
| **URL Spreadsheet** | [https://docs.google.com/spreadsheets/d/1eERa08ccRqPJp7r_iGddzcnWnI1NnYn4UDl3_60CzK0/edit](https://docs.google.com/spreadsheets/d/1eERa08ccRqPJp7r_iGddzcnWnI1NnYn4UDl3_60CzK0/edit) |
| **ID Deployment Aktif Terakhir** | `AKfycbxIbcIiJY3FpeBJM9hC40_GYXNz-hIWgIcVZyvIm1NQaSj2TeJ5lxQ4VsG1OxEw077B` (Versi @69) |
| **URL Web App Live** | [https://script.google.com/macros/s/AKfycbxIbcIiJY3FpeBJM9hC40_GYXNz-hIWgIcVZyvIm1NQaSj2TeJ5lxQ4VsG1OxEw077B/exec](https://script.google.com/macros/s/AKfycbxIbcIiJY3FpeBJM9hC40_GYXNz-hIWgIcVZyvIm1NQaSj2TeJ5lxQ4VsG1OxEw077B/exec) |
| **Target Eksekusi Akun** | `USER_DEPLOYING` (Akun pemilik lama) |

---

## 📂 Struktur Sheet Basis Data Lama
Sheet aktif pada spreadsheet lama:
1. `master_arsip` (32 kolom)
2. `master_staf` (9 kolom)
3. `berita_acara` (15 kolom)
4. `log_aktivitas` (8 kolom)
5. `pengaturan` (4 kolom)
6. `kode_asal_arsip` (4 kolom)

---

## 🔄 Rincian Lingkungan Baru (New Target Environment)

| Komponen | Nilai / URL Baru |
| :--- | :--- |
| **Google Apps Script ID** | `1BA5rFvxRcszqyltzolfb8zp0xzC5vWwe1v1UqTI7FE4deBjT-cnSQt9I` |
| **URL Script Editor GAS** | [https://script.google.com/u/0/home/projects/1BA5rFvxRcszqyltzolfb8zp0xzC5vWwe1v1UqTI7FE4deBjT-cnSQt9I/edit](https://script.google.com/u/0/home/projects/1BA5rFvxRcszqyltzolfb8zp0xzC5vWwe1v1UqTI7FE4deBjT-cnSQt9I/edit) |
| **Google Spreadsheet ID** | `1c3caYKmVd1nt46lmqxxAEm8wVPQWwMsybqrz4OzBoSM` |
| **URL Spreadsheet** | [https://docs.google.com/spreadsheets/d/1c3caYKmVd1nt46lmqxxAEm8wVPQWwMsybqrz4OzBoSM/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1c3caYKmVd1nt46lmqxxAEm8wVPQWwMsybqrz4OzBoSM/edit?usp=sharing) |
| **Google Drive** | Mengikuti akun Google Apps Script & Spreadsheet baru (`USER_DEPLOYING`) |

*Dicatat pada tanggal migrasi: 21 September 2026*
