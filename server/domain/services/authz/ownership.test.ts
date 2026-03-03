import { describe, expect, test } from "vitest";
import {
  assertCanAddCircleMemberWithRole,
  assertCanAddSessionMemberWithRole,
  assertCanChangeCircleMemberRole,
  assertCanChangeCircleSessionMemberRole,
  assertCanRemoveCircleMember,
  assertCanRemoveCircleSessionMember,
  assertCanWithdraw,
  assertCanWithdrawFromSession,
  assertSingleCircleOwner,
  assertSingleCircleSessionOwner,
  transferCircleOwnership,
  transferCircleSessionOwnership,
} from "@/server/domain/services/authz/ownership";
import { BadRequestError, ForbiddenError } from "@/server/domain/common/errors";
import { userId } from "@/server/domain/common/ids";
import { CircleRole } from "@/server/domain/models/circle/circle-role";
import { CircleSessionRole } from "@/server/domain/models/circle-session/circle-session-role";

function expectThrow<T extends Error>(
  fn: () => void,
  errorClass: new (...args: never[]) => T,
  message: string,
) {
  let caught: unknown;
  try {
    fn();
  } catch (e) {
    caught = e;
  }
  expect(caught).toBeInstanceOf(errorClass);
  expect(caught).toHaveProperty("message", message);
}

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
    ).toThrow("TargetMember not found");
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
    ).toThrow("TargetMember not found");
  });
});

describe("assertCanAddSessionMemberWithRole", () => {
  test("Owner がいない状態で Owner 以外を追加しようとするとエラー", () => {
    expectThrow(
      () =>
        assertCanAddSessionMemberWithRole(
          [],
          CircleSessionRole.CircleSessionMember,
        ),
      BadRequestError,
      "CircleSession must have exactly one owner",
    );
  });

  test("Owner がいる状態で Owner を追加しようとするとエラー", () => {
    expectThrow(
      () =>
        assertCanAddSessionMemberWithRole(
          [
            {
              userId: userId("user-1"),
              role: CircleSessionRole.CircleSessionOwner,
            },
          ],
          CircleSessionRole.CircleSessionOwner,
        ),
      BadRequestError,
      "CircleSession must have exactly one owner",
    );
  });

  test("Owner がいない状態で Owner を追加できる", () => {
    expect(() =>
      assertCanAddSessionMemberWithRole(
        [],
        CircleSessionRole.CircleSessionOwner,
      ),
    ).not.toThrow();
  });

  test("Owner がいる状態で Member を追加できる", () => {
    expect(() =>
      assertCanAddSessionMemberWithRole(
        [
          {
            userId: userId("user-1"),
            role: CircleSessionRole.CircleSessionOwner,
          },
        ],
        CircleSessionRole.CircleSessionMember,
      ),
    ).not.toThrow();
  });

  test("Owner がいる状態で Manager を追加できる", () => {
    expect(() =>
      assertCanAddSessionMemberWithRole(
        [
          {
            userId: userId("user-1"),
            role: CircleSessionRole.CircleSessionOwner,
          },
        ],
        CircleSessionRole.CircleSessionManager,
      ),
    ).not.toThrow();
  });
});

describe("assertCanWithdraw", () => {
  test("Owner は退会できない", () => {
    expectThrow(
      () => assertCanWithdraw(CircleRole.CircleOwner),
      ForbiddenError,
      "Owner cannot withdraw from circle. Use transferOwnership instead",
    );
  });

  test("Manager は退会できる", () => {
    expect(() => assertCanWithdraw(CircleRole.CircleManager)).not.toThrow();
  });

  test("Member は退会できる", () => {
    expect(() => assertCanWithdraw(CircleRole.CircleMember)).not.toThrow();
  });
});

describe("assertCanWithdrawFromSession", () => {
  test("Owner は退会できない", () => {
    expectThrow(
      () => assertCanWithdrawFromSession(CircleSessionRole.CircleSessionOwner),
      ForbiddenError,
      "Owner cannot withdraw from session. Use transferOwnership instead",
    );
  });

  test("Manager は退会できる", () => {
    expect(() =>
      assertCanWithdrawFromSession(CircleSessionRole.CircleSessionManager),
    ).not.toThrow();
  });

  test("Member は退会できる", () => {
    expect(() =>
      assertCanWithdrawFromSession(CircleSessionRole.CircleSessionMember),
    ).not.toThrow();
  });
});

describe("assertCanRemoveCircleMember", () => {
  test("Owner を削除しようとすると ForbiddenError", () => {
    expectThrow(
      () => assertCanRemoveCircleMember(CircleRole.CircleOwner),
      ForbiddenError,
      "Use transferOwnership to remove owner",
    );
  });

  test("Manager を削除できる", () => {
    expect(() =>
      assertCanRemoveCircleMember(CircleRole.CircleManager),
    ).not.toThrow();
  });

  test("Member を削除できる", () => {
    expect(() =>
      assertCanRemoveCircleMember(CircleRole.CircleMember),
    ).not.toThrow();
  });
});

