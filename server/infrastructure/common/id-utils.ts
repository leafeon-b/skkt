/**
 * Branded型のIDを永続化用の文字列に変換する。
 * Branded型は実行時には単なる文字列だが、型システム上は異なる型として扱われる。
 * Infrastructure層でPrismaに渡す際に使用する。
 */
export const toPersistenceId = <T extends string>(id: T): string => id;

/**
 * Branded型のID配列を永続化用の文字列配列に変換する。
 */
export const toPersistenceIds = <T extends string>(
  ids: readonly T[],
): string[] => ids.map((id) => id);
