import { act } from "react";
import { createElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import DeviceClock from "../src/components/clock/DeviceClock";
import TimeExplorer from "../src/components/explorer/TimeExplorer";
import { $liveNow, $mode } from "../src/stores/clock";

const BUILD_TIME = Date.UTC(2026, 10, 9, 14, 5, 0);
const LATER_TIME = Date.UTC(2026, 10, 10, 8, 15, 0);

function ClockSurface() {
  return createElement(
    "div",
    null,
    createElement(DeviceClock),
    createElement(TimeExplorer),
  );
}

describe("homepage clock hydration", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    $mode.set("live");
  });

  it("keeps the server HTML and the first client render on the same placeholder", async () => {
    $liveNow.set(BUILD_TIME);
    const html = renderToString(createElement(ClockSurface));
    expect(html).toContain("––:––");
    expect(html).toContain("––:–– UTC");
    expect(html).not.toContain("14:05");
    expect(html).not.toContain("2026-11-09");

    $liveNow.set(LATER_TIME);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    const errors: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      errors.push(args.map((arg) => String(arg)).join(" "));
    };

    await act(async () => {
      hydrateRoot(container, createElement(ClockSurface));
    });
    console.error = originalError;

    expect(errors.join("\n")).not.toMatch(/418|did not match|Hydration/);
    expect(container.textContent).toContain("08:15 UTC");
    expect(container.textContent).not.toContain("––:–– UTC");
  });

  it("still renders a city-independent device label after the clock starts", async () => {
    $liveNow.set(LATER_TIME);
    const container = document.createElement("div");
    document.body.appendChild(container);
    await act(async () => {
      createRoot(container).render(createElement(DeviceClock));
    });
    expect(container.textContent).toMatch(/\d{1,2}:\d{2}/);
    expect(container.textContent).not.toContain("––:––");
  });
});
