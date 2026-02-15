// @vitest-environment jsdom
/**
 * Keyboard navigation tests for SessionCalendar.
 *
 * FullCalendar does not render in jsdom, so we build a minimal DOM that
 * mirrors the structure FullCalendar produces and re-import only the
 * component to exercise the keyboard-support effect.
 */
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Stub FullCalendar so the component can mount without the real library ──

vi.mock("@fullcalendar/react", () => ({
  default: () => null,
}));
vi.mock("@fullcalendar/daygrid", () => ({ default: {} }));
vi.mock("@fullcalendar/interaction", () => ({ default: {} }));

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a 7-column grid of `.fc-daygrid-day` cells inside a container. */
function buildGrid(
  rows: number,
  opts?: { todayIndex?: number },
): HTMLDivElement {
  const container = document.createElement("div");
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 7; c++) {
      const cell = document.createElement("td");
      cell.classList.add("fc-daygrid-day");
      const idx = r * 7 + c;
      const day = String(idx + 1).padStart(2, "0");
      cell.setAttribute("data-date", `2025-01-${day}`);
      if (opts?.todayIndex === idx) {
        cell.classList.add("fc-day-today");
      }
      container.appendChild(cell);
    }
  }
  return container;
}

function press(el: HTMLElement, key: string) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(event);
  return event;
}

afterEach(() => {
  cleanup();
});

// We need the real module to trigger the useEffect.
// Instead of rendering the full component (which needs FullCalendar), we
// directly test the keyboard logic by importing the component with mocked FC
// and interacting with the container DOM that the effect attaches to.

