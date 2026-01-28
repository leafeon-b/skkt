import { describe, expect, test } from "vitest";
import {
  assertSingleCircleOwner,
  assertSingleCircleSessionOwner,
  transferCircleOwnership,
  transferCircleSessionOwnership,
} from "@/server/domain/services/authz/ownership";
import { userId } from "@/server/domain/common/ids";
import {
  CircleRole,
  CircleSessionRole,
} from "@/server/domain/services/authz/roles";

describe("Owner の不変条件", () => {
  test("assertSingleCircleOwner は Owner がいない場合に失敗する", () => {
    expect(() =>
      assertSingleCircleOwner([
        { userId: userId("user-1"), role: CircleRole.CircleManager },
      ]),
    ).toThrow("Circle must have exactly one owner");
  });

  test("assertSingleCircleOwner は Owner が複数いる場合に失敗する", () => {
    expect(() =>
      assertSingleCircleOwner([
        { userId: userId("user-1"), role: CircleRole.CircleOwner },
        { userId: userId("user-2"), role: CircleRole.CircleOwner },
      ]),
    ).toThrow("Circle must have exactly one owner");
  });

  test("assertSingleCircleOwner は Owner が 1 人なら通る", () => {
    expect(() =>
      assertSingleCircleOwner([
        { userId: userId("user-1"), role: CircleRole.CircleOwner },
        { userId: userId("user-2"), role: CircleRole.CircleMember },
      ]),
    ).not.toThrow();
  });

  test("transferCircleOwnership は Owner を移譲する", () => {
    const members = [
      { userId: userId("user-1"), role: CircleRole.CircleOwner },
      { userId: userId("user-2"), role: CircleRole.CircleMember },
    ];

    const updated = transferCircleOwnership(
      members,
      userId("user-1"),
      userId("user-2"),
    );

    expect(updated).toEqual([
      { userId: userId("user-1"), role: CircleRole.CircleManager },
      { userId: userId("user-2"), role: CircleRole.CircleOwner },
    ]);
  });

  test("transferCircleOwnership は Owner 以外からの移譲を拒否する", () => {
    expect(() =>
      transferCircleOwnership(
        [
          { userId: userId("user-1"), role: CircleRole.CircleManager },
          { userId: userId("user-2"), role: CircleRole.CircleOwner },
        ],
        userId("user-1"),
        userId("user-2"),
      ),
    ).toThrow("Current owner must be CircleOwner");
  });

  test("transferCircleOwnership は移譲先がいない場合に失敗する", () => {
    expect(() =>
      transferCircleOwnership(
        [{ userId: userId("user-1"), role: CircleRole.CircleOwner }],
        userId("user-1"),
        userId("user-2"),
      ),
    ).toThrow("Target member not found");
  });

  test("transferCircleOwnership は同一ユーザーへの移譲を拒否する", () => {
    expect(() =>
      transferCircleOwnership(
        [{ userId: userId("user-1"), role: CircleRole.CircleOwner }],
        userId("user-1"),
        userId("user-1"),
      ),
    ).toThrow("owner transfer must be different");
  });

  test("assertSingleCircleSessionOwner は Owner が 1 人なら通る", () => {
    expect(() =>
      assertSingleCircleSessionOwner([
        {
          userId: userId("user-1"),
          role: CircleSessionRole.CircleSessionOwner,
        },
      ]),
    ).not.toThrow();
  });

  test("assertSingleCircleSessionOwner は Owner がいない場合に失敗する", () => {
    expect(() =>
      assertSingleCircleSessionOwner([
        {
          userId: userId("user-1"),
          role: CircleSessionRole.CircleSessionManager,
        },
      ]),
    ).toThrow("CircleSession must have exactly one owner");
  });

  test("assertSingleCircleSessionOwner は Owner が複数いる場合に失敗する", () => {
    expect(() =>
      assertSingleCircleSessionOwner([
        {
          userId: userId("user-1"),
          role: CircleSessionRole.CircleSessionOwner,
        },
        {
          userId: userId("user-2"),
          role: CircleSessionRole.CircleSessionOwner,
        },
      ]),
    ).toThrow("CircleSession must have exactly one owner");
  });

  test("transferCircleSessionOwnership は Owner を移譲する", () => {
    const members = [
      {
        userId: userId("user-1"),
        role: CircleSessionRole.CircleSessionOwner,
      },
      {
        userId: userId("user-2"),
        role: CircleSessionRole.CircleSessionMember,
      },
    ];

    const updated = transferCircleSessionOwnership(
      members,
      userId("user-1"),
      userId("user-2"),
    );

    expect(updated).toEqual([
      {
        userId: userId("user-1"),
        role: CircleSessionRole.CircleSessionManager,
      },
      {
        userId: userId("user-2"),
        role: CircleSessionRole.CircleSessionOwner,
      },
    ]);
  });

  test("transferCircleSessionOwnership は同一ユーザーへの移譲を拒否する", () => {
    expect(() =>
      transferCircleSessionOwnership(
        [
          {
            userId: userId("user-1"),
            role: CircleSessionRole.CircleSessionOwner,
          },
        ],
        userId("user-1"),
        userId("user-1"),
      ),
    ).toThrow("owner transfer must be different");
  });

  test("transferCircleSessionOwnership は Owner 以外からの移譲を拒否する", () => {
    expect(() =>
      transferCircleSessionOwnership(
        [
          {
            userId: userId("user-1"),
            role: CircleSessionRole.CircleSessionManager,
          },
          {
            userId: userId("user-2"),
            role: CircleSessionRole.CircleSessionOwner,
          },
        ],
        userId("user-1"),
        userId("user-2"),
      ),
    ).toThrow("Current owner must be CircleSessionOwner");
  });

  test("transferCircleSessionOwnership は移譲先がいない場合に失敗する", () => {
    expect(() =>
      transferCircleSessionOwnership(
        [
          {
            userId: userId("user-1"),
            role: CircleSessionRole.CircleSessionOwner,
          },
        ],
        userId("user-1"),
        userId("user-2"),
      ),
    ).toThrow("Target member not found");
  });
});
