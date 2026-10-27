# Warehouse Management System Frontend

Frontend untuk aplikasi **Warehouse Management System (WMS)** berbasis React.
Project ini dirancang untuk membantu tim operasional mengelola stok, gudang,
dokumen pengadaan, penerimaan barang, transfer antar gudang, stock opname, dan
audit aktivitas dalam satu alur kerja yang terkontrol.

> Status: baseline frontend dan fondasi aplikasi sudah tersedia. Modul bisnis
> akan dikembangkan secara bertahap berdasarkan prioritas operasional.

## Fitur dan area bisnis

Project disiapkan untuk area berikut:

- autentikasi, session, role, permission, dan penugasan gudang;
- master data kategori, UOM, supplier, dan item;
- data gudang serta lokasi penyimpanan;
- saldo stok per gudang/lokasi, stok in-transit, dan stock ledger;
- purchase order;
- goods receipt atau penerimaan barang;
- stock transfer antar gudang;
- stock opname;
- audit log.

Frontend menggunakan pola **feature-based architecture** sehingga setiap domain
memiliki ruang pengembangan yang jelas dan tidak mencampur logika bisnis dengan
komponen UI generik.

## Tech stack

### Application

- React `19.3.1`
- React Router `7`
- Vite `8`
- TypeScript `5`
- Tailwind CSS `4`
- shadcn/ui
- TanStack Query `5` untuk server state dan cache API
- Zustand `5` untuk session auth dan state UI kecil
- Axios untuk HTTP client
- React Hook Form + Zod untuk form dan validasi
- TanStack Table untuk tabel operasional
- Decimal.js untuk perhitungan kuantitas desimal
- date-fns untuk format tanggal
- Sonner untuk notifikasi
- Lucide React untuk icon

### Quality dan development

- Vitest
- Testing Library
- MSW untuk mock API
- ESLint
- OpenAPI TypeScript untuk menghasilkan tipe dari schema FastAPI
- Docker Compose untuk development dengan hot reload

## Persyaratan

Pilih salah satu cara menjalankan project:

### Cara lokal

- Node.js `22` atau versi LTS yang kompatibel;
- npm;
- backend FastAPI berjalan atau URL API yang dapat diakses.

### Cara Docker

- Docker Desktop;
- Docker Compose plugin.

## Instalasi lokal

Clone repository, kemudian masuk ke folder project:

```powershell
git clone <repository-url>
cd warehouse_app
```

Install dependency:

```powershell
npm install
```

Salin file environment:

```powershell
Copy-Item .env.example .env
```

Sesuaikan nilai API pada `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Jalankan development server:

```powershell
npm run dev
```

Buka aplikasi pada:

```text
http://localhost:5173
```

## Menjalankan dengan Docker

Project ini dikonfigurasi untuk **development mode** menggunakan Vite di dalam
container Node. Source code di-mount ke container sehingga perubahan file dapat
langsung diproses oleh hot reload.

Jalankan:

```powershell
docker compose -f docker-compose.dev.yml up --build
```

Buka:

```text
http://localhost:5173
```

Hentikan container:

```powershell
docker compose -f docker-compose.dev.yml down
```

Melihat log:

```powershell
docker compose -f docker-compose.dev.yml logs -f frontend
```

Konfigurasi port dan URL API dapat diletakkan di `.env`:

```env
FRONTEND_DEV_PORT=5173
VITE_API_BASE_URL=http://localhost:8000
```

> `VITE_API_BASE_URL` digunakan oleh kode JavaScript di browser. Jika backend
> berjalan di host, gunakan `http://localhost:8000`, bukan nama service Docker
> seperti `http://backend:8000`. Backend juga harus mengizinkan origin
> `http://localhost:5173` melalui CORS.

## Perintah development

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan Vite development server. |
| `npm run typecheck` | Memeriksa tipe TypeScript. |
| `npm run lint` | Menjalankan ESLint. |
| `npm test` | Menjalankan test sekali. |
| `npm run test:watch` | Menjalankan test dalam watch mode. |
| `npm run build` | Memeriksa tipe dan membuat production bundle. |
| `npm run preview` | Menyajikan hasil build secara lokal. |
| `npm run generate:api-types` | Menghasilkan tipe TypeScript dari OpenAPI backend. |

Sebelum membuat commit, jalankan:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## Struktur project

