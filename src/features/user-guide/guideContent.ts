import type {
  BarcodeSimulationPreset,
  BarcodeSimulationResult,
  GuideFieldSpec,
  GuideModuleId,
  ModuleGuideContent,
  WalkthroughStage,
} from "./types";

/**
 * Menentukan ID modul panduan aktif berdasarkan path URL saat ini.
 */
export function resolveGuideModuleFromPath(pathname: string): GuideModuleId {
  const path = pathname.toLowerCase();
  if (path.includes("/document-templates")) {
    return "document-templates";
  }
  if (path.includes("/audit-logs") || path === "/audit") {
    return "audit-logs";
  }
  if (path.startsWith("/admin") || path === "/users") {
    return "administration";
  }
  if (path.includes("/purchase-orders/new")) {
    return "purchase-order-create";
  }
  if (path.includes("/purchase-orders")) {
    return "purchase-orders";
  }
  if (path.includes("/goods-receipts/new")) {
    return "goods-receipt-create";
  }
  if (path.includes("/goods-receipts")) {
    return "goods-receipts";
  }
  if (path.includes("/stock-transfers")) {
    return "stock-transfers";
  }
  if (path.includes("/stock-opnames")) {
    return "stock-opnames";
  }
  if (path.startsWith("/stock")) {
    return "stock-monitoring";
  }
  if (path.includes("/uoms") || path.endsWith("/uom")) {
    return "master-uoms";
  }
  if (path.includes("/categories")) {
    return "master-categories";
  }
  if (path.includes("/suppliers")) {
    return "master-suppliers";
  }
  if (path.includes("/warehouses")) {
    return "master-warehouses";
  }
  if (path.includes("/locations") || path.includes("/storage-locations")) {
    return "master-locations";
  }
  if (path.includes("/items") || path.includes("/stocks")) {
    return "master-items";
  }
  if (path === "/profile") {
    return "profile";
  }
  return "dashboard";
}

export const WALKTHROUGH_STAGES: WalkthroughStage[] = [
  {
    stepNumber: 1,
    moduleId: "purchase-orders",
    shortTitle: "Pengadaan PO",
    title: "1. Pengadaan Purchase Order (PO)",
    actorRole: "Purchasing / Staf Pengadaan / Manajer",
    goal: "Mencatat rencana pemesanan barang ke pemasok dan menerbitkan PO resmi sebelum barang datang.",
    actions: [
      "Buka menu Purchase Order lalu klik Buat PO baru.",
      "Pilih Pemasok aktif, Gudang tujuan pengiriman, serta tanggal pesanan.",
      "Tambahkan minimal 1 barang (SKU) beserta Qty pesanan sesuai UoM barang tersebut.",
      "Simpan sebagai DRAFT jika masih butuh peninjauan, lalu klik Terbitkan PO (ISSUED) saat siap dikirim ke pemasok.",
    ],
    whatHappensNext:
      "Hanya PO berstatus ISSUED atau PARTIALLY_RECEIVED yang dapat dipilih pada modul Penerimaan Barang (Goods Receipt).",
    targetRoute: "/purchase-orders",
  },
  {
    stepNumber: 2,
    moduleId: "goods-receipts",
    shortTitle: "Penerimaan GR",
    title: "2. Penerimaan Barang (Goods Receipt / GRN)",
    actorRole: "Staf Gudang / Admin Receiving",
    goal: "Mencatat kedatangan fisik barang dari pemasok, mengalokasikannya ke rak simpan, dan menambah saldo stok resmi.",
    actions: [
      "Buka menu Penerimaan Barang -> Buat penerimaan, lalu pilih PO berstatus ISSUED.",
      "Gunakan pemindai barcode (atau input manual) untuk mengisi Qty diterima (tidak boleh melebihi sisa Qty PO).",
      "Pilih Lokasi Simpan / Rak (location_id) milik gudang tujuan pada setiap baris.",
      "Simpan sebagai DRAFT untuk pengecekan akhir, lalu klik Posting GRN (POSTED) dan cetak Bukti Penerimaan Barang.",
    ],
    whatHappensNext:
      "Saldo stok di lokasi rak bertambah secara atomik, mutasi tercatat di Stock Movement Ledger, dan status PO otomatis diperbarui.",
    targetRoute: "/goods-receipts",
  },
  {
    stepNumber: 3,
    moduleId: "stock-monitoring",
    shortTitle: "Penyimpanan Rak",
    title: "3. Penyimpanan Rak & Monitoring Saldo Stok",
    actorRole: "Seluruh Operator & Supervisor Gudang",
    goal: "Memastikan setiap barang menempati lokasi rak yang akurat, terlabeli barcode/QR, dan mudah dilacak saldonya.",
    actions: [
      "Buka Cek Stok / Rak di Topbar atau menu Monitoring Saldo Stok per Lokasi / per Gudang.",
      "Pindai barcode SKU barang atau kode lokasi rak untuk memastikan saldo fisik sesuai sistem.",
      "Cetak label barcode/QR dari Detail Barang, Detail Lokasi Rak, atau Detail Gudang (tersedia ukuran roll thermal & A4).",
    ],
    whatHappensNext:
      "Riwayat keluar-masuk per mutasi tersimpan permanen (append-only) di Stock Movement Ledger untuk kebutuhan audit.",
    targetRoute: "/stock",
  },
  {
    stepNumber: 4,
    moduleId: "stock-transfers",
    shortTitle: "Transfer Gudang",
    title: "4. Transfer Stok Antar-Rak & Antar-Gudang",
    actorRole: "Staf Gudang Asal & Penerima Gudang Tujuan",
    goal: "Memindahkan stok antar lokasi/gudang secara terkontrol melalui status perjalanan (IN_TRANSIT).",
    actions: [
      "Buat draft transfer dengan mengisi Gudang & Lokasi Asal serta Gudang & Lokasi Tujuan (keduanya harus berbeda).",
      "Setelah disetujui (APPROVED), klik Kirim Transfer (SHIPPED) saat armada berangkat; stok berpindah ke status Dalam Perjalanan.",
      "Cetak Surat Jalan Transfer Stok sebagai dokumen pengantar fisik.",
      "Saat tiba, petugas tujuan menginput Qty Diterima aktual (beserta alasan selisih jika terjadi variance) dan menyelesaikan penerimaan.",
    ],
    whatHappensNext:
      "Saldo lokasi tujuan bertambah sesuai jumlah diterima aktual, dan selisih pengiriman tercatat jelas di ledger & audit log.",
    targetRoute: "/stock-transfers",
  },
  {
    stepNumber: 5,
    moduleId: "stock-opnames",
    shortTitle: "Stock Opname",
    title: "5. Stock Opname & Penyesuaian Fisik",
    actorRole: "Tim Audit / Kepala Gudang / Staf Opname",
    goal: "Mencocokkan saldo sistem dengan hasil hitung fisik di rak secara aman tanpa gangguan mutasi lain.",
    actions: [
      "Buat sesi Stock Opname untuk Gudang dan daftar Lokasi Rak target, lalu mulai sesi (IN_PROGRESS).",
      "Selama status IN_PROGRESS, lokasi tersebut dibekukan (LOCATION_FROZEN) terhadap GR atau Transfer agar hitungan akurat.",
      "Pindai barcode barang atau masukkan Qty Hitung Fisik per baris (termasuk barang temuan tak terduga).",
      "Ajukan untuk persetujuan (SUBMITTED -> APPROVED) agar selisih otomatis disesuaikan ke Buku Besar Stok.",
    ],
    whatHappensNext:
      "Setelah APPROVED (atau CANCELLED), pembekuan lokasi dilepas otomatis sehingga operasional normal dapat berlanjut.",
    targetRoute: "/stock-opnames",
  },
];

