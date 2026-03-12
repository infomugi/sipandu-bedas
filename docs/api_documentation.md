# Sipandu Bedas API Documentation

Base URL: `http://localhost:3000`

## 1. Users Management

### Get All Users

- **URL**: `/api/users`
- **Method**: `GET`
- **Response**: `{ success: boolean, data: array }`

### Get User by ID

- **URL**: `/api/users/:id`
- **Method**: `GET`
- **Response**: `{ success: boolean, data: object }`

### Create User

- **URL**: `/api/users`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "nama_lengkap": "string",
    "nik": "string",
    "email": "string",
    "no_hp": "string",
    "password": "string",
    "rw": "string",
    "rt": "string",
    "desa": "string",
    "kecamatan": "string",
    "kabupaten": "string",
    "role": "string (default: 'kader')"
  }
  ```
- **Response**: `{ success: true, message: 'User ditambahkan', insertId: number }`

### Update User

- **URL**: `/api/users/:id`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "nama_lengkap": "string",
    "nik": "string",
    "email": "string",
    "no_hp": "string",
    "rw": "string",
    "rt": "string",
    "role": "string",
    "is_active": "boolean"
  }
  ```

### Delete User

- **URL**: `/api/users/:id`
- **Method**: `DELETE`

---

## 2. Keluarga (Family)

### Get All Active Keluarga

- **URL**: `/api/keluarga`
- **Method**: `GET`

### Create Keluarga

- **URL**: `/api/keluarga`
- **Method**: `POST`
- **Body**:
  `{ no_kk, kader_id, alamat_lengkap, rt, rw, status_kesejahteraan, status_asuransi, pekerjaan_kk, estimasi_pendapatan, tgl_pendaftaran }`

### Update Keluarga

- **URL**: `/api/keluarga/:id`
- **Method**: `PUT`

### Delete (Soft) Keluarga

- **URL**: `/api/keluarga/:id`
- **Method**: `DELETE`

---

## 3. Anggota Keluarga (Family Members)

### Get Anggota by Keluarga ID

- **URL**: `/api/keluarga/:keluarga_id/anggota`
- **Method**: `GET`

### Create Anggota

- **URL**: `/api/anggota`
- **Method**: `POST`
- **Body**:
  `{ keluarga_id, nik, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, status_keluarga, status_asuransi, pendidikan_terakhir, pekerjaan }`

### Update Anggota

- **URL**: `/api/anggota/:id`
- **Method**: `PUT`

---

## 4. Pengajuan SPM

### Get All Pengajuan

- **URL**: `/api/pengajuan`
- **Method**: `GET`

### Create Pengajuan

- **URL**: `/api/pengajuan`
- **Method**: `POST`
- **Body**: `{ kader_id, keluarga_id, jenis_spm, ref_id }`

### Update Status Pengajuan

- **URL**: `/api/pengajuan/:id/status`
- **Method**: `PUT`
- **Body**: `{ status, catatan, updated_by }`

---

## 5. Analytics & Views

### Get Complete Family Data

- **URL**: `/api/view/keluarga-lengkap`
- **Method**: `GET`
