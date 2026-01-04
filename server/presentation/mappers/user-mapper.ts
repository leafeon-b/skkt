import type { User } from "@/server/domain/models/user/user";
import { userDtoSchema, type UserDto } from "@/server/presentation/dto/user";

const normalizeOptionalText = (value: string | null) => {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const toUserDto = (user: User): UserDto =>
  userDtoSchema.parse({
    ...user,
    name: normalizeOptionalText(user.name),
    email: normalizeOptionalText(user.email),
    image: normalizeOptionalText(user.image),
  });

export const toUserDtos = (users: User[]): UserDto[] =>
  users.map(toUserDto);
