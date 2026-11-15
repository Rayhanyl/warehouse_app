import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { purchaseOrderKeys, usePurchaseOrderMutation } from "@/features/purchase-orders/api";
import { invalidateAndRefetchAll, invalidateMasterDependentCaches } from "./query-invalidation";

describe("Tahap 35: Sinkronisasi Cache & Auto-Refresh Query", () => {
  it("invalidateAndRefetchAll memanggil invalidateQueries dengan refetchType: 'all' untuk semua key", async () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();

    await invalidateAndRefetchAll(queryClient, [
      ["purchase-orders", "list"],
      ["dashboard"],
    ]);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, {
      queryKey: ["purchase-orders", "list"],
      refetchType: "all",
    });
    expect(spy).toHaveBeenNthCalledWith(2, {
      queryKey: ["dashboard"],
      refetchType: "all",
    });
  });

  it("invalidateMasterDependentCaches memicu refresh cache transaksi, stok, dan dashboard", async () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();

    await invalidateMasterDependentCaches(queryClient);

    const calledKeys = spy.mock.calls.map(([arg]) => arg?.queryKey);
    expect(calledKeys).toEqual([
      ["dashboard"],
      ["purchase-orders", "references"],
      ["goods-receipts", "references"],
      ["stock-transfers", "references"],
      ["stock-opnames", "references"],
      ["stock"],
    ]);
    for (const [arg] of spy.mock.calls) {
      expect(arg?.refetchType).toBe("all");
    }
  });

  it("usePurchaseOrderMutation(create) meng-invalidate daftar PO (inactive sekalipun), referensi GR, dan dashboard", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    const createdPo = {
      id: 99,
      po_number: "PO-2026-0099",
      status: "DRAFT",
    };
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({ data: createdPo } as never);

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => usePurchaseOrderMutation("create"), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        payload: {
          supplier_id: 1,
          warehouse_id: 1,
          order_date: "2026-11-15",
          notes: "Test",
          lines: [{ item_id: 1, qty_ordered: "5" }],
        },
      });
    });

    expect(postSpy).toHaveBeenCalledWith("/purchase-orders", {
      supplier_id: 1,
      warehouse_id: 1,
      order_date: "2026-11-15",
      notes: "Test",
      lines: [{ item_id: 1, qty_ordered: "5" }],
    });
    expect(queryClient.getQueryData(purchaseOrderKeys.detail(99))).toEqual(createdPo);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: purchaseOrderKeys.lists(),
      refetchType: "all",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["goods-receipts", "references"],
      refetchType: "all",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["dashboard"],
      refetchType: "all",
    });

    postSpy.mockRestore();
  });
});
