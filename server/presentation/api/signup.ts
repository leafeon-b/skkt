import { createSignupService } from "@/server/application/auth/signup-service";
import { prismaSignupRepository } from "@/server/infrastructure/repository/user/prisma-signup-repository";

export const signupService = createSignupService({
  signupRepository: prismaSignupRepository,
});
