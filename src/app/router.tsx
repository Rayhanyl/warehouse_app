import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AuditLogsPage } from "@/features/audit-logs/pages/AuditLogsPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ProfilePage } from "@/features/auth/pages/ProfilePage";
import { CategoriesPage } from "@/features/master-data/categories/pages/CategoriesPage";
import { StocksPage } from "@/features/master-data/stocks/pages/StocksPage";
import { StorageLocationsPage } from "@/features/master-data/storage-locations/pages/StorageLocationsPage";
import { SuppliersPage } from "@/features/master-data/suplliers/pages/SuppliersPage";
import { UomsPage } from "@/features/master-data/uoms/pages/UomsPage";
import { WarehousesPage } from "@/features/master-data/warehouses/pages/WarehousesPage";
import { PurchaseOrderCreatePage, PurchaseOrdersPage } from "@/features/purchase-orders/pages/PurchaseOrdersPage";
import { GoodsReceiptCreatePage, GoodsReceiptsPage } from "@/features/goods-receipts/pages/GoodsReceiptsPage";
import { StockTransfersPage } from "@/features/stock-transfers/pages/StockTransfersPage";
import { StockOpnamesPage } from "@/features/stock-opnames/pages/StockOpnamesPage";
import { StockPage } from "@/features/stock/pages/StockPage";
import { AdministrationPage } from "@/features/administration/pages/AdministrationPage";
import { AdminPlaceholderPage, DashboardPage } from "@/pages/DashboardPage";
import { LandingPage } from "@/pages/LandingPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/master/categories",
            element: <CategoriesPage />,
          },
          {
            path: "/categories",
            element: <CategoriesPage />,
          },
          {
            path: "/master/uom",
            element: <UomsPage />,
          },
          {
            path: "/master/uoms",
            element: <UomsPage />,
          },
          {
            path: "/uom",
            element: <UomsPage />,
          },
          {
            path: "/uoms",
            element: <UomsPage />,
          },
          {
            path: "/master/suppliers",
            element: <SuppliersPage />,
          },
          {
            path: "/suppliers",
            element: <SuppliersPage />,
          },
          {
            path: "/master/items",
            element: <StocksPage />,
          },
          {
            path: "/items",
            element: <StocksPage />,
          },
          {
            path: "/master/stocks",
            element: <StocksPage />,
          },
          {
            path: "/stocks",
            element: <StocksPage />,
          },
          {
            path: "/master/warehouses",
            element: <WarehousesPage />,
          },
          {
            path: "/warehouses",
            element: <WarehousesPage />,
          },
          {
            path: "/master/locations",
            element: <StorageLocationsPage />,
          },
          {
            path: "/master/storage-locations",
            element: <StorageLocationsPage />,
          },
          {
            path: "/locations",
            element: <StorageLocationsPage />,
          },
          {
            path: "/storage-locations",
            element: <StorageLocationsPage />,
          },
          {
            path: "/admin/audit-logs",
            element: <AuditLogsPage />,
          },
          {
            path: "/audit-logs",
            element: <AuditLogsPage />,
          },
          {
            path: "/audit",
            element: <AuditLogsPage />,
          },
          {
            path: "/users",
            element: <AdministrationPage />,
          },
          {
            path: "/admin",
            element: <AdministrationPage />,
          },
          {
            path: "/admin/users",
            element: <AdministrationPage />,
          },
          {
            path: "/admin/roles",
            element: <AdministrationPage />,
          },
          {
            path: "/admin/menus",
            element: <AdministrationPage />,
          },
          {
            path: "/purchase-orders/new",
            element: <PurchaseOrderCreatePage />,
          },
          {
            path: "/purchase-orders",
            element: <PurchaseOrdersPage />,
          },
          {
            path: "/purchasing/purchase-orders/new",
            element: <PurchaseOrderCreatePage />,
          },
          {
            path: "/purchasing/purchase-orders",
            element: <PurchaseOrdersPage />,
          },
          {
            path: "/goods-receipts/new",
            element: <GoodsReceiptCreatePage />,
          },
          {
            path: "/goods-receipts",
            element: <GoodsReceiptsPage />,
          },
          {
            path: "/purchasing/goods-receipts/new",
            element: <GoodsReceiptCreatePage />,
          },
          {
            path: "/purchasing/goods-receipts",
            element: <GoodsReceiptsPage />,
          },
          {
            path: "/stock",
            element: <StockPage />,
          },
          {
            path: "/stock/balances",
            element: <Navigate to="/stock" replace />,
          },
          {
            path: "/stock/by-location",
            element: <StockPage />,
          },
          {
            path: "/stock/warehouse",
            element: <StockPage />,
          },
          {
            path: "/stock/by-warehouse",
            element: <StockPage />,
          },
          {
            path: "/stock/summary",
            element: <StockPage />,
          },
          {
            path: "/stock/in-transit",
            element: <StockPage />,
          },
          {
            path: "/stock/ledger",
            element: <StockPage />,
          },
          {
            path: "/stock-transfers",
            element: <StockTransfersPage />,
          },
          {
            path: "/operations/stock-transfers",
            element: <StockTransfersPage />,
          },
          {
            path: "/stock-opnames",
            element: <StockOpnamesPage />,
          },
          {
            path: "/operations/stock-opnames",
            element: <StockOpnamesPage />,
          },
          {
            path: "/profile",
            element: <ProfilePage />,
          },
          {
            path: "*",
            element: <AdminPlaceholderPage />,
          },
        ],
      },
    ],
  },
]);
