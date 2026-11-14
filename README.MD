# Jejakstok — Sistem Manajemen Gudang

Frontend untuk **Jejakstok**, sistem manajemen gudang berbasis React yang
disiapkan untuk membantu tim mengelola stok, gudang, pengadaan, penerimaan,
transfer, stock opname, dan jejak aktivitas dalam satu alur kerja.

> **Status:** Aplikasi operasional telah selesai dikembangkan hingga **Tahap 30** (seluruh modul MVP, ekstensi retail/cabang, template dokumen cetak modular, panduan pengguna interaktif, responsivitas lintas perangkat, isolasi *warehouse scoping* global, dan pengujian otomatis `101/101` lulus).

## Gambaran umum

Jejakstok memiliki dua area utama:

1. **Landing page publik** pada `/`
   - dapat dilihat siapa pun tanpa login;
   - menggunakan konten JSON statis tervalidasi berbahasa Indonesia (`src/content/landing/`);
   - dimodularisasi ke `src/components/landing/` dan menjelaskan alur Terima → Simpan → Pindahkan → Hitung beserta fitur barcode/QR, stiker label `50x30 mm`, dan cetak dokumen fisik;
   - tidak mengambil data operasional atau memanggil API autentikasi.
2. **Ruang kerja** untuk pengguna terautentikasi
   - login pada `/login` dengan pengiriman kredensial ke `/api/v1/auth/login`, penyimpanan `access_token` di memori Zustand, serta dukungan sesi `HttpOnly` cookie (`withCredentials: true`) dan sinkronisasi multi-tab (`BroadcastChannel`);
   - *topbar* kontekstual (`AppTopbar.tsx`), *Command Palette* cepat, dan selektor cakupan gudang global (`useWarehouseScopeStore`, parameter `warehouse_id`);
   - dashboard informatif pada `/dashboard` (`KPI`, tugas tertunda lintas modul, dan mutasi terkini sesuai hak akses & filter gudang);
   - profil pengguna & ganti kata sandi (`/profile`), administrasi pengguna/role/menu/template dokumen (`/admin/*`), master data (`/master/*`), monitoring saldo stok terpadu & buku besar (`/stock/*`), PO (`/purchase-orders/*`), penerimaan barang (`/goods-receipts/*`, `/goods-receipts/new`), transfer antar-gudang (`/stock-transfers/*`), stock opname (`/stock-opnames/*`), audit log (`/audit-logs`, `/admin/audit-logs`), serta Pusat Panduan Pengguna Interaktif (`UserGuideModal`).

## Area bisnis

Aplikasi mencakup domain bisnis berikut:

