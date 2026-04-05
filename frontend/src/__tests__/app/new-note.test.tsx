import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import NewNotePage from "@/app/(protected)/notes/new/page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getCategories: vi.fn(),
  createNote: vi.fn(),
  hexToRgba: (_hex: string, alpha: number) => `rgba(0,0,0,${alpha})`,
}));

const mockCategory = { id: "cat-1", name: "Work", color: "#4ECDC4", createdAt: "" };
const mockNote = {
  id: "note-new",
  title: "My Note",
  body: "",
  category: mockCategory,
  createdAt: "2024-01-01T12:00:00Z",
  updatedAt: "2024-01-01T12:00:00Z",
};

describe("NewNotePage", () => {
  const mockReplace = vi.fn();
  const mockBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
      back: mockBack,
      push: vi.fn(),
      prefetch: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    } as ReturnType<typeof useRouter>);
    vi.mocked(api.getCategories).mockResolvedValue([mockCategory]);
  });

  it("renders the title and body inputs", async () => {
    render(<NewNotePage />);
    expect(screen.getByPlaceholderText("Note Title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/start writing/i)).toBeInTheDocument();
  });

  it("loads and shows categories in the selector", async () => {
    render(<NewNotePage />);
    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });
  });

  it("disables Save when title is empty", async () => {
    render(<NewNotePage />);
    await waitFor(() => screen.getByText("Work"));
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  it("enables Save once a title is typed", async () => {
    const user = userEvent.setup();
    render(<NewNotePage />);
    await waitFor(() => screen.getByText("Work"));

    await user.type(screen.getByPlaceholderText("Note Title"), "My Note");
    expect(screen.getByRole("button", { name: /save/i })).not.toBeDisabled();
  });

  it("calls createNote with the correct payload and redirects to /", async () => {
    vi.mocked(api.createNote).mockResolvedValue(mockNote);
    const user = userEvent.setup();
    render(<NewNotePage />);
    await waitFor(() => screen.getByText("Work"));

    await user.type(screen.getByPlaceholderText("Note Title"), "My Note");
    await user.type(screen.getByPlaceholderText(/start writing/i), "Body text");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(api.createNote).toHaveBeenCalledWith({
        title: "My Note",
        body: "Body text",
        categoryId: "cat-1",
      });
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("shows an error message when createNote fails", async () => {
    vi.mocked(api.createNote).mockRejectedValue(new Error("Server error"));
    const user = userEvent.setup();
    render(<NewNotePage />);
    await waitFor(() => screen.getByText("Work"));

    await user.type(screen.getByPlaceholderText("Note Title"), "My Note");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to save note.")).toBeInTheDocument();
    });
  });

  it("goes back when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<NewNotePage />);
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockBack).toHaveBeenCalled();
  });
});
