import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { register, login, ApiError } from "@/lib/api";
import RegisterPage from "@/app/register/page";

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
  register: vi.fn(),
  login: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

describe("RegisterPage", () => {
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

  it("renders the registration form", () => {
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("shows a link back to the login page", () => {
    render(<RegisterPage />);
    const link = screen.getByRole("link", { name: /already friends/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("toggles password field visibility", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const passwordInput = screen.getByPlaceholderText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show/i }));
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  it("calls register then login and redirects on success", async () => {
    vi.mocked(register).mockResolvedValue(undefined);
    vi.mocked(login).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("Username"), "newuser");
    await user.type(screen.getByPlaceholderText("Email address"), "new@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        username: "newuser",
        email: "new@example.com",
        password: "password123",
      });
      expect(login).toHaveBeenCalledWith("newuser", "password123");
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("shows the first API error message on registration failure", async () => {
    const body = JSON.stringify({ username: ["A user with that username already exists."] });
    vi.mocked(register).mockRejectedValue(new ApiError(400, body));
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("Username"), "existinguser");
    await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText("A user with that username already exists."),
      ).toBeInTheDocument();
    });
  });

  it("shows a fallback error when the API response is not JSON", async () => {
    vi.mocked(register).mockRejectedValue(new ApiError(500, "Internal Server Error"));
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("Username"), "newuser");
    await user.type(screen.getByPlaceholderText("Email address"), "new@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Registration failed. Please try again.")).toBeInTheDocument();
    });
  });
});
