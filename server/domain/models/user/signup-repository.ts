import type { UserId } from "@/server/domain/common/ids";

export type SignupData = {
  email: string;
  password: string;
  name: string | null;
};

export type SignupRepository = {
  emailExists(email: string): Promise<boolean>;
  createUser(data: SignupData): Promise<UserId>;
};
