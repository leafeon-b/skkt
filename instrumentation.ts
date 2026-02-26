export function register() {
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.NEXTAUTH_URL?.trim()
  ) {
    throw new Error(
      "NEXTAUTH_URL environment variable is required in production",
    );
  }
}
