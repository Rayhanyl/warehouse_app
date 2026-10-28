import { createBrowserRouter } from "react-router-dom";
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
            path: "/audit-logs",
            element: <AuditLogsPage />,
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