export const GUIDE_FIELDS: GuideFieldSpec[] = [
  {
    id: "allow_decimal",
    fieldName: "allow_decimal & Qty Transaksi",
    label: "Satuan UoM Desimal vs Non-Desimal",
    appliesTo: ["Master UoM", "Purchase Order", "Goods Receipt", "Transfer", "Opname"],
    description:
      "Menentukan apakah jumlah barang boleh memakai angka pecahan desimal. Jika allow_decimal = false (contoh: PCS, BOX, UNIT), kuantitas wajib bilangan bulat. Jika allow_decimal = true (contoh: KG, LITER, METER), kuantitas mendukung hingga 4 angka desimal.",
    exampleValid: "Barang ber-UoM PCS -> isi Qty: 25 | Barang ber-UoM KG -> isi Qty: 12.50",
    commonMistake:
      "Mengisi 1.5 pada barang bersatuan PCS akan ditolak validasi 422 karena UoM tidak mengizinkan desimal.",
  },
  {
    id: "po_status_issued",
    fieldName: "Status PO (DRAFT vs ISSUED)",
    label: "Kapan Memilih Simpan Draft vs Terbitkan (ISSUED)",
    appliesTo: ["Purchase Order"],
    description:
      "Status DRAFT memungkinkan daftar barang & kuantitas pada PO masih diubah atau dibatalkan sebelum dikirim ke pemasok. Status ISSUED mengunci spesifikasi PO resmi agar bagian Receiving gudang dapat memproses penerimaan barang.",
    exampleValid:
      "Gunakan DRAFT saat menunggu persetujuan harga internal; klik Terbitkan PO (ISSUED) sebelum barang dikirim vendor.",
    commonMistake:
      "Mencoba membuat Goods Receipt untuk PO yang masih DRAFT -> PO tidak muncul karena belum berstatus ISSUED.",
  },
  {
    id: "location_id",
    fieldName: "location_id (Lokasi Simpan / Rak)",
    label: "Alokasi Rak Penyimpanan Barang",
    appliesTo: ["Goods Receipt", "Transfer Stok", "Stock Opname"],
    description:
      "Setiap baris penerimaan atau mutasi harus diarahkan ke rak/bin spesifik (mis. RACK-A1-02) yang aktif dan berada di dalam gudang transaksi yang dipilih.",
    exampleValid: "PO ditujukan ke WH-JKT-01 -> pilih lokasi rak yang juga berkode gudang WH-JKT-01.",
    commonMistake:
      "Memilih lokasi dari gudang lain atau lokasi yang sedang nonaktif/dibekukan Stock Opname akan memicu error INVALID_LOCATION / LOCATION_FROZEN.",
  },
  {
    id: "qty_received",
    fieldName: "qty_received (Qty Diterima)",
    label: "Penerimaan Parsial & Proteksi Over-Receipt",
    appliesTo: ["Goods Receipt"],
    description:
      "Anda dapat menerima sebagian jumlah PO (misal pesan 100 PCS, datang tahap pertama 60 PCS -> PO otomatis menjadi PARTIALLY_RECEIVED). Sistem menolak jumlah terima melebihi sisa PO.",
    exampleValid: "Sisa PO = 40 PCS -> isi qty_received = 40 (atau 20 untuk parsial).",
    commonMistake:
      "Mengisi qty_received = 50 ketika sisa belum diterima tinggal 40 -> ditolak dengan error OVER_RECEIPT (409).",
  },
  {
    id: "barcode_sku",
    fieldName: "sku vs barcode",
    label: "Perbedaan Kode SKU Internal & Barcode Pemindai",
    appliesTo: ["Master Barang (SKU)", "Scanner Barcode"],
    description:
      "SKU adalah identitas inti permanen (immutabel setelah barang pernah bertransaksi) yang otomatis huruf kapital tanpa spasi. Barcode adalah kode cetak/kemasan (EAN-13, Code-128, atau internal auto-generate) yang dibaca alat scanner saat penerimaan atau opname.",
    exampleValid: "SKU: SKU-KOP-250 | Barcode: 8991234567890 atau WMS-000125",
    commonMistake:
      "Memakai spasi pada SKU atau menyalin barcode yang sudah dipakai barang lain (ditolak error DUPLICATE).",
  },
  {
    id: "allow_negative_stock",
    fieldName: "allow_negative_stock",
    label: "Kebijakan Stok Negatif per Gudang",
    appliesTo: ["Master Gudang", "Transfer Stok", "Stock Opname"],
    description:
      "Jika dimatikan (standar ketat), sistem memblokir pengiriman transfer atau penyesuaian opname apabila saldo lokasi akan turun di bawah 0.",
    exampleValid: "Saldo lokasi RACK-A1 = 15 PCS -> maksimal transfer keluar = 15 PCS.",
    commonMistake:
      "Mengirim 20 PCS saat saldo rak hanya 15 PCS -> ditolak error INSUFFICIENT_STOCK (409).",
  },
  {
    id: "transfer_variance",
    fieldName: "qty_received & variance_reason",
    label: "Pencatatan Selisih (Variance) saat Terima Transfer",
    appliesTo: ["Transfer Stok"],
    description:
      "Jika fisik barang diterima di gudang tujuan berbeda dengan Qty Dikirim (SHIPPED), petugas penerima wajib mengisi alasan selisih (variance_reason). Kuantitas terima tidak dapat melebihi jumlah dikirim.",
    exampleValid: "Dikirim 50, diterima 48 -> isi qty_received: 48, alasan: '2 pcs rusak kemasan di ekspedisi'.",
    commonMistake:
      "Mengisi qty_received = 55 ketika yang dikirim hanya 50 -> ditolak dengan error TRANSFER_QTY_EXCEEDS_SHIPPED.",
  },
  {
    id: "warehouse_scoping",
    fieldName: "Penugasan Gudang (Warehouse Scoping)",
    label: "Hak Akses Lokasi & Transaksi per Gudang",
    appliesTo: ["Administrasi Pengguna", "Seluruh Transaksi"],
    description:
      "Pengguna non-Superadmin hanya dapat membuat atau memproses PO, GR, Transfer, dan Opname pada gudang yang ditugaskan kepada akunnya.",
    exampleValid: "Admin Gudang Bandung (ditugaskan ke WH-BDG) memilih gudang WH-BDG saat membuat transaksi.",
    commonMistake:
      "Mencoba memproses dokumen milik gudang yang belum ditugaskan ke akun -> ditolak error WAREHOUSE_NOT_ASSIGNED (403).",
  },
  {
    id: "document_template_layout",
    fieldName: "section_order, table_columns & signature_layout",
    label: "Pengaturan Template Dokumen Cetak Modular",
    appliesTo: ["Template Dokumen Cetak"],
    description:
      "Mengatur struktur kertas cetak (A4/Letter/F4, Portrait/Landscape), posisi logo kop surat, urutan bagian dokumen, kolom tabel yang tampil, serta hingga 4 kolom blok tanda tangan pejabat.",
    exampleValid: "Aktifkan minimal 1 kolom tabel, margin 4..40 mm, dan gunakan Preset 2 atau 3 Kolom tanda tangan.",
    commonMistake:
      "Menyembunyikan seluruh kolom tabel sekaligus atau mengunggah file non-gambar selain PNG/JPG/WEBP.",
  },
];

