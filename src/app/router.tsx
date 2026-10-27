import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { AdminPlaceholderPage, DashboardPage } from "@/pages/DashboardPage";
import { AuditLogsPage } from "@/features/audit-logs/pages/AuditLogsPage";
import { ProfilePage } from "@/features/auth/pages/ProfilePage";

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
