import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import * as api from "@/lib/api";
import DashboardPage from "@/app/(protected)/page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/lib/api", () => ({
  getNotes: vi.fn(),
  getCategories: vi.fn(),
  clearTokens: vi.fn(),
  hexToRgba: (_hex: string, alpha: number) => `rgba(0,0,0,${alpha})`,
  formatDate: () => "today",
}));

// CategoryDialog pulls in react-color which needs canvas — stub the whole component
vi.mock("@/components/CategoryDialog", () => ({
  default: () => null,
}));

const mockCategory = { id: "cat-1", name: "Work", color: "#4ECDC4", createdAt: "" };
const mockNote = {
  id: "note-1",
  title: "My First Note",
  body: "Hello world",
  category: mockCategory,
  createdAt: "2024-01-01T12:00:00Z",
  updatedAt: "2024-01-01T12:00:00Z",
};

describe("DashboardPage", () => {
  const mockPush = vi.fn();
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: vi.fn(),
      prefetch: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);
  });

  it("shows the empty state when there are no notes", async () => {
    vi.mocked(api.getNotes).mockResolvedValue([]);
    vi.mocked(api.getCategories).mockResolvedValue([]);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/waiting for your charming notes/i)).toBeInTheDocument();
    });
  });

  it("renders a note card for each note", async () => {
    vi.mocked(api.getNotes).mockResolvedValue([mockNote]);
    vi.mocked(api.getCategories).mockResolvedValue([mockCategory]);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("My First Note")).toBeInTheDocument();
    });
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("lists categories in the sidebar", async () => {
    vi.mocked(api.getNotes).mockResolvedValue([mockNote]);
    vi.mocked(api.getCategories).mockResolvedValue([mockCategory]);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Work/ })).toBeInTheDocument();
    });
  });

  it("shows the correct note count next to each category", async () => {
    vi.mocked(api.getNotes).mockResolvedValue([mockNote]);
    vi.mocked(api.getCategories).mockResolvedValue([mockCategory]);
    render(<DashboardPage />);

    await waitFor(() => {
      // The count "1" appears next to "Work"
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("shows a New Note link", async () => {
    vi.mocked(api.getNotes).mockResolvedValue([]);
    vi.mocked(api.getCategories).mockResolvedValue([]);
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /new note/i })).toHaveAttribute("href", "/notes/new");
    });
  });

  it("clears tokens and redirects to /login on logout", async () => {
    vi.mocked(api.getNotes).mockResolvedValue([]);
    vi.mocked(api.getCategories).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => screen.getByRole("button", { name: /logout/i }));
    await user.click(screen.getByRole("button", { name: /logout/i }));

    expect(api.clearTokens).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("filters by category when a sidebar item is clicked", async () => {
    vi.mocked(api.getNotes).mockResolvedValue([mockNote]);
    vi.mocked(api.getCategories).mockResolvedValue([mockCategory]);
    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => screen.getByRole("button", { name: /Work/ }));
    await user.click(screen.getByRole("button", { name: /Work/ }));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("category=cat-1"));
  });
});
