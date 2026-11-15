import type { QueryClient } from "@tanstack/react-query";

/**
 * Meng-invalidate sekaligus memicu refetch ulang untuk seluruh query (termasuk yang sedang
 * inactive saat pengguna berpindah halaman form -> daftar) agar tabel langsung segar.
 */
export async function invalidateAndRefetchAll(
  queryClient: QueryClient,
  queryKeys: readonly (readonly unknown[])[],
): Promise<void> {
  await Promise.all(
    queryKeys.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey, refetchType: "all" }),
    ),
  );
}

/**
 * Menyegarkan cache referensi lintas modul transaksi & dashboard setelah master data berubah.
 */
export async function invalidateMasterDependentCaches(
  queryClient: QueryClient,
): Promise<void> {
  await invalidateAndRefetchAll(queryClient, [
    ["dashboard"],
    ["purchase-orders", "references"],
    ["goods-receipts", "references"],
    ["stock-transfers", "references"],
    ["stock-opnames", "references"],
    ["stock"],
  ]);
}
