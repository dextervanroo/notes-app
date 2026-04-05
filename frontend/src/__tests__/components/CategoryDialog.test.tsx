import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryDialog from "@/components/CategoryDialog";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  createCategory: vi.fn(),
}));

// SketchPicker relies on canvas APIs not available in jsdom — stub it out
vi.mock("react-color", () => ({
  SketchPicker: () => null,
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

describe("CategoryDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<CategoryDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("New Category")).not.toBeInTheDocument();
  });

  it("renders the form when isOpen is true", () => {
    render(<CategoryDialog {...defaultProps} />);
    expect(screen.getByText("New Category")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\., Work/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("shows a validation error when submitting with an empty name", async () => {
    const user = userEvent.setup();
    render(<CategoryDialog {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /create/i }));

    expect(screen.getByText("Category name is required")).toBeInTheDocument();
  });

  it("calls onClose when the cancel button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CategoryDialog {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls createCategory with the name and initial color on submit", async () => {
    const mockCategory = { id: "1", name: "Work", color: "#4ECDC4", createdAt: "" };
    vi.mocked(api.createCategory).mockResolvedValue(mockCategory);
    const user = userEvent.setup();
    render(<CategoryDialog {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/e\.g\., Work/i), "Work");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(api.createCategory).toHaveBeenCalledWith("Work", "#4ECDC4");
    });
  });

  it("calls onSuccess with the created category and closes the dialog", async () => {
    const mockCategory = { id: "1", name: "Work", color: "#4ECDC4", createdAt: "" };
    vi.mocked(api.createCategory).mockResolvedValue(mockCategory);
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CategoryDialog {...defaultProps} onSuccess={onSuccess} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText(/e\.g\., Work/i), "Work");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockCategory);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows an error message when createCategory fails", async () => {
    vi.mocked(api.createCategory).mockRejectedValue(new Error("Server error"));
    const user = userEvent.setup();
    render(<CategoryDialog {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/e\.g\., Work/i), "Work");
    await user.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });
});