export const MODULE_GUIDES: Record<GuideModuleId, ModuleGuideContent> = {
  dashboard: {
    id: "dashboard",
    title: "Dasbor Operasional Gudang",
    category: "Monitoring",
    summary:
      "Pusat ringkasan KPI stok, dokumen tertunda yang memerlukan tindakan segera, dan aktivitas mutasi terbaru sesuai gudang yang Anda kelola.",
    whenToUse: "Gunakan setiap awal shift untuk memantau antrean PO aktif, GR draft, transfer masuk, dan sesi opname.",
    prerequisites: ["Akun telah login dan memiliki penugasan gudang (atau peran pengawas)."],
    stepByStep: [
      "Periksa 4 kartu KPI utama untuk ringkasan total SKU, nilai/saldo aktif, dokumen tertunda, dan aktivitas harian.",
      "Klik item pada panel Pending Actions untuk langsung membuka dokumen PO/GR/Transfer yang menunggu tindak lanjut.",
      "Gunakan tombol Cek Stok / Rak di Topbar untuk pencarian cepat lokasi rak dengan scanner barcode.",
    ],
    tips: [
      "Angka pada dashboard otomatis menyesuaikan cakupan gudang yang ditugaskan ke akun Anda.",
      "Gunakan Ctrl + K kapan saja untuk melompat cepat antar menu tanpa klik berulang.",
    ],
    fieldIds: ["warehouse_scoping", "barcode_sku"],
  },
  "purchase-orders": {
    id: "purchase-orders",
    title: "Daftar & Kelola Purchase Order (PO)",
    category: "Operasional",
    summary:
      "Mengelola siklus pengadaan pembelian barang ke pemasok dari status DRAFT, ISSUED, pemenuhan parsial via GR, hingga CLOSED/CANCELLED.",
    whenToUse: "Saat membuat pesanan barang ke supplier, menerbitkan PO resmi, atau mencetak dokumen PO.",
    prerequisites: [
      "Data Pemasok aktif di Master Pemasok.",
      "Data Gudang tujuan & Master Barang (SKU) beserta UoM aktif.",
    ],
    stepByStep: [
      "Klik Buat PO untuk menyusun daftar pesanan baru.",
      "Pada detail PO berstatus DRAFT, periksa kembali barang & kuantitas lalu klik Terbitkan PO (ISSUED).",
      "Gunakan tombol Pratinjau PO cetak atau Cetak Purchase Order untuk menerbitkan surat PO bermerek perusahaan.",
    ],
    tips: [
      "PO yang sudah diterbitkan (ISSUED) tidak bisa diedit langsung; batalkan/tutup sesuai prosedur jika ada perubahan besar.",
      "PO akan otomatis berubah menjadi RECEIVED ketika seluruh baris sudah diterima lewat Goods Receipt.",
    ],
    fieldIds: ["po_status_issued", "allow_decimal", "warehouse_scoping"],
  },
  "purchase-order-create": {
    id: "purchase-order-create",
    title: "Formulir Pembuatan Purchase Order",
    category: "Operasional",
    summary:
      "Panduan pengisian form pembuatan Purchase Order agar validasi pemasok, gudang, dan kuantitas UoM berjalan mulus.",
    whenToUse: "Saat sedang menginput baris barang pada form Buat PO baru.",
    prerequisites: [
      "Pemasok aktif sudah terdaftar.",
      "Pengguna memiliki permission po:create dan penugasan ke gudang tujuan.",
    ],
    stepByStep: [
      "Pilih Pemasok dan Gudang Tujuan Penerimaan terlebih dahulu.",
      "Tentukan Tanggal Order yang valid.",
      "Tambahkan satu atau beberapa Barang (SKU) lalu isi Qty Pesanan sesuai aturan desimal UoM.",
      "Klik Simpan Draft jika masih ingin diedit, atau langsung lanjut Terbitkan setelah tersimpan.",
    ],
    tips: [
      "Membuka panduan ini tidak akan menghapus atau mereset data PO yang sedang Anda ketik di formulir.",
      "Perhatikan label satuan di sebelah kolom Qty agar tidak salah memasukkan pecahan pada UoM non-desimal.",
    ],
    fieldIds: ["allow_decimal", "po_status_issued", "warehouse_scoping"],
  },
  "goods-receipts": {
    id: "goods-receipts",
    title: "Penerimaan Barang (Goods Receipt / GRN)",
    category: "Operasional",
    summary:
      "Mencatat penerimaan fisik barang dari PO yang sudah terbit, mengalokasikan ke lokasi rak penyimpanan, dan memposting penambahan saldo stok.",
    whenToUse: "Saat armada pemasok tiba membawa barang beserta surat jalan.",
    prerequisites: [
      "Terdapat PO tujuan berstatus ISSUED atau PARTIALLY_RECEIVED.",
      "Gudang tujuan memiliki minimal 1 Lokasi Simpan (Rak) aktif.",
    ],
    stepByStep: [
      "Klik Buat penerimaan lalu pilih nomor PO yang sesuai dengan surat jalan pemasok.",
      "Masukkan Qty Diterima atau pindai barcode kemasan menggunakan kotak scan barcode.",
      "Pastikan setiap baris memiliki Lokasi Simpan / Rak di gudang tujuan.",
      "Klik Posting GRN agar saldo stok bertambah resmi, lalu cetak Bukti Penerimaan Barang (GRN).",
    ],
    tips: [
      "Penerimaan boleh dilakukan bertahap (parsial); sisa Qty tetap terbuka di PO hingga diterima seluruhnya.",
      "Jika posting gagal dengan OVER_RECEIPT, periksa apakah ada GR draft/posted lain untuk PO yang sama.",
    ],
    fieldIds: ["qty_received", "location_id", "po_status_issued", "allow_decimal"],
  },
  "goods-receipt-create": {
    id: "goods-receipt-create",
    title: "Formulir Input Penerimaan Barang & Scan Barcode",
    category: "Operasional",
    summary:
      "Panduan cepat mengisi form penerimaan barang menggunakan pemindai barcode HID atau input manual serta pemilihan rak simpan.",
    whenToUse: "Saat menerima fisik barang di area receiving dock gudang.",
    prerequisites: ["Nomor PO ISSUED sudah terbit dan lokasi rak gudang tujuan aktif."],
    stepByStep: [
      "Pilih referensi PO -> daftar baris barang & sisa PO otomatis dimuat.",
      "Arahkan kursor ke bar Pindai Barcode Barang lalu scan produk berkali-kali untuk menambah Qty (+1 otomatis) beserta alokasi rak.",
      "Atau ketik langsung angka Qty Diterima dan pilih Lokasi Simpan per baris.",
      "Simpan Draft lalu Posting GRN setelah hitungan fisik cocok.",
    ],
    tips: [
      "Coba fitur tab Simulasi Scan Barcode di panduan ini kapan saja tanpa mengganggu baris barang yang sedang Anda isi.",
      "Pastikan lokasi rak yang dipilih tidak sedang dibekukan oleh sesi Stock Opname.",
    ],
    fieldIds: ["qty_received", "location_id", "barcode_sku", "allow_decimal"],
  },
  "stock-monitoring": {
    id: "stock-monitoring",
    title: "Monitoring Saldo & Buku Besar Stok",
    category: "Monitoring",
    summary:
      "Menampilkan saldo stok riil per lokasi rak, saldo per gudang, ringkasan agregat lintas gudang, barang dalam perjalanan, dan Stock Movement Ledger.",
    whenToUse: "Saat audit internal, pengecekan ketersediaan rak sebelum transfer, atau penelusuran histori keluar-masuk barang.",
    prerequisites: ["Minimal 1 transaksi GR POSTED atau Transfer telah tercatat."],
    stepByStep: [
      "Pilih tab tampilan yang diinginkan: Per Lokasi, Per Gudang, Ringkasan, Dalam Perjalanan, atau Buku Besar (Ledger).",
      "Gunakan pencarian SKU, barcode, atau filter gudang/lokasi untuk menyaring baris.",
      "Pada tab Buku Besar, telusuri nomor dokumen sumber dan perubahan saldo sebelum vs sesudah transaksi.",
    ],
    tips: [
      "Stock Movement Ledger bersifat permanen (immutable); setiap koreksi harus lewat transaksi opname/transfer resmi.",
      "Gunakan tombol Cek Stok / Rak di Topbar untuk pencarian instan lintas gudang via scanner.",
    ],
    fieldIds: ["barcode_sku", "allow_negative_stock", "warehouse_scoping"],
  },
  "stock-transfers": {
    id: "stock-transfers",
    title: "Transfer Stok Antar-Rak & Antar-Gudang",
    category: "Operasional",
    summary:
      "Proses pemindahan barang terstruktur mulai dari Draft, Disetujui (APPROVED), Dikirim (SHIPPED / In-Transit), hingga Diterima Tujuan (RECEIVED).",
    whenToUse: "Saat melakukan mutasi relokasi rak internal maupun pengiriman stok antar cabang gudang.",
    prerequisites: [
      "Saldo lokasi asal mencukupi (kecuali gudang mengizinkan stok negatif).",
      "Lokasi asal dan lokasi tujuan berada dalam status aktif dan tidak dibekukan Stock Opname.",
    ],
    stepByStep: [
      "Buat Draft Transfer: pilih Gudang & Lokasi Asal, Gudang & Lokasi Tujuan, serta daftar SKU & Qty kirim.",
      "Klik Setujui (APPROVED) -> lalu Kirim Transfer (SHIPPED) saat barang meninggalkan rak asal; cetak Surat Jalan Transfer.",
      "Petugas gudang tujuan membuka dokumen SHIPPED -> klik Terima Transfer, isi Qty Diterima aktual & alasan jika ada selisih.",
    ],
    tips: [
      "Selama status SHIPPED, stok tercatat aman pada tampilan Stok Dalam Perjalanan.",
      "Jika jumlah tiba kurang dari dikirim, sistem tetap memperbolehkan penerimaan selama alasan selisih (variance) diisi jelas.",
    ],
    fieldIds: ["transfer_variance", "location_id", "allow_negative_stock", "allow_decimal"],
  },
  "stock-opnames": {
    id: "stock-opnames",
    title: "Stock Opname & Penyesuaian Stok",
    category: "Operasional",
    summary:
      "Prosedur perhitungan fisik berkala dengan mekanisme pembekuan lokasi (LOCATION_FROZEN), dukungan scan barcode & barang temuan, dan persetujuan berjenjang.",
    whenToUse: "Saat stock take harian/bulanan/tahunan pada rak atau gudang tertentu.",
    prerequisites: ["Pengguna ditugaskan pada gudang target; tidak ada sesi opname aktif lain pada lokasi yang sama."],
    stepByStep: [
      "Buat sesi Stock Opname baru dan pilih lokasi rak yang akan diaudit.",
      "Mulai sesi (IN_PROGRESS): sistem mengambil snapshot saldo dan membekukan lokasi tersebut dari mutasi lain.",
      "Input Qty Hitung Fisik per baris (atau pindai barcode menggunakan scan bar untuk hitung +1 cepat).",
      "Klik Ajukan (SUBMITTED), lalu Supervisor menyetujui (APPROVED) agar selisih otomatis tercatat ke Ledger dan kunci rak terbuka kembali.",
    ],
    tips: [
      "Selalu selesaikan (APPROVED) atau batalkan (CANCELLED) sesi opname yang sudah selesai agar rak kembali bisa dipakai GR/Transfer.",
      "Barang fisik tak terduga yang tidak ada di snapshot awal tetap dapat ditambahkan sebagai item temuan selama masih di sesi opname.",
    ],
    fieldIds: ["location_id", "barcode_sku", "allow_negative_stock", "allow_decimal"],
  },
  "master-items": {
    id: "master-items",
    title: "Master Data Barang (SKU & Barcode)",
    category: "Data Master",
    summary:
      "Mengelola katalog barang induk lengkap dengan kode SKU unik, Barcode EAN/internal, Kategori, Satuan Ukur dasar (UoM), serta cetak label stiker barcode/QR.",
    whenToUse: "Saat mendaftarkan produk baru, meng-generate barcode otomatis, mengimpor Excel massal, atau mencetak stiker barang.",
    prerequisites: ["Minimal 1 Kategori aktif dan 1 Satuan Ukur (UoM) aktif sudah tersedia."],
    stepByStep: [
      "Klik Tambah barang atau Unduh Template Excel untuk import massal.",
      "Isi SKU unik (tanpa spasi) atau gunakan tombol Generate untuk mengisi Barcode internal otomatis.",
      "Setelah tersimpan, klik baris barang -> Atur Ukuran & Pratinjau untuk mencetak label stiker roll thermal atau lembaran A4.",
    ],
    tips: [
      "Kode SKU dan Satuan UoM dasar tidak dapat diubah setelah barang tercatat di transaksi gudang.",
      "Nonaktifkan barang daripada menghapus apabila item sudah tidak diperdagangkan agar histori historis tetap utuh.",
    ],
    fieldIds: ["barcode_sku", "allow_decimal"],
  },
  "master-uoms": {
    id: "master-uoms",
    title: "Master Satuan Ukur (UoM)",
    category: "Data Master",
    summary:
      "Mengatur satuan unit barang seperti PCS, DUS, BOX, KG, atau LITER beserta aturan pembulatan/desimal (allow_decimal).",
    whenToUse: "Sebelum membuat Master Barang atau menentukan apakah unit mendukung pecahan desimal.",
    prerequisites: ["Permission master:read atau master:manage."],
    stepByStep: [
      "Klik Tambah satuan ukur untuk menambah kode UoM baru (contoh: PCS, KG, ROLL).",
      "Centang Izinkan desimal (allow_decimal) hanya untuk satuan curah/berat/panjang seperti KG atau LITER.",
      "Gunakan filter atau Unduh CSV untuk rekap daftar satuan aktif.",
    ],
    tips: [
      "Satuan yang sedang dipakai oleh Master Barang aktif tidak dapat dinonaktifkan sebelum referensi barang dipindahkan/dinonaktifkan (proteksi ENTITY_IN_USE).",
    ],
    fieldIds: ["allow_decimal"],
  },
  "master-locations": {
    id: "master-locations",
    title: "Master Lokasi Penyimpanan (Rak / Bin)",
    category: "Data Master",
    summary:
      "Mengelola kode lokasi rak atau bin penyimpanan di dalam setiap gudang serta mencetak label QR/Barcode lokasi untuk ditempel di rak fisik.",
    whenToUse: "Saat menata denah rak baru gudang atau mencetak label identitas rak untuk kebutuhan scanner.",
    prerequisites: ["Minimal 1 Gudang aktif sudah terdaftar dan Anda memiliki akses gudang terkait."],
    stepByStep: [
      "Klik Tambah lokasi lalu pilih Gudang induk dan isi kode unik rak (contoh: RACK-A1-02).",
      "Klik baris lokasi untuk membuka Detail -> gunakan Cetak Label Rak (preset Rak Lorong 70x40 mm atau A4 Grid).",
      "Tempel label barcode/QR pada tiang rak fisik agar staf gudang mudah memverifikasi penempatan barang.",
    ],
    tips: [
      "Lokasi tidak boleh dinonaktifkan selama masih menyimpan saldo stok > 0 atau sedang dipakai transaksi terbuka.",
    ],
    fieldIds: ["location_id", "warehouse_scoping"],
  },
  "master-categories": {
    id: "master-categories",
    title: "Master Kategori Barang",
    category: "Data Master",
    summary: "Mengelompokkan katalog barang (SKU) berdasarkan jenis produk untuk memudahkan pencarian dan pelaporan inventaris.",
    whenToUse: "Saat menambah kelompok klasifikasi barang baru atau mengekspor daftar kategori.",
    prerequisites: ["Permission master:manage untuk menambah/mengubah."],
    stepByStep: [
      "Klik Tambah kategori dan masukkan kode serta nama kategori yang jelas.",
      "Gunakan kotak pencarian untuk memeriksa duplikasi sebelum menyimpan.",
    ],
    tips: ["Kategori yang masih memiliki barang aktif terlindungi dari penonaktifan otomatis (ENTITY_IN_USE)."],
    fieldIds: ["barcode_sku"],
  },
  "master-suppliers": {
    id: "master-suppliers",
    title: "Master Pemasok (Supplier)",
    category: "Data Master",
    summary: "Mengelola daftar vendor/pemasok resmi untuk transaksi Purchase Order, lengkap dengan fitur import Excel massal & ekspor CSV.",
    whenToUse: "Sebelum membuat PO untuk vendor baru atau memperbarui kontak/alamat pemasok.",
    prerequisites: ["Permission master:manage untuk modifikasi atau import."],
    stepByStep: [
      "Klik Tambah pemasok untuk input satuan, atau Import Excel (.xlsx) untuk unggah banyak vendor sekaligus.",
      "Pastikan kode pemasok unik dan status Aktif agar dapat dipilih di form Purchase Order.",
    ],
    tips: ["Pemasok yang masih terikat pada PO terbuka tidak dapat dinonaktifkan hingga PO diselesaikan atau dibatalkan."],
    fieldIds: ["po_status_issued"],
  },
  "master-warehouses": {
    id: "master-warehouses",
    title: "Master Gudang & Kebijakan Stok",
    category: "Data Master",
    summary: "Mengelola daftar gudang pusat, cabang/toko, kebijakan allow_negative_stock, serta cetak label barcode/QR pengenal gudang.",
    whenToUse: "Saat menambah cabang gudang baru atau memeriksa kebijakan stok minus per gudang.",
    prerequisites: ["Permission master:manage."],
    stepByStep: [
      "Klik Tambah gudang, isi kode unik, nama, dan alamat gudang.",
      "Atur flag Izinkan Stok Negatif (disarankan OFF untuk ketelitian inventaris maksimal).",
      "Setelah gudang dibuat, tugaskan pengguna terkait melalui menu Administrasi -> Pengguna & Peran.",
    ],
    tips: ["Pengaturan allow_negative_stock memengaruhi validasi kirim Transfer dan penyesuaian Stock Opname."],
    fieldIds: ["allow_negative_stock", "warehouse_scoping"],
  },
  administration: {
    id: "administration",
    title: "Administrasi Pengguna, Peran & Menu",
    category: "Administrasi",
    summary: "Mengatur akun staf, peran RBAC beserta hak akses permission, penugasan gudang per user, dan susunan menu navigasi.",
    whenToUse: "Saat mendaftarkan staf baru, membatasi akses gudang operator, atau mengelola permission role.",
    prerequisites: ["Role Superadmin atau akun berizin user:manage."],
    stepByStep: [
      "Di tab Pengguna: tambah pengguna, pilih Role, lalu atur daftar Gudang yang ditugaskan.",
      "Di tab Peran dan permission: atur matriks permission granular setiap role.",
      "Di tab Menu: kelola tampilan navigasi sidebar tanpa menghapus data historis.",
    ],
    tips: ["Selalu berikan penugasan gudang minimal 1 gudang kepada staf operasional agar bisa memproses dokumen."],
    fieldIds: ["warehouse_scoping"],
  },
  "document-templates": {
    id: "document-templates",
    title: "Pengaturan Template Dokumen Cetak Modular",
    category: "Administrasi",
    summary: "Menyesuaikan tampilan kop surat, logo perusahaan, ukuran kertas, kolom tabel, urutan bagian, dan blok tanda tangan untuk cetak GRN, Surat Jalan Transfer, dan PO.",
    whenToUse: "Saat branding dokumen resmi perusahaan, mengganti ukuran kertas (A4/F4/Letter), atau mengatur kolom tanda tangan.",
    prerequisites: ["Akun dengan permission user:manage.", "File logo format PNG, JPG, atau WEBP maksimal 2 MB."],
    stepByStep: [
      "Pilih jenis dokumen cetak di atas form: GRN, Surat Jalan Transfer, atau Purchase Order.",
      "Isi nama perusahaan/gudang, unggah file logo, lalu atur posisi & ukuran logo.",
      "Sesuaikan urutan bagian dokumen, centang/ubah label kolom tabel, dan pilih Preset 2 atau 3 Kolom tanda tangan.",
      "Periksa Pratinjau Langsung di sisi kanan lalu klik Simpan Template.",
    ],
    tips: [
      "Minimal 1 kolom tabel harus tetap ditampilkan agar dokumen dapat disimpan.",
      "Setiap perubahan template otomatis tercatat di Audit Log sebagai jejak perubahan sistem.",
    ],
    fieldIds: ["document_template_layout"],
  },
  "audit-logs": {
    id: "audit-logs",
    title: "Audit Log Sistem (Jejak Aktivitas)",
    category: "Administrasi",
    summary: "Merekam secara kronologis dan permanen seluruh aktivitas sukses maupun gagal beserta alamat IP asal dan perbandingan data sebelum vs sesudah (diff viewer).",
    whenToUse: "Saat investigasi perubahan data master, pelacakan persetujuan transaksi, atau pemeriksaan percobaan akses ditolak.",
    prerequisites: ["Akun memiliki permission audit:read."],
    stepByStep: [
      "Saring log berdasarkan Status (SUCCESS/FAILURE), Pengguna, Aksi, Entitas, atau rentang tanggal.",
      "Klik Detail pada salah satu baris untuk membuka Diff Viewer JSON perubahan data lama dan baru.",
    ],
    tips: ["Data sensitif seperti password dan token otomatis disensor pada catatan audit."],
    fieldIds: ["warehouse_scoping"],
  },
  profile: {
    id: "profile",
    title: "Profil Pengguna & Keamanan Akun",
    category: "Administrasi",
    summary: "Melihat peran aktif, daftar gudang yang ditugaskan, dan memperbarui kata sandi akun Anda secara aman.",
    whenToUse: "Saat ingin memastikan cakupan gudang akun atau mengganti kata sandi secara berkala.",
    prerequisites: ["Sesi akun dalam keadaan login aktif."],
    stepByStep: [
      "Periksa informasi Role serta daftar Gudang yang terhubung ke akun Anda.",
      "Untuk mengganti password, masukkan kata sandi lama dan sandi baru minimal 8 karakter.",
    ],
    tips: ["Setelah berhasil mengganti kata sandi, seluruh sesi perangkat lain akan dicabut demi keamanan."],
    fieldIds: ["warehouse_scoping"],
  },
};

