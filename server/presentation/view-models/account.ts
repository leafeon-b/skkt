import type { ProfileVisibilityDto } from "@/server/presentation/dto/user";

export type AccountViewModel = {
  name: string;
  email: string;
  image: string | null;
  hasPassword: boolean;
  profileVisibility: ProfileVisibilityDto;
  emailEnabled: boolean;
};
