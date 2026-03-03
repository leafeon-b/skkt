/**
 * SECURITY: これらのバリデーション関数は BadRequestError を throw し、
 * そのメッセージはクライアントへそのまま返される。
 * field / label 引数には開発者が定義した文字列リテラルのみを渡すこと。
 * ユーザー入力を渡してはならない。
 */
import { BadRequestError } from "./errors";

export const assertNonEmpty = (value: string, field: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new BadRequestError(`${field} is required`);
  }
  return trimmed;
};

export const assertMaxLength = (
  value: string,
  maxLength: number,
  field: string,
): string => {
  if (value.length > maxLength) {
    throw new BadRequestError(
      `${field} must be at most ${maxLength} characters`,
    );
  }
  return value;
};

export const assertPositiveInteger = (value: number, field: string): number => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new BadRequestError(`${field} must be a positive integer`);
  }
  return value;
};

export const assertValidDate = (value: Date, field: string): Date => {
  if (Number.isNaN(value.getTime())) {
    throw new BadRequestError(`${field} must be a valid date`);
  }
  return value;
};

export const assertStartBeforeEnd = (
  startsAt: Date,
  endsAt: Date,
  field: string,
): void => {
  if (startsAt.getTime() > endsAt.getTime()) {
    throw new BadRequestError(`${field} start must be before or equal to end`);
  }
};

export const assertDifferentIds = (
  left: string,
  right: string,
  field: string,
): void => {
  if (left === right) {
    throw new BadRequestError(`${field} must be different`);
  }
};