```text
warehouse_app/
├── public/                 # aset statis
├── src/
│   ├── app/                # provider, router, dan komposisi aplikasi
│   ├── components/
│   │   ├── layout/         # shell, sidebar, topbar, page header
│   │   ├── shared/         # komponen lintas fitur
│   │   └── ui/             # primitive UI dan komponen shadcn/ui
│   ├── features/           # modul bisnis WMS
│   ├── hooks/              # reusable hooks
│   ├── lib/                # API client, query, error, utility
│   ├── mocks/              # handler MSW
│   ├── pages/              # page composition
│   ├── styles/             # style global
│   ├── test/               # setup testing
│   ├── types/              # tipe domain/API
│   └── main.tsx            # entry point React 19
├── docs/                   # dokumentasi project lokal
├── docker-compose.dev.yml  # Docker development
├── Dockerfile.dev          # image Node untuk development
├── package.json            # scripts dan dependency
├── vite.config.ts          # konfigurasi Vite dan alias @
└── vitest.config.ts        # konfigurasi Vitest
```

Dokumentasi struktur yang lebih lengkap tersedia pada
[`docs/CORE/FOLDER_STRUCTURE.MD`](./docs/CORE/FOLDER_STRUCTURE.MD).
Panduan UI/UX tersedia pada [`docs/CORE/DESIGN.MD`](./docs/CORE/DESIGN.MD).

## Aturan arsitektur

1. Data API seperti stok, PO, GR, transfer, dan opname dikelola oleh TanStack
   Query, bukan disalin ke Zustand.
2. Zustand hanya digunakan untuk session auth dan state UI kecil.
3. API function tidak boleh berisi JSX atau bergantung langsung pada hook React.
4. Komponen halaman harus tetap tipis; logika domain diletakkan di feature
   terkait.
5. Feature tidak mengimpor komponen internal feature lain secara langsung.
6. Komponen yang bersifat generik berada di `components/ui` atau
   `components/shared`; komponen yang memahami domain WMS berada di feature.
7. Kuantitas dan nilai desimal dihitung menggunakan Decimal.js, bukan
   `parseFloat`.
8. Filter dan pagination tabel disimpan pada URL agar dapat di-refresh dan
   dibagikan.

## Integrasi API

Base URL API berasal dari:

```env
VITE_API_BASE_URL=http://localhost:8000
```

HTTP client tersedia pada `src/lib/api-client.ts` dan secara otomatis
menyisipkan bearer token dari auth store jika session aktif.

Jika backend menyediakan schema OpenAPI pada
`http://localhost:8000/openapi.json`, generate tipe API dengan:

```powershell
npm run generate:api-types
```

File hasil generate diletakkan di:

```text
src/types/api.generated.ts
```

File generated sebaiknya tidak diedit secara manual. Perubahan kontrak API harus
berasal dari backend lalu tipe di-generate ulang.

## Testing

Test component dan perilaku user menggunakan:

- Vitest sebagai test runner;
- Testing Library untuk render dan query berbasis aksesibilitas;
- `user-event` untuk interaksi pengguna;
- MSW untuk mem-mock request API pada level network.

Test baru sebaiknya mencakup state berikut jika relevan:

- loading;
- data berhasil;
- empty result;
- error API;
- permission tidak mencukupi;
- mutation berhasil dan gagal.

## Environment dan keamanan

Jangan commit file berikut:

- `.env`;
- token atau credential;
- response API produksi;
- file lokal `AGENTS.MD`;
- dokumentasi lokal yang sudah dikecualikan oleh `.gitignore`.

Hanya variable yang diawali `VITE_` yang dapat digunakan pada kode frontend.
Jangan menaruh secret backend pada variable tersebut karena nilainya akan masuk
ke bundle browser.

## Dokumentasi tambahan

Dokumentasi desain dan struktur folder tersedia secara lokal pada:

```text
docs/CORE/DESIGN.MD
docs/CORE/FOLDER_STRUCTURE.MD
```

Folder `docs/` dan file `AGENTS.MD` sengaja dikecualikan dari Git melalui
`.gitignore`, sehingga dokumentasi tersebut tidak ikut dipush ke repository
GitHub. Dokumentasi API sebaiknya dikelola di repository backend atau ditambahkan
sebagai dokumentasi publik tersendiri jika dibutuhkan oleh contributor.

## Status validasi baseline

Baseline project telah divalidasi dengan:

```text
npm run typecheck  ✅
npm run lint       ✅
npm test           ✅
npm run build      ✅
npm audit          ✅
```