export const BARCODE_SIMULATION_PRESETS: BarcodeSimulationPreset[] = [
  {
    id: "product-ean",
    label: "Barcode Produk (EAN-13)",
    sampleCode: "8991234567890",
    description: "Simulasi scan kemasan barang ritel menggunakan scanner USB/Bluetooth HID.",
  },
  {
    id: "product-wms",
    label: "Barcode Internal WMS",
    sampleCode: "SKU-KOP-250",
    description: "Simulasi scan stiker kode SKU/barcode internal yang dicetak dari modul Barang.",
  },
  {
    id: "location-qr",
    label: "QR / Barcode Lokasi Rak",
    sampleCode: "LOC-WHJKT-RACKA1",
    description: "Simulasi scan stiker rak gudang untuk memastikan penempatan bin akurat.",
  },
  {
    id: "doc-po",
    label: "Barcode Dokumen PO / GRN / TRF",
    sampleCode: "PO-202611-0088",
    description: "Simulasi scan barcode nomor dokumen pada header cetakan PDF/kertas.",
  },
];

/**
 * Mensimulasikan perilaku parser scanner barcode/QR secara client-side murni tanpa memanggil API.
 */
export function simulateBarcodeScan(rawInput: string): BarcodeSimulationResult {
  const normalized = rawInput.trim();
  if (!normalized) {
    return {
      rawInput,
      normalizedCode: "",
      status: "INVALID",
      detectedKind: "UNKNOWN",
      detectedLabel: "Input Kosong",
      recommendedScreen: "Bar Scan Barcode",
      systemBehavior: "Pemindaian diabaikan oleh aplikasi karena nilai barcode kosong.",
      validationMessage: "Masukkan atau pindai kode barcode terlebih dahulu (minimal 3 karakter).",
    };
  }

  if (/\s/.test(normalized) || normalized.length < 3) {
    return {
      rawInput,
      normalizedCode: normalized,
      status: "INVALID",
      detectedKind: "UNKNOWN",
      detectedLabel: "Format Kode Tidak Valid",
      recommendedScreen: "Bar Scan Barcode",
      systemBehavior:
        "Aplikasi menolak pencarian otomatis karena kode mengandung spasi atau panjang kurang dari 3 karakter.",
      validationMessage:
        "Pastikan scanner mengirim akhiran Enter/Tab dan kode tidak terpotong atau berspasi.",
    };
  }

  const upper = normalized.toUpperCase();
  if (/^(PO|GR|TRF|OPN)-\d/.test(upper)) {
    return {
      rawInput,
      normalizedCode: upper,
      status: "VALID",
      detectedKind: "DOCUMENT",
      detectedLabel: "Barcode Nomor Dokumen Transaksi",
      recommendedScreen: "Pencarian Daftar Transaksi (PO / GRN / Transfer / Opname)",
      systemBehavior:
        "Menyaring daftar dokumen secara cepat menuju nomor transaksi yang tertera pada lembar cetak fisik.",
      validationMessage: `Nomor dokumen '${upper}' siap dicocokkan dengan arsip transaksi aktif.`,
    };
  }

  if (/^(LOC|RAK|RACK|BIN)[-_]/.test(upper)) {
    return {
      rawInput,
      normalizedCode: upper,
      status: "VALID",
      detectedKind: "LOCATION",
      detectedLabel: "Kode / QR Lokasi Rak Simpan",
      recommendedScreen: "Cek Stok / Rak -> Tab Cek Lokasi atau Pilihan Rak Opname",
      systemBehavior:
        "Mengidentifikasi kode rak/bin gudang untuk mengecek seluruh saldo SKU yang berada di rak tersebut.",
      validationMessage: `Kode lokasi '${upper}' valid dan siap digunakan untuk verifikasi penempatan rak.`,
    };
  }

  return {
    rawInput,
    normalizedCode: normalized,
    status: "VALID",
    detectedKind: "PRODUCT",
    detectedLabel: /^\d{8,14}$/.test(normalized)
      ? "Barcode Kemasan Produk (Numerik Standar)"
      : "Kode SKU / Barcode Internal Produk",
    recommendedScreen: "Form Goods Receipt, Stock Opname, atau Cek Stok / Rak",
    systemBehavior:
      "Mencari barang di database: pada form Goods Receipt / Stock Opname otomatis menambah Qty (+1) untuk baris SKU terkait sambil memainkan konfirmasi visual.",
    validationMessage: `Kode barang '${normalized}' terbaca utuh tanpa gangguan karakter kontrol.`,
  };
}
