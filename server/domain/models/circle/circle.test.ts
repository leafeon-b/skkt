import {
  createCircle,
  renameCircle,
} from "@/server/domain/models/circle/circle";
import { circleId } from "@/server/domain/common/ids";
import { describe, expect, test } from "vitest";

describe("Circle ドメイン", () => {
  test("createCircle は名前をトリムして受け入れる", () => {
    const circle = createCircle({ id: circleId("circle-1"), name: "  Home " });
    expect(circle.name).toBe("Home");
    expect(circle.createdAt).toBeInstanceOf(Date);
  });

  test("createCircle は空名を拒否する", () => {
    expect(() =>
      createCircle({ id: circleId("circle-1"), name: "  " }),
    ).toThrow("Circle name is required");
  });

  test("renameCircle は名前を更新する", () => {
    const circle = createCircle({ id: circleId("circle-1"), name: "Home" });
    const renamed = renameCircle(circle, "  Next ");
    expect(renamed.name).toBe("Next");
  });

  test("renameCircle は空名を拒否する", () => {
    const circle = createCircle({ id: circleId("circle-1"), name: "Home" });
    expect(() => renameCircle(circle, "  ")).toThrow("Circle name is required");
  });
});
