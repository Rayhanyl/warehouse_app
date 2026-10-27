import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { menuQueryKey } from "@/features/navigation/api";

describe("AppShell", () => {
  it("renders the application navigation", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(menuQueryKey, [
      {
        id: 1,
        code: "dashboard",
        name: "Dasbor",
        path: "/dashboard",
        icon: "dashboard",
        parent_id: null,
        sort_order: 0,
        permission_code: null,
        children: [],
      },
    ]);
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <AppShell />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Jejakstok")).toBeInTheDocument();
    expect(screen.getAllByText("Dasbor").length).toBeGreaterThan(0);
  });
});
