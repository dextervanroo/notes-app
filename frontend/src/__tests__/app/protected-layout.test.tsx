import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/api";
import ProtectedLayout from "@/app/(protected)/layout";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  isAuthenticated: vi.fn(),
}));

describe("ProtectedLayout", () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
      push: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as ReturnType<typeof useRouter>);
  });

  it("redirects to /login when not authenticated", async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false);
    render(<ProtectedLayout><p>Secret</p></ProtectedLayout>);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);
    render(<ProtectedLayout><p>Protected content</p></ProtectedLayout>);

    await waitFor(() => {
      expect(screen.getByText("Protected content")).toBeInTheDocument();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows a blank loading screen before the auth check resolves", () => {
    vi.mocked(isAuthenticated).mockReturnValue(false);
    const { container } = render(<ProtectedLayout><p>Secret</p></ProtectedLayout>);

    // Before the effect fires, children are not rendered
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
    // The placeholder div is present
    expect(container.querySelector("div.min-h-screen")).toBeInTheDocument();
  });
});
