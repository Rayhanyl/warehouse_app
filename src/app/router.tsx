import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AuditLogsPage } from "@/features/audit-logs/pages/AuditLogsPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ProfilePage } from "@/features/auth/pages/ProfilePage";
import { CategoriesPage } from "@/features/master-data/categories/pages/CategoriesPage";
import { UomsPage } from "@/features/master-data/uoms/pages/UomsPage";
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
