# Jejakstok — Sistem Manajemen Gudang

Frontend untuk **Jejakstok**, sistem manajemen gudang berbasis React yang
disiapkan untuk membantu tim mengelola stok, gudang, pengadaan, penerimaan,
transfer, stock opname, dan jejak aktivitas dalam satu alur kerja.

> **Status:** fondasi frontend, landing page, halaman login, branding, dan
> struktur feature-based sudah tersedia. Modul bisnis dan integrasi autentikasi
> backend dikembangkan secara bertahap.

## Gambaran umum

Jejakstok memiliki dua area utama:

1. **Landing page publik** pada `/`
   - dapat dilihat siapa pun tanpa login;
   - menggunakan konten JSON statis berbahasa Indonesia;
   - menjelaskan alur Terima → Simpan → Pindahkan → Hitung;
   - tidak mengambil data operasional atau memanggil API autentikasi.
2. **Ruang kerja** untuk pengguna terautentikasi
   - login pada `/login`;
   - dashboard informatif pada `/dashboard`;
   - modul stok, master data, PO, penerimaan, transfer, opname, pengguna, dan
     audit log disiapkan melalui feature-based architecture.

Halaman login mengirim kredensial ke endpoint autentikasi backend, menyimpan
refresh token secara lokal, memuat profil pengguna aktif, dan mengarahkan
pengguna yang berhasil login ke `/dashboard`. Akun yang digunakan harus sudah
tersedia pada backend.

## Area bisnis

Struktur aplikasi disiapkan untuk area berikut:

- autentikasi, session, role, permission, dan penugasan gudang;
- master data kategori, UOM, supplier, dan item;
- gudang serta lokasi penyimpanan;
- saldo stok per gudang/lokasi, stok in-transit, dan stock ledger;
- purchase order;
- goods receipt atau penerimaan barang;
- stock transfer antar-gudang;
- stock opname;
- audit log.

## Tech stack

### Aplikasi

- React `19.3.1`
- React Router `7`
- Vite `8`
- TypeScript `5`
- Tailwind CSS `4`
- shadcn/ui
- Poppins sebagai font utama, dibundel melalui `@fontsource/poppins`
- TanStack Query `5` untuk server state dan cache API
- Zustand `5` untuk session auth dan state UI kecil
- Axios untuk HTTP client
- React Hook Form + Zod untuk form dan validasi
- TanStack Table untuk tabel operasional
- Decimal.js untuk perhitungan kuantitas desimal
- date-fns untuk format tanggal
- Sonner untuk notifikasi
- Lucide React untuk ikon

### Quality dan development

- Vitest
- Testing Library
- MSW untuk mock API
- ESLint
- OpenAPI TypeScript untuk menghasilkan tipe dari schema FastAPI
- Docker Compose untuk development dengan hot reload

## Persyaratan

### Menjalankan secara lokal

- Node.js `22` atau versi LTS yang kompatibel;
- npm;
- backend FastAPI jika fitur yang membutuhkan API ingin diuji.

### Menjalankan dengan Docker

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

Landing page dapat dibuka langsung pada:

```text
http://localhost:5173/
```

## Menjalankan dengan Docker

Konfigurasi Docker yang dipertahankan adalah **development mode** menggunakan
Vite di dalam container Node. Source code di-mount ke container dan
`node_modules` menggunakan named volume agar hot reload tetap berjalan.

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

Melihat log frontend:

```powershell
docker compose -f docker-compose.dev.yml logs -f frontend
```

Konfigurasi port dan URL API:

```env
FRONTEND_DEV_PORT=5173
VITE_API_BASE_URL=http://localhost:8000
```

