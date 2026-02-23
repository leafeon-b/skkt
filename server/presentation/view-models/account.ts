import type { ProfileVisibilityDto } from "@/server/presentation/dto/user";

export type AccountViewModel = {
  name: string;
  email: string;
  hasPassword: boolean;
  profileVisibility: ProfileVisibilityDto;
};
