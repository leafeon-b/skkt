import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const HASH_PREFIX = "scrypt";
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export const hashPassword = (password: string): string => {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  return [
    HASH_PREFIX,
    salt.toString("base64"),
    derivedKey.toString("base64"),
  ].join("$");
};

export const verifyPassword = (
  password: string,
  hashedValue: string
): boolean => {
  const [prefix, saltBase64, keyBase64] = hashedValue.split("$");
  if (prefix !== HASH_PREFIX || !saltBase64 || !keyBase64) {
    return false;
  }
  const salt = Buffer.from(saltBase64, "base64");
  const storedKey = Buffer.from(keyBase64, "base64");
  const derivedKey = scryptSync(password, salt, storedKey.length);
  return timingSafeEqual(derivedKey, storedKey);
};
