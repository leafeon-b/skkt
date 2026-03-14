import type {
  UserRepository,
  SignupData,
} from "@/server/domain/models/user/user-repository";
import type { User, ProfileVisibility } from "@/server/domain/models/user/user";
import type { UserId } from "@/server/domain/common/ids";
import { toUserId } from "@/server/domain/common/ids";
import { prisma, type PrismaClientLike } from "@/server/infrastructure/db";
import {
  mapUserToDomain,
  mapUserToPersistence,
} from "@/server/infrastructure/mappers/user-mapper";
import {
  toPersistenceId,
  toPersistenceIds,
} from "@/server/infrastructure/common/id-utils";
import { ConflictError } from "@/server/domain/common/errors";
import { isPrismaUniqueConstraintError } from "@/server/infrastructure/repository/lib/is-prisma-unique-constraint-error";

export const createPrismaUserRepository = (
  client: PrismaClientLike,
): UserRepository => ({
  async findById(id: UserId): Promise<User | null> {
    const found = await client.user.findUnique({
      where: { id: toPersistenceId(id) },
    });

    return found ? mapUserToDomain(found) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const found = await client.user.findUnique({
      where: { email },
    });

    return found ? mapUserToDomain(found) : null;
  },

  async findByIds(ids: readonly UserId[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }
    const uniqueIds = Array.from(new Set(toPersistenceIds(ids)));
    const users = await client.user.findMany({
      where: { id: { in: uniqueIds } },
    });

    const byId = new Map(users.map((user) => [user.id, mapUserToDomain(user)]));
    return uniqueIds
      .map((id) => byId.get(id))
      .filter((user): user is User => user != null);
  },

  async save(user: User): Promise<void> {
    const data = mapUserToPersistence(user);

    await client.user.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        email: data.email,
        image: data.image,
      },
      create: data,
    });
  },

  async updateProfile(
    id: UserId,
    name: string | null,
    email: string | null,
  ): Promise<void> {
    try {
      await client.user.update({
        where: { id: toPersistenceId(id) },
        data: { name, email },
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        const target = error.meta?.target;
        if (Array.isArray(target) && target.includes("email")) {
          throw new ConflictError("Email already in use");
        }
        throw error;
      }
      throw error;
    }
  },

  async emailExists(email: string, excludeUserId?: UserId): Promise<boolean> {
    const found = await client.user.findFirst({
      where: {
        email,
        ...(excludeUserId != null && {
          id: { not: toPersistenceId(excludeUserId) },
        }),
      },
      select: { id: true },
    });
    return found !== null;
  },

  async findPasswordHashById(id: UserId): Promise<string | null> {
    const found = await client.user.findUnique({
      where: { id: toPersistenceId(id) },
      select: { passwordHash: true },
    });
    return found?.passwordHash ?? null;
  },

  async findPasswordChangedAt(id: UserId): Promise<Date | null> {
    const found = await client.user.findUnique({
      where: { id: toPersistenceId(id) },
      select: { passwordChangedAt: true },
    });
    return found?.passwordChangedAt ?? null;
  },

  async updatePasswordHash(
    id: UserId,
    passwordHash: string,
    passwordChangedAt: Date,
  ): Promise<void> {
    await client.user.update({
      where: { id: toPersistenceId(id) },
      data: { passwordHash, passwordChangedAt },
    });
  },

  async updateProfileVisibility(
    id: UserId,
    visibility: ProfileVisibility,
  ): Promise<void> {
    await client.user.update({
      where: { id: toPersistenceId(id) },
      data: { profileVisibility: visibility },
    });
  },

  async saveImageData(
    id: UserId,
    data: Buffer,
    mimeType: string,
  ): Promise<void> {
    await client.user.update({
      where: { id: toPersistenceId(id) },
      data: {
        imageData: new Uint8Array(data),
        imageMimeType: mimeType,
        image: `/api/avatar/${toPersistenceId(id)}`,
      },
    });
  },

  async findImageData(
    id: UserId,
  ): Promise<{ data: Buffer; mimeType: string } | null> {
    const found = await client.user.findUnique({
      where: { id: toPersistenceId(id) },
      select: { imageData: true, imageMimeType: true },
    });
    if (!found?.imageData || !found.imageMimeType) {
      return null;
    }
    return { data: Buffer.from(found.imageData), mimeType: found.imageMimeType };
  },

  async createUser(data: SignupData): Promise<UserId> {
    try {
      const user = await client.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash: data.passwordHash,
        },
        select: { id: true },
      });
      return toUserId(user.id);
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        const target = error.meta?.target;
        if (Array.isArray(target) && target.includes("email")) {
          throw new ConflictError("User already exists");
        }
        throw error;
      }
      throw error;
    }
  },
});

export const prismaUserRepository = createPrismaUserRepository(prisma);
