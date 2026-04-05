import { describe, it, expect, beforeEach } from "vitest";
import { hexToRgba, formatDate, formatFullDate, isAuthenticated, clearTokens, ApiError } from "@/lib/api";

describe("isAuthenticated", () => {
  beforeEach(() => localStorage.clear());

  it("returns false when no access token is stored", () => {
    expect(isAuthenticated()).toBe(false);
  });

  it("returns true when an access token is present", () => {
    localStorage.setItem("access_token", "tok");
    expect(isAuthenticated()).toBe(true);
  });
});

describe("clearTokens", () => {
  it("removes both tokens from localStorage", () => {
    localStorage.setItem("access_token", "access");
    localStorage.setItem("refresh_token", "refresh");
    clearTokens();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
  });
});

describe("ApiError", () => {
  it("stores status and message", () => {
    const err = new ApiError(404, "Not found");
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
  });

  it("is an instance of Error with name ApiError", () => {
    const err = new ApiError(500, "fail");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ApiError");
  });
});

describe("hexToRgba", () => {
  it("converts a hex color to rgba", () => {
    expect(hexToRgba("#ff0000", 1)).toBe("rgba(255, 0, 0, 1)");
    expect(hexToRgba("#00ff00", 0.5)).toBe("rgba(0, 255, 0, 0.5)");
    expect(hexToRgba("#0000ff", 0)).toBe("rgba(0, 0, 255, 0)");
  });

  it("handles mixed case hex values", () => {
    expect(hexToRgba("#FF5733", 0.8)).toBe("rgba(255, 87, 51, 0.8)");
    expect(hexToRgba("#ff5733", 0.8)).toBe("rgba(255, 87, 51, 0.8)");
  });

  it("handles black and white", () => {
    expect(hexToRgba("#000000", 1)).toBe("rgba(0, 0, 0, 1)");
    expect(hexToRgba("#ffffff", 1)).toBe("rgba(255, 255, 255, 1)");
  });
});

describe("formatDate", () => {
  it('returns "today" for the current datetime', () => {
    expect(formatDate(new Date().toISOString())).toBe("today");
  });

  it('returns "yesterday" for 25 hours ago', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(formatDate(yesterday.toISOString())).toBe("yesterday");
  });

  it("returns a short month + day for older dates", () => {
    const old = new Date("2020-06-15T12:00:00Z");
    expect(formatDate(old.toISOString())).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
  });
});

describe("formatFullDate", () => {
  it("separates date and time with 'at'", () => {
    const result = formatFullDate("2024-07-21T20:35:00.000Z");
    expect(result).toContain(" at ");
  });

  it("includes the year", () => {
    const result = formatFullDate("2024-07-21T20:35:00.000Z");
    expect(result).toContain("2024");
  });

  it("formats time with am/pm", () => {
    const result = formatFullDate("2024-07-21T20:35:00.000Z");
    expect(result).toMatch(/am|pm/i);
  });

  it("formats minutes with two digits", () => {
    const result = formatFullDate("2024-07-21T20:05:00.000Z");
    expect(result).toMatch(/:\d{2}/);
  });
});
