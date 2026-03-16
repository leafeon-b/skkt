import {
  USER_NAME_MAX_LENGTH,
  USER_EMAIL_MAX_LENGTH,
} from "@/server/domain/models/user/user";

export const PROFILE_ERROR_MESSAGES = {
  emailRequired: "メールアドレスを入力してください。",
  emailTooLong: `メールアドレスは${USER_EMAIL_MAX_LENGTH}文字以内で入力してください。`,
  nameTooLong: `名前は${USER_NAME_MAX_LENGTH}文字以内で入力してください。`,
} as const;