> `VITE_API_BASE_URL` digunakan oleh JavaScript di browser. Jika backend berjalan
> di host, gunakan `http://localhost:8000`, bukan nama service Docker seperti
> `http://backend:8000`. Backend juga harus mengizinkan origin
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
├── public/
│   └── assets/image/           # logo, ikon, dan ilustrasi WMS
├── src/
│   ├── app/                    # provider, router, dan komposisi aplikasi
│   │   └── guards/             # placeholder route/permission guard
│   ├── components/
│   │   ├── layout/             # AppShell dan layout aplikasi
│   │   ├── shared/             # komponen lintas fitur
│   │   └── ui/                 # primitive UI dan komponen shadcn/ui
│   ├── content/
│   │   └── landing/             # JSON landing, schema, dan loader
│   ├── features/
│   │   ├── auth/                # store, halaman login, komponen auth
│   │   ├── users/               # user, role, permission, assignment gudang
│   │   ├── master-data/         # kategori, UOM, supplier, item
│   │   ├── warehouses/          # gudang dan lokasi
│   │   ├── stock/               # saldo, in-transit, stock ledger
│   │   ├── purchase-orders/     # purchase order
│   │   ├── goods-receipts/      # penerimaan barang
│   │   ├── stock-transfers/     # transfer antar-gudang
│   │   ├── stock-opnames/       # stock opname
│   │   └── audit-logs/          # log audit
│   ├── hooks/                   # hook reusable lintas fitur
│   ├── lib/                     # API client, query, error, utility
│   ├── mocks/                   # handler MSW
│   ├── pages/                   # page composition publik dan umum
│   ├── styles/                  # stylesheet global dan font
│   ├── test/                    # setup dan helper testing
│   ├── types/                   # tipe domain/API bersama
│   └── main.tsx                 # entry point React 19
├── docs/                        # dokumentasi lokal yang di-ignore Git
├── docker-compose.dev.yml       # Compose development
├── Dockerfile.dev               # image Node untuk development
├── index.html                   # metadata, favicon, dan Vite entry
├── package.json                 # scripts dan dependency
├── vite.config.ts               # konfigurasi Vite dan alias @
└── vitest.config.ts             # konfigurasi Vitest
```

Halaman yang menjadi bagian dari domain tertentu ditempatkan di
`src/features/<feature>/pages/`. Contohnya:

```text
src/features/auth/
├── components/
├── pages/
│   └── LoginPage.tsx
└── store.ts
```

Landing page publik berada di [src/pages/LandingPage.tsx](./src/pages/LandingPage.tsx)
karena bukan bagian dari domain autentikasi.

Dokumentasi struktur yang lebih lengkap tersedia pada
[FOLDER_STRUCTURE.MD](./docs/CORE/FOLDER_STRUCTURE.MD).

## Aset dan branding

Aset visual tersedia di `public/assets/image/`:

- `banner.jpg` — identitas Jejakstok untuk area brand/footer;
- `icon/icon.jpg` — ikon brand dan favicon;
- `warehouse.jpg` — visual utama landing page;
- `login.jpg` — visual panel login;
- `receive.jpg`, `store.jpg`, `transfer.jpg`, `count.jpg` — ilustrasi workflow;
- `rack.jpg` — ilustrasi rak dan pemeriksaan lokasi.

Favicon dan metadata tab dikonfigurasi pada `index.html`:

```text
Jejakstok — Sistem manajemen gudang
```

## Konten landing page

Landing page menggunakan konten JSON tervalidasi pada
`src/content/landing/`:

- `hero.json`;
- `proof-points.json`;
- `workflow.json`;
- `pain-points.json`;
- `security.json`;
- `cta.json`;
- `footer.json`;
- `schema.ts`;
- `index.ts`.

Seluruh konten yang terlihat pengguna wajib berbahasa Indonesia. Istilah teknis
seperti `purchase order`, `stock ledger`, `audit log`, `permission`, dan
`stock opname` dapat dipertahankan bila diperlukan untuk ketepatan makna.

Jika schema content invalid, proses import/build harus gagal secara eksplisit.
Jangan menambahkan fallback copy yang dapat menyesatkan.

## Aturan arsitektur

1. Data API seperti stok, PO, GR, transfer, dan opname dikelola TanStack Query,
   bukan disalin ke Zustand.
2. Zustand digunakan untuk session auth dan state UI kecil.
3. API function tidak boleh berisi JSX atau bergantung langsung pada hook React.
4. Komponen halaman tetap tipis; logika domain diletakkan di feature terkait.
5. Feature tidak mengimpor komponen internal feature lain secara langsung.
6. Komponen generik berada di `components/ui` atau `components/shared`;
   komponen yang memahami domain WMS berada di feature.
7. Kuantitas dan nilai desimal dihitung menggunakan Decimal.js, bukan
   `parseFloat`.
8. Filter dan pagination tabel disimpan pada URL agar dapat di-refresh dan
   dibagikan.
9. Landing page tidak membutuhkan token, session, atau request autentikasi.
10. Halaman login berada di `features/auth/pages/`, bukan `src/pages/`.

## Integrasi API

Base URL API berasal dari:

```env
VITE_API_BASE_URL=http://localhost:8000
```

HTTP client tersedia pada `src/lib/api-client.ts`. Service autentikasi frontend menggunakan:

- `POST /api/v1/auth/login` untuk memperoleh token;
- `GET /api/v1/auth/me` untuk memuat profil dan permission;
- `POST /api/v1/auth/refresh` untuk memperbarui access token;
- `POST /api/v1/auth/logout` untuk mencabut refresh token.

Access token hanya disimpan di memory Zustand. Refresh token disimpan pada
`localStorage` dengan key `wms.frontend.auth.refresh-token`. Route `/dashboard`
dilindungi oleh `ProtectedRoute`, dan API client akan mencoba refresh satu kali
ketika menerima response `401`.

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
- MSW untuk mock request API pada level network.

Test baru sebaiknya mencakup state berikut jika relevan:

- loading;
- data berhasil;
- empty result;
- error API;
- permission tidak mencukupi;
- mutation berhasil dan gagal;
- validasi content landing;
- navigasi publik landing dan route login.

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
docs/CORE/PRD_FRONTEND.md
docs/CORE/Panduan_bahasa_landing.MD
```

Folder `docs/` dan file `AGENTS.MD` sengaja dikecualikan dari Git melalui
`.gitignore`, sehingga dokumentasi tersebut tidak ikut dipush ke repository
GitHub. Dokumentasi API sebaiknya dikelola di repository backend atau
ditambahkan sebagai dokumentasi publik tersendiri jika dibutuhkan contributor.

## Status validasi baseline

Baseline project telah divalidasi dengan:

```text
npm run typecheck  ✅
npm run lint       ✅
npm test           ✅
npm run build      ✅
npm audit          ✅
```
