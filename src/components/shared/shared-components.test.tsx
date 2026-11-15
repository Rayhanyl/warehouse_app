import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DataPagination,
  DataStateBanner,
  ResponsiveDataView,
  StatusBadge,
  type ResponsiveColumn,
} from "@/components/shared";

interface SampleItem {
  id: number;
  code: string;
  status: string;
}

const COLUMNS: ResponsiveColumn<SampleItem>[] = [
  { id: "code", header: "Kode", cell: (item) => item.code },
  {
    id: "status",
    header: "Status",
    cell: (item) => <StatusBadge status={item.status} />,
  },
];

function mockViewport(isMobile: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string): MediaQueryList => ({
      matches: query.includes("767px") ? isMobile : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("Shared composable components", () => {
  beforeEach(() => {
    mockViewport(false);
  });

  it("memetakan StatusBadge ke varian dan label WMS yang konsisten", () => {
    render(
      <div>
        <StatusBadge status="APPROVED" />
        <StatusBadge status="PENDING" />
        <StatusBadge status="REJECTED" />
        <StatusBadge status="IN_TRANSIT" />
        <StatusBadge status="CUSTOM_TAG" />
      </div>,
    );

    expect(screen.getByText("Disetujui")).toHaveAttribute(
      "data-variant",
      "default",
    );
    expect(screen.getByText("Menunggu")).toHaveAttribute(
      "data-variant",
      "warning",
    );
    expect(screen.getByText("Ditolak")).toHaveAttribute(
      "data-variant",
      "destructive",
    );
    expect(screen.getByText("Dalam Pengiriman")).toHaveAttribute(
      "data-variant",
      "info",
    );
    expect(screen.getByText("CUSTOM_TAG")).toHaveAttribute(
      "data-variant",
      "outline",
    );
  });

  it("merender DataStateBanner untuk status loading, empty, dan error + retry", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <DataStateBanner state="loading" title="Memuat daftar..." skeletonRows={2} />,
    );

    expect(screen.getByRole("status", { name: "Memuat daftar..." })).toBeInTheDocument();

    rerender(
      <DataStateBanner
        state="error"
        description="Koneksi timeout"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Koneksi timeout");
    fireEvent.click(screen.getByRole("button", { name: "Muat ulang" }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(
      <DataStateBanner
        state="empty"
        title="Data kosong"
        action={<button type="button">Reset Filter</button>}
      />,
    );
    expect(screen.getByText("Data kosong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset Filter" })).toBeInTheDocument();
  });

  it("menghitung rentang item dan event navigasi pada DataPagination", () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    const { container } = render(
      <DataPagination
        page={1}
        pageSize={10}
        total={25}
        itemLabel="barang"
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    expect(container.textContent).not.toMatch(/[—–]/);
    expect(screen.getByText("Menampilkan 1-10 dari 25 barang")).toBeInTheDocument();
    expect(screen.getByText("Hal 1 / 3")).toBeInTheDocument();

    const prevButton = screen.getByRole("button", { name: /Sebelumnya/i });
    const nextButton = screen.getByRole("button", { name: /Berikutnya/i });
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2);

    fireEvent.change(screen.getByLabelText("Jumlah data per halaman"), {
      target: { value: "20" },
    });
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });

  it("beralih otomatis antara tabel desktop dan kartu mobile pada ResponsiveDataView", () => {
    const items: SampleItem[] = [
      { id: 1, code: "PO-001", status: "OPEN" },
      { id: 2, code: "PO-002", status: "COMPLETED" },
    ];

    const { rerender } = render(
      <ResponsiveDataView
        data={items}
        keyExtractor={(item) => item.id}
        columns={COLUMNS}
        renderMobileCard={(item) => <div>Kartu Mobile: {item.code}</div>}
      />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("PO-001")).toBeInTheDocument();
    expect(screen.queryByText(/Kartu Mobile/)).not.toBeInTheDocument();

    mockViewport(true);
    rerender(
      <ResponsiveDataView
        data={items}
        keyExtractor={(item) => item.id}
        columns={COLUMNS}
        renderMobileCard={(item) => <div>Kartu Mobile: {item.code}</div>}
      />,
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Kartu Mobile: PO-001")).toBeInTheDocument();
    expect(screen.getByText("Kartu Mobile: PO-002")).toBeInTheDocument();

    rerender(
      <ResponsiveDataView
        data={[]}
        keyExtractor={(item) => item.id}
        columns={COLUMNS}
        renderMobileCard={(item) => <div>{item.code}</div>}
        emptyTitle="Tidak ada PO"
      />,
    );
    expect(screen.getByText("Tidak ada PO")).toBeInTheDocument();
  });
});
