import type { User as PrismaUser } from "@/generated/prisma/client";
import { createUser } from "@/server/domain/models/user/user";
import type { User } from "@/server/domain/models/user/user";
import { userId } from "@/server/domain/common/ids";
import { toPersistenceId } from "@/server/infrastructure/common/id-utils";

export const mapUserToDomain = (user: PrismaUser): User =>
  createUser({
    id: userId(user.id),
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
  });

export const mapUserToPersistence = (user: User) => ({
  id: toPersistenceId(user.id),
  name: user.name,
  email: user.email,
  image: user.image,
  createdAt: user.createdAt,
});
