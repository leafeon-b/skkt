export const assertNonEmpty = (value: string, field: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
};

export const assertMaxLength = (
  value: string,
  maxLength: number,
  field: string,
): string => {
  if (value.length > maxLength) {
    throw new Error(`${field} must be at most ${maxLength} characters`);
  }
  return value;
};

export const assertPositiveInteger = (value: number, field: string): number => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
};

export const assertValidDate = (value: Date, field: string): Date => {
  if (Number.isNaN(value.getTime())) {
    throw new Error(`${field} must be a valid date`);
  }
  return value;
};

export const assertStartBeforeEnd = (
  startsAt: Date,
  endsAt: Date,
  field: string,
): void => {
  if (startsAt.getTime() > endsAt.getTime()) {
    throw new Error(`${field} start must be before or equal to end`);
  }
};

export const assertDifferentIds = (
  left: string,
  right: string,
  field: string,
): void => {
  if (left === right) {
    throw new Error(`${field} must be different`);
  }
};
