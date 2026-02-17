import type { UserId } from "@/server/domain/common/ids";
import type { User } from "@/server/domain/models/user/user";

export type UserRepository = {
  findById(id: UserId): Promise<User | null>;
  findByIds(ids: readonly UserId[]): Promise<User[]>;
  save(user: User): Promise<void>;
  updateProfile(
    id: UserId,
    name: string | null,
    email: string | null,
  ): Promise<void>;
  emailExists(email: string, excludeUserId: UserId): Promise<boolean>;
  findPasswordHashById(id: UserId): Promise<string | null>;
  updatePasswordHash(id: UserId, passwordHash: string): Promise<void>;
};
