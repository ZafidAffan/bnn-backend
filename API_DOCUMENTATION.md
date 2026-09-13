# API Documentation — Sistem Informasi Pemantauan Surat Masuk (BNNP DIY)

Dokumentasi ini menjelaskan seluruh endpoint REST API backend Node.js/Express untuk sistem pemantauan surat masuk.

## Daftar Isi
1. [Informasi Umum](#informasi-umum)
2. [Autentikasi](#autentikasi)
3. [Modul: Surat Masuk](#modul-surat-masuk)
4. [Modul: Surat Aksi](#modul-surat-aksi)
5. [Modul: Disposisi](#modul-disposisi)
6. [Modul: Template Perintah](#modul-template-perintah)
7. [Modul: Tracking](#modul-tracking)
8. [Format Response Error](#format-response-error)

---

## Informasi Umum

**Base URL (lokal):** `http://localhost:3000/api`

| Modul | Base Path |
|---|---|
| Auth | `/api/auth` |
| Surat Masuk | `/api/surat-masuk` |
| Surat Aksi | `/api/aksi` |
| Disposisi | `/api/disposisi` |
| Template Perintah | `/api/template-perintah` |
| Tracking | `/api/tracking` |

File yang diupload dapat diakses secara statis melalui:
```
GET /uploads/:namafile
```

> Catatan: dokumentasi endpoint `/api/auth` tidak disertakan karena kode controller/route-nya belum diberikan.

---

## Autentikasi

Semua endpoint (kecuali auth) dilindungi oleh `authMiddleware` berbasis **JWT**.

**Cara mengirim token**, salah satu dari:
- Header: `Authorization: Bearer <token>`
- Query string: `?token=<token>`

Jika token tidak ada atau tidak valid, response:
```json
// 401 Unauthorized
{ "message": "Unauthorized: token tidak ditemukan" }
```
```json
// 401 Unauthorized
{ "message": "Unauthorized: token tidak valid" }
```

Payload JWT yang di-decode disimpan di `req.user` dengan bentuk:
```json
{ "id_user": 0, "role": "umum", "divisi": "..." }
```

### Role-based Access (`roleMiddleware`)

Beberapa endpoint dibatasi berdasarkan role, contoh: `roleMiddleware('umum')`.
Jika role user tidak termasuk role yang diizinkan:
```json
// 403 Forbidden
{ "message": "Forbidden: akses ditolak" }
```

Role yang dikenali pada sistem ini: `umum`, `kepala`, `divisi` (kemungkinan juga role lain seperti `resepsionis`/`admin` tergantung implementasi auth).

---

## Modul: Surat Masuk

Base path: `/api/surat-masuk`

### 1. Tambah Surat Masuk
`POST /api/surat-masuk/`

- **Auth:** wajib (token)
- **Content-Type:** `multipart/form-data`
- **File field:** `file_surat` (wajib, PDF)

**Body (form-data):**
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| no_surat | string | ✅ | Nomor surat |
| tanggal_surat | date | ✅ | Tanggal surat dibuat |
| tanggal_terima | date | ✅ | Tanggal surat diterima |
| dari | string | ✅ | Pengirim surat |
| perihal | string | ✅ | Perihal surat |
| jenis_surat | string | ✅ | Jenis surat |
| file_surat | file | ✅ | File PDF surat |

**Response sukses (201):**
```json
{
  "message": "Surat masuk berhasil ditambahkan",
  "kode_tracking": "TRK-1699999999999"
}
```

**Response gagal:**
```json
// 400 - file tidak diupload
{ "message": "File PDF wajib diupload" }
```
```json
// 400 - field tidak lengkap
{ "message": "Semua field wajib diisi" }
```
```json
// 500 - gagal simpan
{ "message": "Gagal menyimpan surat" }
```

**Catatan:**
- Setiap surat baru otomatis mendapat `kode_tracking` unik format `TRK-<timestamp>` dan `status` awal `Menunggu`.
- Setelah data tersimpan ke MySQL, sistem juga mengirim salinan data ke **Google Apps Script** (`APPS_SCRIPT_URL`) sebagai backup ke Google Sheets. Jika pengiriman ke Google Sheets gagal, request **tetap dianggap sukses** (error hanya dicatat di log server, tidak dikembalikan ke user).

---

### 2. Ambil Semua Surat Masuk
`GET /api/surat-masuk/`

- **Auth:** wajib

**Query Parameters:**
| Param | Tipe | Wajib | Keterangan |
|---|---|---|---|
| search | string | ❌ | Mencari di kolom `no_surat`, `dari`, `perihal`, `jenis_surat` |

**Response sukses (200):**
```json
[
  {
    "id_surat": 1,
    "no_surat": "001/X/2026",
    "tanggal_surat": "2026-09-01",
    "tanggal_terima": "2026-09-02",
    "dari": "Kementerian ABC",
    "perihal": "Undangan Rapat",
    "jenis_surat": "Undangan",
    "file_surat": "/uploads/1699999999999.pdf",
    "kode_tracking": "TRK-1699999999999",
    "status": "Menunggu",
    "created_at": "2026-09-02T08:00:00.000Z"
  }
]
```
Data diurutkan berdasarkan `created_at DESC` (terbaru dulu).

---

### 3. Ambil Detail Surat
`GET /api/surat-masuk/:id`

- **Auth:** wajib

**Response sukses (200):** seluruh kolom tabel `surat_masuk` untuk `id_surat` terkait.

**Response gagal:**
```json
// 404
{ "message": "Surat tidak ditemukan" }
```
```json
// 500
{ "message": "Gagal mengambil detail surat" }
```

---

### 4. Update Surat
`PUT /api/surat-masuk/:id`

- **Auth:** wajib
- **Content-Type:** `multipart/form-data` (file opsional)

**Body (form-data):**
| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| no_surat | string | ✅ | |
| tanggal_surat | date | ✅ | |
| tanggal_terima | date | ✅ | |
| dari | string | ✅ | |
| perihal | string | ✅ | |
| jenis_surat | string | ✅ | |
| status | string | ✅ | |
| file_surat | file | ❌ | Jika diisi, file lama akan diganti |

**Response sukses (200):**
```json
{ "message": "Surat berhasil diperbarui" }
```
**Response gagal (500):**
```json
{ "message": "Gagal update surat" }
```

---

### 5. Hapus Surat
`DELETE /api/surat-masuk/:id`

- **Auth:** wajib

**Response sukses (200):**
```json
{ "message": "Surat berhasil dihapus" }
```
**Response gagal (500):**
```json
{ "message": "Gagal menghapus surat" }
```

---

## Modul: Surat Aksi

Base path: `/api/aksi`

### 1. Terima Surat
`PUT /api/aksi/:id/terima`

- **Auth:** wajib
- **Role:** `umum`

Mengubah `status` surat menjadi `Diterima` dan mencatat riwayat ke `surat_tracking`.

**Response sukses (200):**
```json
{ "message": "Surat diterima & tracking tercatat" }
```
**Response gagal:**
```json
// 400
{ "message": "ID surat tidak valid" }
```
```json
// 404
{ "message": "Surat tidak ditemukan" }
```
```json
// 500
{ "message": "<pesan error SQL>" }
```

---

### 2. Kirim ke Kepala
`PUT /api/aksi/:id/kirim-ke-kepala`

- **Auth:** wajib
- **Role:** `umum`

Mengubah `status` surat menjadi `Disposisi Kepala` dan mencatat riwayat ke `surat_tracking` dengan keterangan `"Surat dikirim ke Kepala"`.

**Response sukses (200):**
```json
{ "message": "Surat berhasil dikirim ke Kepala" }
```
**Response gagal:** sama seperti endpoint *Terima Surat* di atas.

---

## Modul: Disposisi

Base path: `/api/disposisi`

### 1. Ambil Daftar Divisi
`GET /api/disposisi/divisi`

- **Auth:** wajib

**Response (200):**
```json
[
  { "id_divisi": 1, "nama_divisi": "Bidang Pemberantasan" }
]
```

---

### 2. Ambil Sub Divisi berdasarkan Divisi
`GET /api/disposisi/divisi/:id_divisi/subdivisi`

- **Auth:** wajib

**Response (200):**
```json
[
  { "id_subdivisi": 1, "nama_subdivisi": "Seksi A", "keterangan": "..." }
]
```

---

### 3. Ambil Disposisi berdasarkan Divisi
`GET /api/disposisi/divisi/:id_divisi`

- **Auth:** wajib

Perilaku bergantung pada `req.user.role`:
- Jika role **umum** → mengembalikan **semua** disposisi (parameter `id_divisi` di URL diabaikan).
- Selain itu → hanya disposisi milik `ke_divisi = id_divisi`.

Data digabung (`LEFT JOIN`) dengan info surat (`no_surat`, `tanggal_surat`, `tanggal_terima`, `dari`, `perihal`, `jenis_surat`), diurutkan `tanggal_disposisi DESC`.

---

### 4. Ambil Semua Disposisi (Umum)
`GET /api/disposisi/`

- **Auth:** wajib
- **Role:** `umum`

Mengembalikan seluruh baris tabel `disposisi`, diurutkan `tanggal_disposisi DESC`.

---

### 5. Tambah Disposisi dari Kepala
`POST /api/disposisi/kepala`

- **Auth:** wajib
- **Role:** `kepala`

**Body (JSON):**
| Field | Tipe | Wajib |
|---|---|---|
| id_surat | number | ✅ |
| ke_divisi | number | ✅ |
| perintah | string | ❌ (default: `"Disposisi Kepala"`) |
| keterangan | string | ❌ |

Efek: insert ke `disposisi` (`status_konfirmasi = 'belum diterima'`, `status_proses = 'menunggu_divisi'`), update `surat_masuk.status = 'Disposisi Divisi'`, dan insert ke `surat_tracking`.

**Response sukses (201):**
```json
{
  "message": "Disposisi Kepala berhasil dan langsung diteruskan ke Divisi",
  "id_disposisi": 10,
  "status_proses": "menunggu_divisi"
}
```
**Response gagal (400):**
```json
{ "message": "id_surat dan ke_divisi wajib diisi" }
```

---

### 6. Tambah Disposisi Umum
`POST /api/disposisi/umum`

- **Auth:** wajib
- **Role:** `umum`

**Body (JSON):** sama seperti endpoint Disposisi Kepala (default `perintah` = `"Disposisi"`).

Efek: insert ke `disposisi`, lalu insert ke `surat_tracking` dengan status `Disposisi Divisi (<nama_divisi>)`.

**Response sukses (201):**
```json
{
  "message": "Disposisi Umum berhasil dan tracking tersimpan",
  "id_disposisi": 11,
  "status_proses": "menunggu_divisi"
}
```

---

### 7. Konfirmasi Disposisi (Umum)
`PUT /api/disposisi/:id_disposisi/konfirmasi-umum`

- **Auth:** wajib
- **Role:** `umum`

Efek: update `disposisi` (`status_proses = 'menunggu_divisi'`, `status_konfirmasi = 'diterima'`), update `surat_masuk.status = 'Disposisi Divisi'`, insert `surat_tracking`.

**Response sukses (200):**
```json
{ "message": "Disposisi dikonfirmasi, status disposisi & surat berhasil diperbarui" }
```
**Response gagal (404):**
```json
{ "message": "Disposisi tidak ditemukan" }
```

---

### 8. Konfirmasi Disposisi (Divisi)
`PUT /api/disposisi/:id_disposisi/konfirmasi-divisi`

- **Auth:** wajib
- **Role:** `divisi`

Efek: update `disposisi` (`status_konfirmasi = 'diterima'`, `tanggal_konfirmasi = NOW()`), insert `surat_tracking` dengan status `Disposisi Divisi Diterima`.

**Response sukses (200):**
```json
{ "message": "Disposisi berhasil dikonfirmasi dan tracking tersimpan" }
```

---

### 9. Update Status Disposisi
`PUT /api/disposisi/:id_disposisi/status`

- **Auth:** wajib (tanpa pembatasan role spesifik)

**Body (JSON):**
```json
{ "newStatus": "diproses" }
```

**Response sukses (200):**
```json
{ "message": "Status berhasil diperbarui" }
```

---

### 10. Kirim ke Sub Divisi
`POST /api/disposisi/:id_disposisi/subdivisi`

- **Auth:** wajib
- **Role:** `divisi`

**Body (JSON):**
| Field | Tipe | Wajib |
|---|---|---|
| ke_divisi_sub | number | ✅ |
| keterangan | string | ❌ |

Efek: update `disposisi` (set `id_subdivisi`, `status_proses = 'selesai'`), insert `surat_tracking` dengan status `Disposisi Sub Divisi`.

**Response sukses (201):**
```json
{
  "message": "Disposisi berhasil diteruskan ke Sub Divisi",
  "id_disposisi": 5,
  "id_subdivisi": 2,
  "status_proses": "selesai"
}
```
**Response gagal (400):**
```json
{ "message": "ke_divisi_sub wajib diisi" }
```

---

## Modul: Template Perintah

Base path: `/api/template-perintah`

### 1. Ambil Semua Template Perintah
`GET /api/template-perintah/`

- **Auth:** wajib (asumsi mengikuti pola modul lain — pastikan route sudah memasang `authMiddleware`)

**Response sukses (200):**
```json
[
  { "id_perintah": 1, "isi_perintah": "Mohon ditindaklanjuti segera" }
]
```
Diurutkan berdasarkan `id_perintah ASC`.

**Response gagal (500):**
```json
{ "message": "Gagal mengambil template" }
```

---

## Modul: Tracking

Base path: `/api/tracking`

### 1. Ambil Semua Tracking
`GET /api/tracking/`

- **Auth:** wajib

**Response sukses (200):**
```json
[
  {
    "id_tracking": 1,
    "id_surat": 5,
    "no_surat": "001/X/2026",
    "perihal": "Undangan Rapat",
    "status": "Diterima",
    "keterangan": "Diterima oleh umum",
    "id_divisi": null,
    "id_user": 3,
    "waktu": "2026-09-02T09:00:00.000Z"
  }
]
```
Diurutkan `waktu DESC`. Bergabung (`INNER JOIN`) dengan `surat_masuk`.

---

### 2. Ambil Tracking berdasarkan ID Surat
`GET /api/tracking/surat/:id_surat`

- **Auth:** wajib

**Response sukses (200):** array riwayat tracking untuk surat tersebut (bergabung dengan `surat_masuk` dan `divisi`), diurutkan `waktu ASC`. Jika belum ada tracking, tetap mengembalikan **array kosong `[]`** dengan status 200 (bukan error).

**Response gagal (400):**
```json
{ "message": "id_surat wajib diisi" }
```

---

## Format Response Error

Sebagian besar error mengikuti pola umum berikut, meski beberapa endpoint sedikit berbeda (lihat detail masing-masing endpoint di atas):

```json
{
  "message": "<pesan error>",
  "error": "<detail error (opsional, tergantung endpoint)>"
}
```

| Kode | Arti |
|---|---|
| 400 | Input tidak valid / field wajib kosong |
| 401 | Token tidak ada atau tidak valid |
| 403 | Role tidak memiliki akses |
| 404 | Data tidak ditemukan |
| 500 | Kesalahan server / database |

---

## Catatan Arsitektur

- **Database:** MySQL, diakses via `mysql2`, koneksi terpusat di `config/db.js`.
- **Upload file:** `multer`, disimpan ke folder lokal `uploads/`, nama file otomatis diberi prefix timestamp agar unik. File dapat diakses publik lewat `/uploads/:namafile` (static route di `index.js`).
- **Integrasi eksternal:** modul Surat Masuk mengirim salinan data surat ke Google Apps Script/Google Sheets sebagai backup saat surat baru dibuat (best-effort, tidak memengaruhi response ke client jika gagal).
- **Alur status surat (umum):** `Menunggu` → `Diterima` → `Disposisi Kepala` → `Disposisi Divisi` → (opsional) `Disposisi Sub Divisi` → selesai diproses oleh divisi/sub-divisi terkait.
