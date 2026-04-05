import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { login, ApiError } from "@/lib/api";
import LoginPage from "@/app/login/page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/lib/api", () => ({
  login: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

describe("LoginPage", () => {
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

  it("renders the login form", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("shows a link to the register page", () => {
    render(<LoginPage />);
    const link = screen.getByRole("link", { name: /never been here/i });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("toggles password field visibility", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByPlaceholderText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show/i }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("calls login with the submitted credentials", async () => {
    vi.mocked(login).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("Username"), "testuser");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("testuser", "secret123");
    });
  });

  it("redirects to / on successful login", async () => {
    vi.mocked(login).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("Username"), "testuser");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("shows invalid credentials error on 401", async () => {
    vi.mocked(login).mockRejectedValue(new ApiError(401, "Unauthorized"));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("Username"), "testuser");
    await user.type(screen.getByPlaceholderText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid username or password.")).toBeInTheDocument();
    });
  });

  it("shows a generic error on non-401 failures", async () => {
    vi.mocked(login).mockRejectedValue(new Error("Network error"));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("Username"), "testuser");
    await user.type(screen.getByPlaceholderText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });
  });
});