describe("SessionCalendar keyboard navigation", () => {
  let container: HTMLDivElement;

  beforeEach(async () => {
    // Dynamically import after mocks are set up
    const mod = await import("./session-calendar");

    container = document.createElement("div");
    document.body.appendChild(container);

    // Build a 5×7 grid inside the container
    const grid = buildGrid(5, { todayIndex: 10 });
    // We'll render the component – its useEffect will attach to containerRef
    // But since FC is stubbed, we need to manually insert the grid DOM
    // and then render the component pointing to our container.

    // Instead, let's just render the component and inject grid into it.
    const { container: rendered } = render(
      <mod.SessionCalendar onDateClick={() => {}} />,
      { container },
    );

    // The component renders a div[ref] > FullCalendar(null).
    // We need to inject our grid cells into that div.
    const wrapper = rendered.querySelector("[role='region']")!;
    const gridDom = buildGrid(5, { todayIndex: 10 });
    while (gridDom.firstChild) {
      wrapper.appendChild(gridDom.firstChild);
    }

    // Trigger MutationObserver by waiting a tick
    await new Promise((r) => setTimeout(r, 0));
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  function getCells(): HTMLElement[] {
    return Array.from(
      container.querySelectorAll<HTMLElement>(".fc-daygrid-day"),
    );
  }

  it("sets roving tabindex: today cell has tabindex=0, others have -1", () => {
    const cells = getCells();
    cells.forEach((cell, i) => {
      if (i === 10) {
        expect(cell.getAttribute("tabindex")).toBe("0");
      } else {
        expect(cell.getAttribute("tabindex")).toBe("-1");
      }
    });
  });

  it("sets aria-current='date' on today's cell", () => {
    const cells = getCells();
    expect(cells[10].getAttribute("aria-current")).toBe("date");
    // Other cells should not have aria-current
    expect(cells[0].hasAttribute("aria-current")).toBe(false);
    expect(cells[5].hasAttribute("aria-current")).toBe(false);
  });

  it("ArrowRight moves focus to the next cell", () => {
    const cells = getCells();
    cells[10].focus();
    press(cells[10], "ArrowRight");

    expect(cells[10].getAttribute("tabindex")).toBe("-1");
    expect(cells[11].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(cells[11]);
  });

  it("ArrowLeft moves focus to the previous cell", () => {
    const cells = getCells();
    cells[10].focus();
    press(cells[10], "ArrowLeft");

    expect(cells[10].getAttribute("tabindex")).toBe("-1");
    expect(cells[9].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(cells[9]);
  });

  it("ArrowUp moves focus up one row (7 cells)", () => {
    const cells = getCells();
    cells[10].focus();
    press(cells[10], "ArrowUp");

    expect(cells[10].getAttribute("tabindex")).toBe("-1");
    expect(cells[3].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(cells[3]);
  });

  it("ArrowDown moves focus down one row (7 cells)", () => {
    const cells = getCells();
    cells[10].focus();
    press(cells[10], "ArrowDown");

    expect(cells[10].getAttribute("tabindex")).toBe("-1");
    expect(cells[17].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(cells[17]);
  });

  it("Home moves focus to the start of the current row", () => {
    const cells = getCells();
    cells[10].focus();
    press(cells[10], "Home");

    expect(cells[10].getAttribute("tabindex")).toBe("-1");
    expect(cells[7].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(cells[7]);
  });

  it("End moves focus to the end of the current row", () => {
    const cells = getCells();
    cells[10].focus();
    press(cells[10], "End");

    expect(cells[10].getAttribute("tabindex")).toBe("-1");
    expect(cells[13].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(cells[13]);
  });

  it("does not move past the first cell (ArrowLeft at index 0)", () => {
    const cells = getCells();
    // First move focus to cell 0
    cells[10].setAttribute("tabindex", "-1");
    cells[0].setAttribute("tabindex", "0");
    cells[0].focus();

    press(cells[0], "ArrowLeft");

    expect(cells[0].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(cells[0]);
  });

  it("does not move past the last cell (ArrowRight at last index)", () => {
    const cells = getCells();
    const last = cells.length - 1;
    // Move focus to last cell
    cells[10].setAttribute("tabindex", "-1");
    cells[last].setAttribute("tabindex", "0");
    cells[last].focus();

    press(cells[last], "ArrowRight");

    expect(cells[last].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(cells[last]);
  });

  it("does not move past the top row (ArrowUp at row 0)", () => {
    const cells = getCells();
    // Move focus to cell 3 (first row)
    cells[10].setAttribute("tabindex", "-1");
    cells[3].setAttribute("tabindex", "0");
    cells[3].focus();

    press(cells[3], "ArrowUp");

    expect(cells[3].getAttribute("tabindex")).toBe("0");
    expect(document.activeElement).toBe(cells[3]);
  });

  it("Enter triggers onDateClick", () => {
    const onDateClick = vi.fn();

    // Re-render with the spy
    document.body.innerHTML = "";
    const newContainer = document.createElement("div");
    document.body.appendChild(newContainer);
    container = newContainer;

    // We need to dynamically import again for the new render
    return import("./session-calendar").then(async (mod) => {
      const { container: rendered } = render(
        <mod.SessionCalendar onDateClick={onDateClick} />,
        { container: newContainer },
      );

      const wrapper = rendered.querySelector("[role='region']")!;
      const gridDom = buildGrid(5, { todayIndex: 10 });
      while (gridDom.firstChild) {
        wrapper.appendChild(gridDom.firstChild);
      }

      await new Promise((r) => setTimeout(r, 0));

      const cells = getCells();
      cells[10].focus();
      press(cells[10], "Enter");

      expect(onDateClick).toHaveBeenCalledOnce();
      expect(onDateClick).toHaveBeenCalledWith(
        expect.objectContaining({
          dateStr: "2025-01-11",
          allDay: true,
        }),
      );
    });
  });

  it("Space triggers onDateClick", () => {
    const onDateClick = vi.fn();

    document.body.innerHTML = "";
    const newContainer = document.createElement("div");
    document.body.appendChild(newContainer);
    container = newContainer;

    return import("./session-calendar").then(async (mod) => {
      const { container: rendered } = render(
        <mod.SessionCalendar onDateClick={onDateClick} />,
        { container: newContainer },
      );

      const wrapper = rendered.querySelector("[role='region']")!;
      const gridDom = buildGrid(5, { todayIndex: 10 });
      while (gridDom.firstChild) {
        wrapper.appendChild(gridDom.firstChild);
      }

      await new Promise((r) => setTimeout(r, 0));

      const cells = getCells();
      cells[10].focus();
      press(cells[10], " ");

      expect(onDateClick).toHaveBeenCalledOnce();
    });
  });
});