- **Autentikasi, Session, Profil & RBAC:** Login, pemulihan sesi otomatis, profil + daftar gudang terakses, ganti kata sandi, manajemen user/role/permission, penugasan gudang, dan katalog menu dinamis (`/admin/users`, `/admin/roles`, `/admin/menus`);
- **Dashboard & Cakupan Gudang Global:** KPI real-time, antrean tugas tertunda, mutasi terakhir, serta pemilih gudang aktif di topbar untuk menyaring metrik & transaksi secara global;
- **Master Data (`master-data`):** Kategori, UOM (`allow_decimal`), Pemasok/Supplier (termasuk import Excel), Barang/SKU (termasuk Barcode EAN-13/Code-128 & auto-generate GS1 internal `200..299` serta import Excel), Gudang (`allow_negative_stock`), dan Lokasi Penyimpanan (*Bin/Rack*);
- **Monitoring Saldo Stok & Buku Besar Terpadu (`/stock`):** Tab terpadu saldo per lokasi, per gudang, ringkasan lintas gudang, barang *in-transit*, dan kartu stok (*ledger*), dilengkapi modal lookup barcode dua arah (`StockLookupModal`);
- **Purchase Order (`/purchase-orders`):** Pembuatan draft, revisi, penerbitan, pembatalan, penutupan, filter multi-status, dan pratinjau cetak PO;
- **Goods Receipt (`/goods-receipts` & `/goods-receipts/new`):** Penerimaan barang referensi PO (parsial/penuh), scan barcode penerimaan, posting atomik, dan cetak fisik Bukti Penerimaan Barang (GRN);
- **Stock Transfer (`/stock-transfers`):** Transfer antar-gudang/rak 2 tahap (`DRAFT` → `APPROVED` → `SHIPPED` → `RECEIVED`), pencatatan selisih & alasan selisih, scan barcode, dan cetak Surat Jalan Transfer Stok;
- **Stock Opname (`/stock-opnames`):** Sesi opname per gudang/lokasi dengan pembekuan lokasi otomatis, hitung fisik berbasis scan barcode (snapshot & temuan), submit, dan persetujuan/penolakan selisih;
- **Template Dokumen Cetak Modular (`/admin/document-templates`):** Pengaturan logo perusahaan, ukuran/margin kertas (`A4`/`LETTER`/`F4`), urutan bagian, kolom tabel, dan blok tanda tangan untuk GRN, Surat Jalan, dan PO lengkap dengan *Live Preview*;
- **Visualisasi & Cetak Label Stiker (`50x30 mm`):** Generator SVG Barcode 1D (EAN-13/Code-128B) dan QR Code 2D, konfigurator label preset/custom, serta pencetakan terisolasi (`StickerPrintDialog`);
- **Pemindai Barcode / QR & Pusat Panduan Interaktif:** Kamera Web (`BarcodeDetector`), USB/Bluetooth HID Barcode Gun (`useBarcodeScanner`), serta modal panduan & simulasi barcode interaktif;
- **Audit Log (`/audit-logs`, `/admin/audit-logs`):** Penelusuran jejak audit *append-only* dengan filter kategori (`business`/`security`/`failed`), status, aksi, entitas, rentang waktu, dan inspeksi JSON `old_values`/`new_values`.

## Tech stack

### Aplikasi

- React `19.3.1`
- React Router `7` (`7.18.x`)
- Vite `8`
- TypeScript `5.9.x`
- Tailwind CSS `4`
- shadcn/ui + Radix UI (`radix-ui`)
- Poppins sebagai font utama (`@fontsource/poppins`)
- TanStack Query `5` untuk server state dan cache API
- Zustand `5` untuk session auth (`useAuthStore`), cakupan gudang (`useWarehouseScopeStore`), dan panduan pengguna (`useUserGuideStore`)
- Axios (`withCredentials: true` + interceptor auto-refresh `401`)
- React Hook Form + Zod untuk form dan validasi
- TanStack Table untuk tabel operasional
- React Error Boundary (`react-error-boundary`)
- QRCode (`qrcode`) untuk rendering matriks QR 2D SVG/Canvas
- Decimal.js untuk perhitungan kuantitas desimal
- date-fns untuk format tanggal lokal (`id-ID`)
- Sonner untuk notifikasi
- Lucide React untuk ikon

### Quality dan development

- Vitest `5` + JSDOM
- Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `user-event`)
- MSW untuk mock API pada level network
- ESLint `10` & TypeScript (`tsc -b`)
- OpenAPI TypeScript (`openapi-typescript`) untuk menghasilkan tipe dari schema FastAPI
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

Salin file environment sesuai kebutuhan skenario Anda:

- **Skenario A — Terhubung ke Backend Lokal (Default):**
  Frontend otomatis membaca `.env.development` yang telah dikonfigurasi menggunakan Vite proxy ke `http://localhost:8000`:
  ```powershell
  npm run dev
  ```

- **Skenario B — Terhubung ke Backend Server Development:**
  Salin template mode dev-server lalu sesuaikan target proxy:
  ```powershell
  Copy-Item .env.dev-server.example .env.dev-server
  # Edit VITE_DEV_PROXY_TARGET pada .env.dev-server jika host/port berbeda
  npm run dev:server
  ```

