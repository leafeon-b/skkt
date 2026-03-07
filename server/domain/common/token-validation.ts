const UNSUBSCRIBE_TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;
const UNSUBSCRIBE_TOKEN_MIN_LENGTH = 20;
const UNSUBSCRIBE_TOKEN_MAX_LENGTH = 256;

export const isValidUnsubscribeToken = (token: string): boolean =>
  UNSUBSCRIBE_TOKEN_PATTERN.test(token) &&
  token.length >= UNSUBSCRIBE_TOKEN_MIN_LENGTH &&
  token.length <= UNSUBSCRIBE_TOKEN_MAX_LENGTH;
