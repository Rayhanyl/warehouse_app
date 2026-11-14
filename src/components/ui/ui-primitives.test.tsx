import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

describe("shadcn/ui primitives", () => {
  it("merender Button dengan type default button, variant, dan handler klik", () => {
    const onClick = vi.fn();
    render(
      <Button variant="destructive" onClick={onClick}>
        Hapus
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Hapus" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-variant", "destructive");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("mengaitkan Label dengan Input dan Textarea secara aksesibel", () => {
    render(
      <div>
        <Label htmlFor="sku-code">Kode SKU</Label>
        <Input id="sku-code" placeholder="SKU-001" />
        <Label htmlFor="sku-note">Catatan</Label>
        <Textarea id="sku-note" placeholder="Keterangan barang" />
      </div>,
    );

    const input = screen.getByLabelText("Kode SKU");
    const textarea = screen.getByLabelText("Catatan");
    fireEvent.change(input, { target: { value: "BRG-100" } });
    fireEvent.change(textarea, { target: { value: "Rak A1" } });

    expect(input).toHaveValue("BRG-100");
    expect(textarea).toHaveValue("Rak A1");
  });

  it("merender Card, Badge, dan Table terstruktur dengan rapi", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Stok</CardTitle>
          <CardDescription>Data gudang aktif</CardDescription>
          <CardAction>
            <Badge variant="warning">Perlu Dicek</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>SKU-01</TableCell>
                <TableCell>24</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>Footer kartu</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Ringkasan Stok")).toBeInTheDocument();
    expect(screen.getByText("Perlu Dicek")).toHaveAttribute(
      "data-variant",
      "warning",
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("SKU-01")).toBeInTheDocument();
    expect(screen.getByText("Footer kartu")).toBeInTheDocument();
  });

  it("mengganti konten aktif pada Tabs saat tab lain dipilih", () => {
    render(
      <Tabs defaultValue="ringkas">
        <TabsList variant="line">
          <TabsTrigger value="ringkas">Ringkas</TabsTrigger>
          <TabsTrigger value="detail">Detail</TabsTrigger>
        </TabsList>
        <TabsContent value="ringkas">Konten Ringkas</TabsContent>
        <TabsContent value="detail">Konten Detail</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Konten Ringkas")).toBeVisible();
    const detailTab = screen.getByRole("tab", { name: "Detail" });
    fireEvent.mouseDown(detailTab, { button: 0, ctrlKey: false });
    fireEvent.click(detailTab);
    expect(screen.getByText("Konten Detail")).toBeVisible();
  });

  it("membuka Dialog dan Sheet dari trigger masing-masing", () => {
    render(
      <div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Buka Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Dokumen</DialogTitle>
              <DialogDescription>Pastikan data sudah benar.</DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton>
              <span>Isi Footer</span>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Buka Panel</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter Lanjutan</SheetTitle>
              <SheetDescription>Pilih parameter pencarian.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>

        <Select defaultValue="wh-1">
          <SelectTrigger aria-label="Pilih Gudang">
            <SelectValue placeholder="Pilih gudang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wh-1">Gudang Utama</SelectItem>
          </SelectContent>
        </Select>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka Dialog" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Konfirmasi Dokumen")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Buka Panel" }));
    expect(screen.getByText("Filter Lanjutan")).toBeInTheDocument();

    expect(screen.getByRole("combobox", { name: "Pilih Gudang" })).toHaveTextContent(
      "Gudang Utama",
    );
  });
});
