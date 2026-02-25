import type { UserId } from "@/server/domain/common/ids";
import type { User, ProfileVisibility } from "@/server/domain/models/user/user";

export type SignupData = {
  email: string;
  passwordHash: string;
  name: string | null;
};

export type UserRepository = {
  findById(id: UserId): Promise<User | null>;
  findByIds(ids: readonly UserId[]): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  updateProfile(
    id: UserId,
    name: string | null,
    email: string | null,
  ): Promise<void>;
  emailExists(email: string, excludeUserId?: UserId): Promise<boolean>;
  findPasswordHashById(id: UserId): Promise<string | null>;
  findPasswordChangedAt(id: UserId): Promise<Date | null>;
  updatePasswordHash(
    id: UserId,
    passwordHash: string,
    passwordChangedAt: Date,
  ): Promise<void>;
  updateProfileVisibility(
    id: UserId,
    visibility: ProfileVisibility,
  ): Promise<void>;
  createUser(data: SignupData): Promise<UserId>;
};
