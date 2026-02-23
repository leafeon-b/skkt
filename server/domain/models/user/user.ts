import type { UserId } from "@/server/domain/common/ids";

export const ProfileVisibility = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
} as const;

export type ProfileVisibility =
  (typeof ProfileVisibility)[keyof typeof ProfileVisibility];

export type User = {
  id: UserId;
  name: string | null;
  email: string | null;
  image: string | null;
  profileVisibility: ProfileVisibility;
  createdAt: Date;
};

export type UserCreateParams = {
  id: UserId;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  profileVisibility?: ProfileVisibility;
  createdAt?: Date;
};

export const createUser = (params: UserCreateParams): User => ({
  id: params.id,
  name: params.name ?? null,
  email: params.email ?? null,
  image: params.image ?? null,
  profileVisibility: params.profileVisibility ?? ProfileVisibility.PUBLIC,
  createdAt: params.createdAt ?? new Date(),
});
