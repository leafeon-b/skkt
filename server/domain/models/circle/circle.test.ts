import {
  createCircle,
  renameCircle,
} from "@/server/domain/models/circle/circle";
import { toCircleId } from "@/server/domain/common/ids";
import { describe, expect, test } from "vitest";

describe("Circle ドメイン", () => {
  test("createCircle は名前をトリムして受け入れる", () => {
    const circle = createCircle({ id: toCircleId("circle-1"), name: "  Home " });
    expect(circle.name).toBe("Home");
    expect(circle.createdAt).toBeInstanceOf(Date);
  });

  test("createCircle は空名を拒否する", () => {
    expect(() =>
      createCircle({ id: toCircleId("circle-1"), name: "  " }),
    ).toThrow("Circle name is required");
  });

  test("renameCircle は名前を更新する", () => {
    const circle = createCircle({ id: toCircleId("circle-1"), name: "Home" });
    const renamed = renameCircle(circle, "  Next ");
    expect(renamed.name).toBe("Next");
  });

  test("renameCircle は空名を拒否する", () => {
    const circle = createCircle({ id: toCircleId("circle-1"), name: "Home" });
    expect(() => renameCircle(circle, "  ")).toThrow("Circle name is required");
  });

  test("createCircle は50文字ちょうどの名前を受け入れる", () => {
    const name = "あ".repeat(50);
    const circle = createCircle({ id: toCircleId("circle-1"), name });
    expect(circle.name).toBe(name);
  });

  test("createCircle は51文字以上の名前を拒否する", () => {
    const name = "あ".repeat(51);
    expect(() => createCircle({ id: toCircleId("circle-1"), name })).toThrow(
      "Circle name must be at most 50 characters",
    );
  });

  test("renameCircle は51文字以上の名前を拒否する", () => {
    const circle = createCircle({ id: toCircleId("circle-1"), name: "Home" });
    const name = "あ".repeat(51);
    expect(() => renameCircle(circle, name)).toThrow(
      "Circle name must be at most 50 characters",
    );
  });
});
