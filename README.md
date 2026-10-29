# Volunteer Match

Volunteer Match adalah platform yang menghubungkan mahasiswa dengan NGO untuk mengikuti kegiatan sukarelawan, mengelola proyek sosial, dan mencatat pengalaman serta kredensial volunteer.

## Fitur

| Role | Fitur |
| --- | --- |
| Student | Profil, rekomendasi project, pendaftaran, kehadiran, kredensial |
| NGO | Verifikasi organisasi, membuat project, mengelola pendaftar dan kehadiran |
| Admin | Review project, verifikasi NGO, manajemen pengguna |
| Campus | Verifikasi kredensial dan laporan kegiatan mahasiswa |

## Tech Stack

- Frontend: Next.js 16, React, TypeScript, Tailwind CSS
- Backend: Laravel, PHP, Laravel Sanctum
- Database: PostgreSQL 17
- Infrastructure: Docker dan Docker Compose

## Struktur Project

- `backend/` - Laravel REST API
- `frontend/` - Next.js frontend
- `compose.yaml` - Development services
- `compose.prod.yaml` - Production services
- `compose.test.yaml` - Backend test environment
- `DOCKER_SETUP.md` - Panduan Docker

## Persyaratan

- Git
- Docker Desktop dan Docker Compose
- Port 3000, 8000, dan 5433 tersedia

## Instalasi dan Menjalankan Project

### 1. Clone repository

`git clone https://github.com/Central-Saga/Elga-Project2-Volunteer-Match.git`

Masuk ke folder `Elga-Project2-Volunteer-Match`.

### 2. Jalankan Docker

Pastikan Docker Desktop aktif, kemudian jalankan:

`docker compose up -d --build`

Pada startup pertama, service menyiapkan dependencies, environment backend, dan migration database.

### 3. Akses aplikasi

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API (legacy) | http://localhost:8000/api |
| Backend API (versioned) | http://localhost:8000/api/v1 |
| Health check | http://localhost:8000/up |
| PostgreSQL | localhost:5433 |

### 4. Periksa status

`docker compose ps`

`docker compose logs --tail=80 backend`

`docker compose logs --tail=80 frontend`

### 5. Hentikan service

`docker compose down`

Perintah tersebut tidak menghapus volume database. Hindari `docker compose down -v` kecuali benar-benar ingin menghapus data lokal.

### Menjalankan mode produksi

Salin `.env.prod.example` menjadi `.env.prod`, lalu isi `APP_KEY` dan `DB_PASSWORD` dengan nilai rahasia yang kuat. Buat key Laravel dengan:

`docker run --rm php:8.4-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"`

Atur `APP_URL`, `CORS_ALLOWED_ORIGINS`, dan `NEXT_PUBLIC_API_URL` sesuai domain publik deployment. `NEXT_PUBLIC_API_URL` dimasukkan ke bundle browser pada saat build.

Bangun dan jalankan stack produksi secara terpisah dari Compose development:

`docker compose --env-file .env.prod -f compose.prod.yaml up -d --build`

Stack ini membuat build Next.js production dan menjalankannya melalui `npm start`, menggunakan Apache/PHP dengan OPcache serta optimasi Laravel, dan menetapkan `APP_ENV=production` serta `APP_DEBUG=false`. Frontend dan backend memiliki healthcheck masing-masing. Gunakan HTTPS dan reverse proxy/TLS sebelum mengekspos layanan ke internet.

Untuk hanya menguji build frontend production tanpa menjalankan stack produksi:

`docker compose -f compose.test.yaml --profile production-build build frontend-build`

## Environment Configuration

- Backend menggunakan `backend/.env.example`.
- Frontend menggunakan `frontend/.env.example`.
- `NEXT_PUBLIC_API_URL` menentukan URL Laravel API.
- `CORS_ALLOWED_ORIGINS` menentukan origin frontend yang diizinkan.
- Respons JSON API menggunakan `success`, `message`, `data`, dan `errors`; endpoint `/api` tetap tersedia untuk kompatibilitas klien lama.
- Jangan commit `.env`, password, token, atau kredensial asli.

Konfigurasi dalam Docker Compose ditujukan untuk development lokal, bukan production tanpa pengamanan tambahan.

## Akun Demo

Tidak tersedia akun demo dengan email/password tetap yang dijamin aktif setelah instalasi.

Untuk percobaan lokal, buat akun Student atau NGO melalui halaman registrasi. Registrasi Student membutuhkan data kampus yang valid.

Akun Admin dan Campus harus disiapkan secara terotorisasi oleh pengelola aplikasi. Jangan menyimpan password akun pribadi di README publik.

### Alur demo

1. Student mendaftar dan melengkapi profil.
2. NGO mendaftar, melengkapi profil dan mengajukan verifikasi.
3. Admin memverifikasi NGO dan meninjau project.
4. Student mendaftar pada project yang dipublikasikan.
5. NGO mengelola pendaftar dan kehadiran volunteer.

## Testing

Jalankan pengujian Laravel menggunakan database test terpisah:

`docker compose -f compose.test.yaml run --rm backend-test`

Pengujian berhasil apabila command selesai dengan exit code 0.

## Screenshots

### Login
![Volunteer Match Login](docs/screenshots/login.png)

### NGO Dashboard
![NGO Dashboard](docs/screenshots/ngo-dashboard.png)

### NGO Project Management
![NGO Projects](docs/screenshots/ngo-projects.png)

### Student Activity
![Student Activity](docs/screenshots/student-activity.png)

### Credential Verification
![Credential Verification](docs/screenshots/credential-verification.png)

## Troubleshooting

- Docker gagal terhubung: periksa Docker Desktop dan `docker info`.
- Frontend tidak tampil: periksa `docker compose logs frontend`.
- Backend gagal: periksa `docker compose logs backend`.
- Database gagal: pastikan service PostgreSQL healthy.
- API tidak dapat diakses: periksa URL backend dan konfigurasi CORS.
- Port bentrok: periksa container lain sebelum menghentikan service.

## Dokumentasi Tambahan

- [Docker Setup](DOCKER_SETUP.md)
- [Production Compose](compose.prod.yaml)
- [Backend Environment](backend/.env.example)
- [Frontend Environment](frontend/.env.example)

---

Volunteer Match - Connecting students with meaningful volunteer opportunities.
