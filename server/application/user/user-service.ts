import type { User } from "@/server/domain/models/user/user";
import type { UserId } from "@/server/domain/common/ids";
import type { UserRepository } from "@/server/domain/models/user/user-repository";
import type { createAccessService } from "@/server/application/authz/access-service";
import { ForbiddenError } from "@/server/domain/common/errors";

type AccessService = ReturnType<typeof createAccessService>;

export type UserServiceDeps = {
  userRepository: UserRepository;
  accessService: AccessService;
};

export const createUserService = (deps: UserServiceDeps) => ({
  async getUser(actorId: string, id: UserId): Promise<User | null> {
    const allowed = await deps.accessService.canViewUser(actorId);
    if (!allowed) {
      throw new ForbiddenError();
    }
    return deps.userRepository.findById(id);
  },

  async listUsers(actorId: string, ids: readonly UserId[]): Promise<User[]> {
    const allowed = await deps.accessService.canViewUser(actorId);
    if (!allowed) {
      throw new ForbiddenError();
    }
    return deps.userRepository.findByIds(ids);
  },
});