describe("assertCanChangeCircleMemberRole", () => {
  test("Owner への変更は ForbiddenError", () => {
    expectThrow(
      () =>
        assertCanChangeCircleMemberRole(
          CircleRole.CircleMember,
          CircleRole.CircleOwner,
        ),
      ForbiddenError,
      "Use transferOwnership to assign owner",
    );
  });

  test("Owner からの変更は ForbiddenError", () => {
    expectThrow(
      () =>
        assertCanChangeCircleMemberRole(
          CircleRole.CircleOwner,
          CircleRole.CircleManager,
        ),
      ForbiddenError,
      "Use transferOwnership to change owner",
    );
  });

  test("Member から Manager への変更は可能", () => {
    expect(() =>
      assertCanChangeCircleMemberRole(
        CircleRole.CircleMember,
        CircleRole.CircleManager,
      ),
    ).not.toThrow();
  });

  test("Manager から Member への変更は可能", () => {
    expect(() =>
      assertCanChangeCircleMemberRole(
        CircleRole.CircleManager,
        CircleRole.CircleMember,
      ),
    ).not.toThrow();
  });
});

describe("assertCanRemoveCircleSessionMember", () => {
  test("Owner を削除しようとすると ForbiddenError", () => {
    expectThrow(
      () =>
        assertCanRemoveCircleSessionMember(
          CircleSessionRole.CircleSessionOwner,
        ),
      ForbiddenError,
      "Use transferOwnership to remove owner",
    );
  });

  test("Manager を削除できる", () => {
    expect(() =>
      assertCanRemoveCircleSessionMember(
        CircleSessionRole.CircleSessionManager,
      ),
    ).not.toThrow();
  });

  test("Member を削除できる", () => {
    expect(() =>
      assertCanRemoveCircleSessionMember(CircleSessionRole.CircleSessionMember),
    ).not.toThrow();
  });
});

describe("assertCanChangeCircleSessionMemberRole", () => {
  test("Owner への変更は ForbiddenError", () => {
    expectThrow(
      () =>
        assertCanChangeCircleSessionMemberRole(
          CircleSessionRole.CircleSessionMember,
          CircleSessionRole.CircleSessionOwner,
        ),
      ForbiddenError,
      "Use transferOwnership to assign owner",
    );
  });

  test("Owner からの変更は ForbiddenError", () => {
    expectThrow(
      () =>
        assertCanChangeCircleSessionMemberRole(
          CircleSessionRole.CircleSessionOwner,
          CircleSessionRole.CircleSessionManager,
        ),
      ForbiddenError,
      "Use transferOwnership to change owner",
    );
  });

  test("Member から Manager への変更は可能", () => {
    expect(() =>
      assertCanChangeCircleSessionMemberRole(
        CircleSessionRole.CircleSessionMember,
        CircleSessionRole.CircleSessionManager,
      ),
    ).not.toThrow();
  });

  test("Manager から Member への変更は可能", () => {
    expect(() =>
      assertCanChangeCircleSessionMemberRole(
        CircleSessionRole.CircleSessionManager,
        CircleSessionRole.CircleSessionMember,
      ),
    ).not.toThrow();
  });
});

describe("assertCanAddCircleMemberWithRole", () => {
  test("Owner がいない状態で Owner 以外を追加しようとするとエラー", () => {
    expectThrow(
      () => assertCanAddCircleMemberWithRole([], CircleRole.CircleMember),
      BadRequestError,
      "Circle must have exactly one owner",
    );
  });

  test("Owner がいる状態で Owner を追加しようとするとエラー", () => {
    expectThrow(
      () =>
        assertCanAddCircleMemberWithRole(
          [{ userId: userId("user-1"), role: CircleRole.CircleOwner }],
          CircleRole.CircleOwner,
        ),
      BadRequestError,
      "Circle must have exactly one owner",
    );
  });

  test("Owner がいない状態で Owner を追加できる", () => {
    expect(() =>
      assertCanAddCircleMemberWithRole([], CircleRole.CircleOwner),
    ).not.toThrow();
  });

  test("Owner がいる状態で Member を追加できる", () => {
    expect(() =>
      assertCanAddCircleMemberWithRole(
        [{ userId: userId("user-1"), role: CircleRole.CircleOwner }],
        CircleRole.CircleMember,
      ),
    ).not.toThrow();
  });

  test("Owner がいる状態で Manager を追加できる", () => {
    expect(() =>
      assertCanAddCircleMemberWithRole(
        [{ userId: userId("user-1"), role: CircleRole.CircleOwner }],
        CircleRole.CircleManager,
      ),
    ).not.toThrow();
  });
});
