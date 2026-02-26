// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CharacterCounter } from "./character-counter";

afterEach(cleanup);

describe("CharacterCounter", () => {
  describe("カラー遷移", () => {
    it("ratio < 0.8 → muted カラー", () => {
      render(<CharacterCounter count={39} max={50} label="文字数" />);
      const counter = screen.getByLabelText("文字数");
      expect(counter).toHaveClass("text-(--brand-ink-muted)");
    });

    it("ratio = 0.8 → amber カラー", () => {
      render(<CharacterCounter count={40} max={50} label="文字数" />);
      const counter = screen.getByLabelText("文字数");
      expect(counter).toHaveClass("text-amber-600");
    });

    it("count < max かつ ratio > 0.8 → amber カラー", () => {
      render(<CharacterCounter count={49} max={50} label="文字数" />);
      const counter = screen.getByLabelText("文字数");
      expect(counter).toHaveClass("text-amber-600");
    });

    it("count = max → destructive カラー", () => {
      render(<CharacterCounter count={50} max={50} label="文字数" />);
      const counter = screen.getByLabelText("文字数");
      expect(counter).toHaveClass("text-destructive");
    });

    it("count > max → destructive カラー", () => {
      render(<CharacterCounter count={51} max={50} label="文字数" />);
      const counter = screen.getByLabelText("文字数");
      expect(counter).toHaveClass("text-destructive");
    });
  });

  describe("aria-live", () => {
    it("ratio < 0.8 → off", () => {
      render(<CharacterCounter count={39} max={50} label="文字数" />);
      expect(screen.getByLabelText("文字数")).toHaveAttribute(
        "aria-live",
        "off",
      );
    });

    it("ratio >= 0.8 → polite", () => {
      render(<CharacterCounter count={40} max={50} label="文字数" />);
      expect(screen.getByLabelText("文字数")).toHaveAttribute(
        "aria-live",
        "polite",
      );
    });
  });

  it("表示形式が {count} / {max}", () => {
    render(<CharacterCounter count={10} max={50} label="文字数" />);
    expect(screen.getByLabelText("文字数")).toHaveTextContent("10 / 50");
  });

  it("aria-label が設定される", () => {
    render(<CharacterCounter count={0} max={50} label="研究会名の文字数" />);
    expect(
      screen.getByLabelText("研究会名の文字数"),
    ).toBeInTheDocument();
  });
});
