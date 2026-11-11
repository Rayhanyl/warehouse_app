/**
 * Modul utilitas barcode untuk JejakStok WMS.
 *
 * Standar Barcode Internal:
 * Menggunakan prefix GS1 restricted circulation (200 - 299) yang dialokasikan khusus
 * untuk penggunaan internal toko/gudang dan dijamin tidak berbenturan dengan barcode
 * produk komersial pabrik (EAN-13 komersial).
 *
 * Format EAN-13 Internal:
 * - 3 digit prefix internal: "200"
 * - 9 digit serial acak/urutan: "XXXXXXXXX"
 * - 1 digit modulo-10 check digit: "C"
 * Total = 13 digit numerik standar.
 */

/**
 * Menghitung check digit standar EAN-13 modulo-10 untuk 12 digit pertama.
 * Algoritma GS1:
 * Sum = digit_ganjil*1 + digit_genap*3 (1-indexed)
 * Check digit = (10 - (Sum % 10)) % 10
 */
export function calculateEan13CheckDigit(digits12: string): number {
  if (digits12.length !== 12 || !/^\d{12}$/.test(digits12)) {
    throw new Error("Input EAN-13 check digit harus berupa 12 digit numerik.");
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits12[i], 10);
    // Posisi ganjil (indeks 0, 2, 4...) berbobot 1, posisi genap (indeks 1, 3, 5...) berbobot 3
    sum += i % 2 === 0 ? digit * 1 : digit * 3;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Memvalidasi apakah sebuah string merupakan barcode EAN-13 yang valid secara checksum.
 */
export function isValidEan13(code: string): boolean {
  if (!code || code.length !== 13 || !/^\d{13}$/.test(code)) {
    return false;
  }
  const payload = code.slice(0, 12);
  const checkDigit = parseInt(code.charAt(12), 10);
  return calculateEan13CheckDigit(payload) === checkDigit;
}

/**
 * Membuat barcode EAN-13 internal baru dengan prefix '200' dan checksum valid.
 * Menghindari duplikasi bila daftar barcode yang sudah terdaftar disediakan.
 */
export function generateInternalBarcode(existingBarcodes: Array<string | null | undefined> = []): string {
  const existingSet = new Set(
    existingBarcodes
      .filter((b): b is string => typeof b === "string" && b.trim().length > 0)
      .map((b) => b.trim().toLowerCase()),
  );

  // Coba hasilkan secara random hingga 100 iterasi agar tidak menabrak barcode yang sudah ada
  for (let attempt = 0; attempt < 100; attempt++) {
    const randomPart = Math.floor(Math.random() * 1_000_000_000)
      .toString()
      .padStart(9, "0");
    const payload = `200${randomPart}`;
    const checkDigit = calculateEan13CheckDigit(payload);
    const candidate = `${payload}${checkDigit}`;

    if (!existingSet.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  // Fallback berbasis timestamp jika iterasi acak menabrak
  const timestampPart = (Date.now() % 1_000_000_000).toString().padStart(9, "0");
  const payload = `200${timestampPart}`;
  return `${payload}${calculateEan13CheckDigit(payload)}`;
}
