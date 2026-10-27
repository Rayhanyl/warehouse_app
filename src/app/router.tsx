import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";

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
    path: "/dashboard",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <main>
            <h1>Dashboard</h1>
            <p>Warehouse Management System</p>
          </main>
        ),
      },
    ],
  },
]);
