import { describe, it, expect, beforeEach } from "vitest";
import { $mode, $liveNow, $explorerInstant, $referenceInstant, enterExplorer, setExplorerInstant, returnToNow } from "../src/stores/clock";

describe("clock store: shared reference instant", () => {
  beforeEach(() => {
    $mode.set("live");
    $liveNow.set(1000);
    $explorerInstant.set(1000);
  });

  it("reads from $liveNow while in live mode", () => {
    expect($referenceInstant.get()).toBe(1000);
    $liveNow.set(2000);
    expect($referenceInstant.get()).toBe(2000);
  });

  it("switches to the explorer instant on enterExplorer, ignoring further live ticks", () => {
    enterExplorer(5000);
    expect($mode.get()).toBe("explorer");
    expect($referenceInstant.get()).toBe(5000);

    $liveNow.set(9999);
    expect($referenceInstant.get()).toBe(5000);
  });

  it("updates the explorer instant without leaving explorer mode via setExplorerInstant", () => {
    enterExplorer(5000);
    setExplorerInstant(6000);
    expect($mode.get()).toBe("explorer");
    expect($referenceInstant.get()).toBe(6000);
  });

  it("resets to live mode and the current time on returnToNow", () => {
    enterExplorer(5000);
    returnToNow();
    expect($mode.get()).toBe("live");
    // returnToNow re-reads the real clock, so just confirm we're back on $liveNow's value.
    expect($referenceInstant.get()).toBe($liveNow.get());
  });
});
