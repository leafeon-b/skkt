export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_NAME_LENGTH = 50;

export const SIGNUP_ERROR_MESSAGES = {
  nameTooLong: `表示名は${MAX_NAME_LENGTH}文字以内で入力してください。`,
  passwordTooShort: `パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください。`,
  passwordTooLong: `パスワードは${MAX_PASSWORD_LENGTH}文字以内で入力してください。`,
  passwordMismatch: "パスワードが一致しません。",
  termsNotAgreed: "利用規約およびプライバシーポリシーに同意してください。",
  signupFailed: "登録に失敗しました。",
  loginAfterSignupFailed: "登録は完了しましたが、ログインに失敗しました。",
} as const;
