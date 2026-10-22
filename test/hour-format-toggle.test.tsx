import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HourFormatToggle from "../src/components/clock/HourFormatToggle";
import { $preferences } from "../src/stores/preferences";
import { DEFAULT_PREFERENCES } from "../src/lib/storage/preferences";

describe("HourFormatToggle", () => {
  beforeEach(() => {
    $preferences.set(DEFAULT_PREFERENCES);
  });

  it("marks 12h as pressed by default and switches on click", () => {
    render(<HourFormatToggle />);
    const btn12 = screen.getByRole("button", { name: "12h" });
    const btn24 = screen.getByRole("button", { name: "24h" });

    expect(btn12).toHaveAttribute("aria-pressed", "true");
    expect(btn24).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(btn24);

    expect(btn24).toHaveAttribute("aria-pressed", "true");
    expect(btn12).toHaveAttribute("aria-pressed", "false");
    expect($preferences.get().hour12).toBe(false);
  });
});
