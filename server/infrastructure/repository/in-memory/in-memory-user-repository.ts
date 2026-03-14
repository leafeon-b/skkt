import type {
  UserRepository,
  SignupData,
} from "@/server/domain/models/user/user-repository";
import type { User, ProfileVisibility } from "@/server/domain/models/user/user";
import type { UserId } from "@/server/domain/common/ids";
import { toUserId } from "@/server/domain/common/ids";
import { ConflictError } from "@/server/domain/common/errors";
import { randomUUID } from "crypto";

type UserRecord = User & {
  passwordHash: string | null;
  passwordChangedAt: Date | null;
  imageData?: Buffer;
  imageMimeType?: string;
};

export type UserStore = Map<string, UserRecord>;

export const createInMemoryUserRepository = (
  store: UserStore = new Map(),
): UserRepository & { readonly _store: UserStore } => ({
  _store: store,

  async findById(id: UserId): Promise<User | null> {
    const record = store.get(id);
    return record ? toUser(record) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    for (const record of store.values()) {
      if (record.email === email) {
        return toUser(record);
      }
    }
    return null;
  },

  async findByIds(ids: readonly UserId[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const uniqueIds = Array.from(new Set(ids));
    return uniqueIds
      .map((id) => store.get(id))
      .filter((r): r is UserRecord => r != null)
      .map(toUser);
  },

  async save(user: User): Promise<void> {
    const existing = store.get(user.id);
    store.set(user.id, {
      ...user,
      passwordHash: existing?.passwordHash ?? null,
      passwordChangedAt: existing?.passwordChangedAt ?? null,
    });
  },

  async updateProfile(
    id: UserId,
    name: string | null,
    email: string | null,
  ): Promise<void> {
    const existing = store.get(id);
    if (existing) {
      store.set(id, { ...existing, name, email });
    }
  },

  async emailExists(email: string, excludeUserId?: UserId): Promise<boolean> {
    for (const record of store.values()) {
      if (record.email === email) {
        if (excludeUserId != null && record.id === excludeUserId) continue;
        return true;
      }
    }
    return false;
  },

  async findPasswordHashById(id: UserId): Promise<string | null> {
    return store.get(id)?.passwordHash ?? null;
  },

  async findPasswordChangedAt(id: UserId): Promise<Date | null> {
    return store.get(id)?.passwordChangedAt ?? null;
  },

  async updatePasswordHash(
    id: UserId,
    passwordHash: string,
    passwordChangedAt: Date,
  ): Promise<void> {
    const existing = store.get(id);
    if (existing) {
      store.set(id, { ...existing, passwordHash, passwordChangedAt });
    }
  },

  async updateProfileVisibility(
    id: UserId,
    visibility: ProfileVisibility,
  ): Promise<void> {
    const existing = store.get(id);
    if (existing) {
      store.set(id, { ...existing, profileVisibility: visibility });
    }
  },

  async saveImageData(
    id: UserId,
    data: Buffer,
    mimeType: string,
  ): Promise<void> {
    const existing = store.get(id);
    if (existing) {
      existing.imageData = data;
      existing.imageMimeType = mimeType;
      existing.image = `/api/avatar/${id}`;
    }
  },

  async findImageData(
    id: UserId,
  ): Promise<{ data: Buffer; mimeType: string } | null> {
    const existing = store.get(id);
    if (existing?.imageData && existing?.imageMimeType) {
      return { data: existing.imageData, mimeType: existing.imageMimeType };
    }
    return null;
  },

  async createUser(data: SignupData): Promise<UserId> {
    for (const record of store.values()) {
      if (record.email === data.email) {
        throw new ConflictError("User already exists");
      }
    }
    const id = toUserId(randomUUID());
    const record: UserRecord = {
      id,
      name: data.name,
      email: data.email,
      image: null,
      profileVisibility: "PUBLIC",
      createdAt: new Date(),
      passwordHash: data.passwordHash,
      passwordChangedAt: null,
    };
    store.set(id, record);
    return id;
  },
});

function toUser(record: UserRecord): User {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    image: record.image,
    profileVisibility: record.profileVisibility,
    createdAt: record.createdAt,
  };
}