> [!TIP]
> Panduan lengkap arsitektur multi-environment, guard proteksi production, dan pemecahan masalah dapat dibaca pada dokumen resmi:
> 👉 `api_warehouse_app/docs/core/environment-setup-guide.md`.

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
| `npm run dev` | Menjalankan Vite development server (proxy ke backend lokal). |
| `npm run dev:server` | Menjalankan Vite dalam mode `dev-server` (`.env.dev-server`). |
| `npm run typecheck` | Memeriksa tipe TypeScript (`tsc -b`). |
| `npm run lint` | Menjalankan ESLint (`eslint .`). |
| `npm test` | Menjalankan seluruh suite test Vitest sekali. |
| `npm run test:watch` | Menjalankan test dalam watch mode. |
| `npm run build` | Memeriksa tipe (`tsc -b`) dan membuat production bundle (`vite build`). |
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
│   ├── app/                    # App.tsx, providers.tsx, router.tsx, App/responsive/scope tests
│   ├── components/
│   │   ├── landing/            # komponen landing page modular (Hero, PainAndSecurity, Workflow, CtaFooter)
│   │   ├── layout/             # AppShell, AppTopbar, Sidebar, PageHeader, CommandPaletteModal, routeContext
│   │   ├── print/              # ModularDocumentPrintSheet (mesin render cetak dinamis berbasis template)
│   │   ├── shared/             # DataPagination, DataStateBanner, ResponsiveDataView, RouteTabNav, StatusBadge, StickerPrintDialog
│   │   └── ui/                 # komponen shadcn/ui + BarcodeVisual, BarcodePrintConfigurator, BarcodeScannerModal, StockLookupModal (+ stock-lookup/)
│   ├── content/
│   │   └── landing/            # JSON landing tervalidasi (schema.ts + loader index.ts)
│   ├── features/
│   │   ├── administration/     # administrasi users, roles & permission matrix, menus, & warehouse assignments
│   │   ├── audit-logs/         # penelusuran & filter audit log (kategori, status, diff old/new)
│   │   ├── auth/               # store Zustand, tokenStorage, tabSync, LoginPage, ProfilePage, ProtectedRoute
│   │   ├── dashboard/          # api.ts & widget KPI, tugas tertunda, mutasi terkini, warehouse scope bar
│   │   ├── document-templates/ # configurator layout dokumen cetak, upload logo, & Live Preview
│   │   ├── goods-receipts/     # halaman daftar/form/detail GR, GoodsReceiptPrintSheet, test scanner & cetak
│   │   ├── master-data/        # categories/, stocks/ (+ barcode & Excel import), storage-locations/, suppliers/, uoms/, warehouses/
│   │   ├── navigation/         # api.ts my-menu, mapping allowlist icon canonical, & tipe menu
│   │   ├── purchase-orders/    # daftar, detail, form PO, PurchaseOrderPrintSheet
│   │   ├── stock/              # Monitoring Saldo Stok terpadu (5 tab) & StockPage
│   │   ├── stock-opnames/      # daftar, detail, form, hitung fisik opname
│   │   ├── stock-transfers/    # daftar, detail, transfer antar-gudang, StockTransferPrintSheet
│   │   └── user-guide/         # modal panduan pengguna interaktif, kamus field, walkthrough, & simulasi barcode
│   ├── hooks/                  # useBarcodeScanner, useIsMobile, usePermission, useWarehouseScope
│   ├── lib/                    # api-client, decimal, errors, query-client, storage, utils, validation
│   ├── mocks/                  # handler MSW untuk pengujian
│   ├── pages/                  # LandingPage.tsx & DashboardPage.tsx
│   ├── stores/                 # warehouseScopeStore.ts (cakupan gudang global + unit test)
│   ├── styles/                 # globals.css (tema Tailwind v4 & @media print A4 / stiker 50x30 mm / F4 / Letter)
│   ├── test/                   # setup.ts konfigurasi Vitest & jsdom
│   ├── types/                  # tipe domain/API bersama (api.ts)
│   └── main.tsx                # entry point React 19
├── docker-compose.dev.yml      # Compose development
├── Dockerfile.dev              # image Node untuk development
├── index.html                  # metadata, favicon, dan Vite entry
├── package.json                # scripts dan dependency
├── vite.config.ts              # konfigurasi Vite dan alias @
└── vitest.config.ts            # konfigurasi Vitest
```

Halaman yang menjadi bagian dari domain tertentu ditempatkan di
`src/features/<feature>/pages/`. Contohnya:

```text
src/features/auth/
├── components/
├── pages/
│   ├── LoginPage.tsx
│   └── ProfilePage.tsx
├── api.ts
├── store.ts
├── tabSync.ts
└── tokenStorage.ts
```

Landing page publik berada di [src/pages/LandingPage.tsx](./src/pages/LandingPage.tsx)
karena bukan bagian dari domain autentikasi.

Dokumentasi arsitektur frontend dan struktur folder monorepo tersedia di
[FOLDER_STRUCTURE.MD](../api_warehouse_app/docs/core/FOLDER_STRUCTURE.MD) dan
[PRD_FRONTEND.md](../api_warehouse_app/docs/core/PRD_FRONTEND.md).

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

HTTP client tersedia pada `src/lib/api-client.ts` dengan `withCredentials: true`
agar cookie `HttpOnly` (`refresh_token`) dikirim otomatis oleh peramban pada
request `/api/v1/auth/*`. Service autentikasi frontend menggunakan:

- `POST /api/v1/auth/login` untuk memperoleh `access_token` (dan cookie `HttpOnly` `refresh_token`);
- `GET /api/v1/auth/me` untuk memuat profil, daftar permission, `has_all_warehouse_access`, dan daftar `warehouses` aktif;
- `POST /api/v1/auth/refresh` untuk merotasi token dan memperbarui `access_token` baru;
- `POST /api/v1/auth/logout` untuk mencabut sesi *refresh token* dan membersihkan cookie.

`access_token` hanya disimpan di memori Zustand (`useAuthStore`). Koordinasi refresh
antar-tab dikelola melalui `BroadcastChannel` dan lock penyimpanan (`tabSync.ts`),
sementara `tokenStorage.ts` hanya menyimpan token cadangan jika payload API
mengembalikannya secara eksplisit pada lingkungan pengujian/non-cookie. Route
terlindungi menggunakan `ProtectedRoute`, dan interceptor API client otomatis
mencoba pembaruan token satu kali ketika menerima response `401`.

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

Seluruh dokumentasi spesifikasi, arsitektur, kontrak API, dan panduan setup
tersedia terpusat pada repositori backend di workspace ini:

- [PRD_FRONTEND.md](../api_warehouse_app/docs/core/PRD_FRONTEND.md) — spesifikasi halaman, UX, state, dan integrasi API frontend
- [FOLDER_STRUCTURE.MD](../api_warehouse_app/docs/core/FOLDER_STRUCTURE.MD) — struktur folder backend dan frontend
- [environment-setup-guide.md](../api_warehouse_app/docs/core/environment-setup-guide.md) — panduan multi-environment lokal vs dev-server & guard production
- [frontend-local-development-guide.MD](../api_warehouse_app/docs/core/frontend-local-development-guide.MD) — panduan menjalankan frontend lokal
- [API Indeks](../api_warehouse_app/docs/API/README.md) — daftar lengkap seluruh endpoint REST API backend
- [QA.MD](../api_warehouse_app/docs/QA/QA.MD) — matriks verifikasi AC dan cakupan pengujian frontend & backend

## Status validasi terkini

Baseline aplikasi telah terverifikasi pada pengujian terakhir:

```text
npm run typecheck  ✅ lulus (tsc -b)
npm run lint       ✅ lulus (eslint ., 0 error / 0 warning)
npm test           ✅ lulus (22 test file / 101 test Vitest)
npm run build      ✅ lulus (tsc -b && vite build)
```
