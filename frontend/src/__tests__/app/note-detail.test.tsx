import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useParams } from "next/navigation";
import * as api from "@/lib/api";
import NoteDetailPage from "@/app/(protected)/notes/[id]/page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getNote: vi.fn(),
  getCategories: vi.fn(),
  getMe: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  hexToRgba: (_hex: string, alpha: number) => `rgba(0,0,0,${alpha})`,
  formatFullDate: () => "July 21, 2024 at 8:35pm",
}));

const mockCategory = { id: "cat-1", name: "Work", color: "#4ECDC4", createdAt: "" };
const mockNote = {
  id: "note-123",
  title: "Test Note",
  body: "Body content",
  category: mockCategory,
  createdAt: "2024-07-21T20:35:00Z",
  updatedAt: "2024-07-21T20:35:00Z",
};

describe("NoteDetailPage", () => {
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
    vi.mocked(useParams).mockReturnValue({ id: "note-123" });
    vi.mocked(api.getNote).mockResolvedValue(mockNote);
    vi.mocked(api.getCategories).mockResolvedValue([mockCategory]);
    vi.mocked(api.getMe).mockResolvedValue({
      id: "user-1",
      username: "admin",
      email: "admin@example.com",
      dateJoined: "",
      isSuperuser: true,
    });
  });

  it("renders the note title and body", async () => {
    render(<NoteDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Test Note")).toBeInTheDocument();
      expect(screen.getByText("Body content")).toBeInTheDocument();
    });
  });

  it("shows the category name", async () => {
    render(<NoteDetailPage />);
    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });
  });

  it("shows the Last Edited timestamp", async () => {
    render(<NoteDetailPage />);
    await waitFor(() => {
      expect(screen.getByText(/Last Edited:/)).toBeInTheDocument();
    });
  });

  it("redirects to / when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<NoteDetailPage />);
    await waitFor(() => screen.getByText("Test Note"));

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("cancels edit without confirmation when nothing has changed", async () => {
    const user = userEvent.setup();
    render(<NoteDetailPage />);
    await waitFor(() => screen.getByText("Test Note"));

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByText("Test Note")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Test Note")).not.toBeInTheDocument();
  });

  it("prompts confirmation when cancelling edit with unsaved changes and confirms", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<NoteDetailPage />);
    await waitFor(() => screen.getByText("Test Note"));

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.type(screen.getByDisplayValue("Test Note"), " edited");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(window.confirm).toHaveBeenCalledWith("Discard changes? Your edits will be lost.");
    expect(screen.getByText("Test Note")).toBeInTheDocument();
  });

  it("stays in edit mode when cancel confirmation is dismissed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<NoteDetailPage />);
    await waitFor(() => screen.getByText("Test Note"));

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.type(screen.getByDisplayValue("Test Note"), " edited");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByDisplayValue("Test Note edited")).toBeInTheDocument();
  });

  it("switches to edit mode when Edit is clicked", async () => {
    const user = userEvent.setup();
    render(<NoteDetailPage />);
    await waitFor(() => screen.getByText("Test Note"));

    await user.click(screen.getByRole("button", { name: /^edit$/i }));

    expect(screen.getByDisplayValue("Test Note")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Body content")).toBeInTheDocument();
  });

  it("saves changes and redirects to / when Save is clicked", async () => {
    const updatedNote = { ...mockNote, title: "Updated Title" };
    vi.mocked(api.updateNote).mockResolvedValue(updatedNote);
    const user = userEvent.setup();
    render(<NoteDetailPage />);
    await waitFor(() => screen.getByText("Test Note"));

    await user.click(screen.getByRole("button", { name: /^edit$/i }));

    const titleInput = screen.getByDisplayValue("Test Note");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated Title");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(api.updateNote).toHaveBeenCalledWith("note-123", expect.objectContaining({
        title: "Updated Title",
      }));
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("deletes the note and redirects to / after confirmation", async () => {
    vi.mocked(api.deleteNote).mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<NoteDetailPage />);
    await waitFor(() => screen.getByText("Test Note"));

    await user.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(api.deleteNote).toHaveBeenCalledWith("note-123");
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("does not delete the note when confirmation is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<NoteDetailPage />);
    await waitFor(() => screen.getByText("Test Note"));

    await user.click(screen.getByRole("button", { name: /delete/i }));

    expect(api.deleteNote).not.toHaveBeenCalled();
  });

  it("hides the Delete button for non-superusers", async () => {
    vi.mocked(api.getMe).mockResolvedValue({
      id: "user-2",
      username: "regular",
      email: "regular@example.com",
      dateJoined: "",
      isSuperuser: false,
    });
    render(<NoteDetailPage />);
    await waitFor(() => screen.getByText("Test Note"));

    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("redirects to / when getNote fails", async () => {
    vi.mocked(api.getNote).mockRejectedValue(new Error("Not found"));
    render(<NoteDetailPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });
});
